import { WP_API_URL, WP_FETCH_TIMEOUT_MS, IS_BUILD, EM_BUILD_DE_PRODUCAO, WP_BUILD_FETCH_TTL_S } from './config'

type FetchOptions = {
    revalidate?: number | false
    tags?: string[]
}

const emptyPage = <T>(): { items: T[]; total: number; totalPages: number } => ({
    items: [],
    total: 0,
    totalPages: 0,
})

/**
 * Durante o build, eleva o revalidate a um piso para que o `.next/cache`
 * montado pelo BuildKit seja de fato reaproveitado entre builds. Ver
 * WP_BUILD_FETCH_TTL_S em ./config para a medição e o custo.
 *
 * Só ELEVA: um revalidate já maior fica como está, e `false` (cache eterno)
 * passa intacto. Fora do build, devolve o que o chamador pediu.
 */
/**
 * Este fetch traz notícia?
 *
 * Notícia fica FORA do piso de cache do build: ela mantém o revalidate original
 * e é rebuscada a cada build. O risco de HTML atrasado está concentrado aqui, e
 * o ganho está nos catálogos grandes — 4.127 productions e 3.412 artists
 * publicados contra 675 posts, então excluir notícia custa pouco do benefício.
 *
 * `posts` é a tag de coleção e `post-<slug>` a de item (getWPItemTag em
 * ./cache). O prefixo é testado com o hífen justamente para não pegar
 * `productions` nem `production-<slug>`.
 */
const TAG_COLECAO_NOTICIA = 'posts'
const PREFIXO_TAG_ITEM_NOTICIA = 'post-'

function ehNoticia(tags: string[] | undefined): boolean {
    return (tags ?? []).some(
        (tag) => tag === TAG_COLECAO_NOTICIA || tag.startsWith(PREFIXO_TAG_ITEM_NOTICIA),
    )
}

function revalidateEfetivo(opts: FetchOptions): number | false {
    if (opts.revalidate === false) return false
    const base = opts.revalidate ?? 600
    if (!EM_BUILD_DE_PRODUCAO || WP_BUILD_FETCH_TTL_S === 0) return base
    if (ehNoticia(opts.tags)) return base
    return Math.max(base, WP_BUILD_FETCH_TTL_S)
}

/**
 * Retentativas SÓ durante o build. Em produção, zero.
 *
 * ── O problema ──────────────────────────────────────────────────────────────
 *
 * Um build gera ~886 páginas e faz ~2.300 fetches, com 9 workers em paralelo.
 * Uma única falha transitória em qualquer um deles faz `wpFetchPorSlug` lançar
 * `WordPressIndisponivelError`, e isso derruba o build INTEIRO:
 *
 *   Export encountered an error on /(site)/artists/[slug]/page:
 *   /artists/yoo-do-hyun-mirae, exiting the build.
 *
 * Aconteceu duas vezes em ~10 builds nesta sessão (2026-09-12). O WordPress
 * respondia normalmente quando conferi um minuto depois — era carga momentânea
 * dos próprios workers do build. No CI, isso é um deploy perdido por um blip.
 *
 * ── Por que não é "só aumentar o timeout" ───────────────────────────────────
 *
 * Aumentar o teto faz o build esperar mais por cada falha real também. O que
 * falta não é paciência num único pedido, é uma segunda chance — o mesmo
 * raciocínio do SSH com retentativa (#31) e do verificador de backup que
 * desistia na primeira tentativa (9c14a3b). Este projeto já corrigiu esta
 * classe de bug duas vezes.
 *
 * ── Por que NÃO em produção ─────────────────────────────────────────────────
 *
 * O WP_FETCH_TIMEOUT_MS acima diz o porquê: "falhe rápido na navegação
 * pública". Retentativa numa requisição de visitante troca erro rápido por
 * espera longa, e a página já tem caminho de degradação. Durante o build não há
 * visitante esperando, e o custo de falhar é um deploy inteiro.
 */
const TENTATIVAS_NO_BUILD = 3
const ESPERA_BASE_MS = 400

/** Vale retentar? Falha de infraestrutura sim; resposta do servidor, não. */
function ehTransitorio(status: number | null): boolean {
    // Sem status = erro de rede ou timeout. Transitório por definição.
    if (status === null) return true
    // 5xx e 429 são "tente de novo". 4xx é uma RESPOSTA — um 404 não melhora
    // repetindo, e insistir nele só atrasa o build.
    return status >= 500 || status === 429
}

const dormir = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchWordPress(path: string, opts: FetchOptions): Promise<Response | null> {
    const url = `${WP_API_URL}${path}`
    const tentativas = EM_BUILD_DE_PRODUCAO ? TENTATIVAS_NO_BUILD : 1

    for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
        let status: number | null = null
        let descricao = ''
        try {
            const response = await fetch(url, {
                next: {
                    revalidate: revalidateEfetivo(opts),
                    tags: opts.tags,
                },
                headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(WP_FETCH_TIMEOUT_MS),
            })

            if (response.ok) return response
            status = response.status
            descricao = `WordPress API error: ${response.status} ${response.statusText} — ${url}`
        } catch (error) {
            descricao = `WordPress API unavailable — ${url} ${String(error)}`
        }

        const ultima = tentativa === tentativas
        if (ultima || !ehTransitorio(status)) {
            console.error(descricao)
            return null
        }
        // Registrado, nunca silencioso: retentativa que ninguém vê esconde
        // degradação do WordPress até ela virar falha.
        console.warn(`${descricao} — tentativa ${tentativa}/${tentativas}, repetindo`)
        await dormir(ESPERA_BASE_MS * tentativa)
    }

    return null
}

function paginationHeader(response: Response, name: string): number {
    const value = Number(response.headers.get(name))
    return Number.isSafeInteger(value) && value >= 0 ? value : 0
}

/**
 * Busca que DEGRADA em silêncio: falha vira lista vazia.
 *
 * O nome diz o contrato de propósito. A versão anterior se chamava `wpFetch`, e
 * o nome não dizia nada — quem lia a chamada não tinha como saber que um
 * timeout do WordPress viraria `[]`, indistinguível de "não há resultados".
 *
 * Foi assim que nasceu o bug dos 404 transitórios: as páginas de item faziam
 * `items[0] ?? null` e chamavam `notFound()`, então um soluço do CMS
 * desindexava a página no Google. Ver `wpBuscarItem`.
 *
 * Use APENAS onde vazio é resposta aceitável: seções secundárias, sugestões,
 * blocos que somem sem prejuízo. Para o dado principal de uma página, use
 * `wpBuscarObrigatorio` — ali vazio não é resposta, é ausência de resposta.
 */
export async function wpBuscarOpcional<T>(path: string, opts: FetchOptions = {}): Promise<T> {
    if (IS_BUILD) return [] as unknown as T

    const response = await fetchWordPress(path, opts)
    if (!response) return [] as unknown as T
    try {
        return await response.json() as T
    } catch (error) {
        console.error(`WordPress API returned invalid JSON — ${WP_API_URL}${path}`, error)
        return [] as unknown as T
    }
}

/**
 * Busca que FALHA ALTO: indisponibilidade vira exceção.
 *
 * Para o dado principal de uma página. A página devolve 500, que ninguém
 * cacheia e que o Google reinterpreta como "tente de novo" — ao contrário do
 * 404, que ele lê como remoção e desindexa.
 *
 * Substitui a guarda escrita à mão que apareceu nas listagens de grupos e
 * artistas (`if (unfiltered && page === 1 && items.length === 0) throw`): a
 * regra certa, reimplementada em cada página, onde cada autor escolhia a
 * condição e quem esquecesse produzia o defeito em silêncio.
 */
export async function wpBuscarObrigatorio<T>(path: string, opts: FetchOptions = {}): Promise<T> {
    if (IS_BUILD) return [] as unknown as T

    const response = await fetchWordPress(path, opts)
    if (!response) throw new WordPressIndisponivelError(path)
    try {
        return await response.json() as T
    } catch (error) {
        console.error(`WordPress API returned invalid JSON — ${WP_API_URL}${path}`, error)
        throw new WordPressIndisponivelError(path)
    }
}

/**
 * @deprecated Diga o contrato: `wpBuscarOpcional` ou `wpBuscarObrigatorio`.
 *
 * Mantido para não quebrar chamadas ainda não migradas. O comportamento é o de
 * `wpBuscarOpcional` — degrada em silêncio.
 */
export const wpFetch = wpBuscarOpcional

/**
 * Endpoint de item único (`/wp/v2/<tipo>/<id>`), onde falha precisa ser
 * distinguível de conteúdo.
 *
 * `wpFetch` devolve `[] as T` em qualquer erro — para uma coleção isso degrada
 * bem, mas para um item o array vazio é truthy e passava adiante como se fosse
 * o objeto, quebrando a página em qualquer soluço do WordPress. Aqui a falha é
 * `null` e o tipo diz a verdade.
 */
export async function wpFetchItem<T>(path: string, opts: FetchOptions = {}): Promise<T | null> {
    if (IS_BUILD) return null

    const response = await fetchWordPress(path, opts)
    if (!response) return null
    try {
        const data = await response.json()
        // Coleção onde deveria vir item: o WP responde array quando o filtro não
        // casa. Tratar como ausência, não como objeto.
        return data && !Array.isArray(data) ? data as T : null
    } catch (error) {
        console.error(`WordPress API returned invalid JSON — ${WP_API_URL}${path}`, error)
        return null
    }
}

/**
 * Erro de INFRAESTRUTURA do WordPress — a pergunta nao pode ser feita.
 *
 * Diferente de "o conteudo nao existe", que e resposta legitima.
 */
export class WordPressIndisponivelError extends Error {
    constructor(path: string) {
        super(`WordPress indisponivel ao consultar ${path}`)
        this.name = 'WordPressIndisponivelError'
    }
}

/**
 * Busca por slug, distinguindo ausencia de indisponibilidade.
 *
 * Por que existe: `wpFetch` devolve `[]` em QUALQUER erro — timeout, 502, JSON
 * invalido — e `[]` e indistinguivel de "nenhum resultado". As paginas de item
 * faziam `items[0] ?? null` e chamavam `notFound()`, entao um soluço do
 * WordPress virava 404 numa pagina que existe. Com ISR esse 404 ainda ficava
 * cacheado.
 *
 * O custo disso nao e so o visitante ver 404: o Google lê 404 como "pagina
 * removida" e desindexa. Em 2026-09-10 /productions/climb-the-sky-walls
 * apareceu como 404 para o usuario e respondeu 200 minutos depois — a pagina
 * nunca deixou de existir.
 *
 * Aqui a falha VIRA EXCECAO. A pagina entao devolve 500, que ninguem cacheia e
 * que o Google reinterpreta como "tente de novo". Errar para 500 e recuperavel;
 * errar para 404 apaga a pagina do indice.
 */
export async function wpFetchPorSlug<T>(path: string, opts: FetchOptions = {}): Promise<T | null> {
    if (IS_BUILD) return null

    const response = await fetchWordPress(path, opts)
    // null aqui e SEMPRE falha de infraestrutura: ausencia de conteudo chega
    // como 200 com array vazio.
    if (!response) throw new WordPressIndisponivelError(path)

    let dados: unknown
    try {
        dados = await response.json()
    } catch (error) {
        console.error(`WordPress API returned invalid JSON — ${WP_API_URL}${path}`, error)
        throw new WordPressIndisponivelError(path)
    }

    if (!Array.isArray(dados)) return (dados ?? null) as T | null
    return (dados[0] ?? null) as T | null
}

/**
 * Exige que uma listagem tenha vindo com conteúdo.
 *
 * Para a primeira página SEM FILTRO de uma coleção que sabidamente tem itens:
 * ali vazio não é resposta, é ausência de resposta. Com filtro ou paginado,
 * vazio é legítimo — e por isso quem chama decide, já que só a página sabe se
 * há filtro aplicado.
 *
 * Existe para não reescrever a regra em cada listagem. Ela apareceu à mão em
 * `groups` e `artists` (`if (unfiltered && page === 1 && items.length === 0)
 * throw`), e regra reimplementada é regra que alguém vai esquecer — foi assim
 * que as páginas de item passaram meses transformando soluço do CMS em 404.
 */
export function exigirListagemComConteudo<T>(items: T[], contexto: string): T[] {
    if (items.length === 0) throw new WordPressIndisponivelError(`${contexto} (listagem vazia)`)
    return items
}

export async function wpFetchWithTotal<T>(
    path: string,
    opts: FetchOptions = {},
): Promise<{ items: T[]; total: number; totalPages: number }> {
    if (IS_BUILD) return emptyPage<T>()

    const response = await fetchWordPress(path, opts)
    if (!response) return emptyPage<T>()
    try {
        const items = (await response.json()) as T[]
        return {
            items,
            total: paginationHeader(response, 'X-WP-Total'),
            totalPages: paginationHeader(response, 'X-WP-TotalPages'),
        }
    } catch (error) {
        console.error(`WordPress API returned invalid JSON — ${WP_API_URL}${path}`, error)
        return emptyPage<T>()
    }
}

/** Para sitemap: ignora IS_BUILD, sempre faz fetch com retry */
export async function wpFetchWithTotalForSitemap<T>(
    path: string,
    attempt = 0,
): Promise<{ items: T[]; total: number; totalPages: number }> {
    const url = `${WP_API_URL}${path}`
    const maxRetries = 5

    try {
        const res = await fetch(url, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(150_000), // 150s for sitemap with retries
        })

        if (!res.ok) {
            if (attempt < maxRetries) {
                console.warn(`[sitemap] API error ${res.status} - retrying (attempt ${attempt + 1}/${maxRetries})`)
                await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000))
                return wpFetchWithTotalForSitemap(path, attempt + 1)
            }
            console.error(`WordPress API error: ${res.status} ${res.statusText} — ${url}`)
            return { items: [], total: 0, totalPages: 0 }
        }

        const items = (await res.json()) as T[]
        const total = Number(res.headers.get('X-WP-Total') ?? 0)
        const totalPages = Number(res.headers.get('X-WP-TotalPages') ?? 0)

        return { items, total, totalPages }
    } catch (error) {
        if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000
            console.warn(`[sitemap] API timeout/error - retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
            await new Promise((r) => setTimeout(r, delay))
            return wpFetchWithTotalForSitemap(path, attempt + 1)
        }
        console.error(`WordPress API unavailable — ${url}`, error)
        return { items: [], total: 0, totalPages: 0 }
    }
}

export function buildParams(params: Record<string, string | number | boolean | undefined>): string {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') p.set(k, String(v))
    }
    const s = p.toString()
    return s ? `?${s}` : ''
}
