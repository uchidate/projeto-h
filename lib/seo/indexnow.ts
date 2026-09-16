/**
 * IndexNow — avisa Bing, Yandex, Seznam e Naver quando uma URL muda, em vez de
 * esperar o rastreamento passar. https://www.indexnow.org/documentation
 *
 * Três decisões de projeto valem registro:
 *
 * 1. Nada aqui lança. O IndexNow é acessório: se o endpoint cair, mudar de
 *    contrato ou devolver 429, a publicação no WordPress e a revalidação de
 *    cache precisam continuar funcionando. Toda falha vira um objeto de
 *    resultado e uma linha de log.
 * 2. Só submetemos URLs do host canônico. O protocolo devolve 422 quando a URL
 *    não pertence ao host da chave, e uma submissão de host errado é o tipo de
 *    erro que só aparece semanas depois, no relatório do buscador.
 * 3. Há um cache curto de deduplicação. O WordPress dispara o webhook várias
 *    vezes para a mesma edição (salvar, atualizar meta, revalidar pelo admin),
 *    e reenviar a mesma URL em rajada é exatamente o que o 429 pune.
 */
import { SITE_URL } from '@/lib/constants/site'
import type { WPPostType } from '@/lib/wordpress/cache'
import { ACTIVE_LOCALES, DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

/**
 * A especificação aceita 8 a 128 caracteres entre [a-zA-Z0-9-]. Validamos o
 * formato em vez de confiar na env var: uma chave com espaço ou quebra de linha
 * colada errada no 1Password produziria 403 silencioso em toda submissão.
 */
export const INDEXNOW_KEY_PATTERN = /^[a-zA-Z0-9-]{8,128}$/

/** Teto por requisição. A especificação permite 10.000; um lote pequeno é mais
 * fácil de auditar no log e limita o estrago de um bug de montagem de URL. */
export const INDEXNOW_MAX_URLS = 100

const REQUEST_TIMEOUT_MS = 5_000

/** Janela de deduplicação: reenviar a mesma URL antes disso não acrescenta nada. */
const DEDUPE_TTL_MS = 10 * 60 * 1000
const DEDUPE_MAX_ENTRIES = 2_000

/**
 * Tipo de conteúdo do WordPress → prefixo público.
 *
 * `music_release` fica de fora de propósito: não tem página própria no site,
 * aparece só embutido em outros perfis. Submeter uma URL inexistente ensina o
 * buscador a rastrear 404.
 *
 * Existe um mapa parecido em `lib/seo/dynamicSitemap.ts`, mas ele é indexado
 * pelo shard do sitemap, não pelo post type; mantê-los separados evita acoplar
 * a paginação do sitemap ao webhook.
 */
export const INDEXNOW_PUBLIC_BASE: Partial<Record<WPPostType, string>> = {
    post: 'blog',
    production: 'productions',
    artist: 'artists',
    group: 'groups',
    agency: 'agencies',
    food: 'comidas',
    company: 'empresas',
}

/** Tipos com versão em outros idiomas (`/en/artists/<slug>`) — docs/I18N-ARQUITETURA.md. */
export const INDEXNOW_LOCALIZED_TYPES: readonly WPPostType[] = ['artist', 'group', 'production']

/**
 * URLs das versões em outros idiomas de um conteúdo. `published` são os idiomas
 * com tradução publicada (chaves de `translations` no REST); só entram os
 * ativos — idioma desligado ainda responde 404 e não deve ser submetido.
 */
export function buildLocalizedIndexNowUrls(type: WPPostType, slug: string, published: readonly string[]): string[] {
    if (!INDEXNOW_LOCALIZED_TYPES.includes(type)) return []
    const base = buildIndexNowUrl(type, slug)
    if (!base) return []
    const path = base.slice(SITE_URL.length)
    return ACTIVE_LOCALES
        .filter((locale): locale is Locale => locale !== DEFAULT_LOCALE && published.includes(locale))
        .map((locale) => `${SITE_URL}/${locale}${path}`)
}

export type IndexNowOutcome =
    | { ok: true; submitted: string[]; status: number }
    | { ok: false; reason: 'disabled' | 'no-valid-urls' | 'http-error' | 'network-error'; detail?: string; status?: number }

/** Só devolve a chave se ela existir e tiver formato válido. */
export function getIndexNowKey(env: NodeJS.ProcessEnv = process.env): string | null {
    const raw = env.INDEXNOW_KEY?.trim()
    if (!raw || !INDEXNOW_KEY_PATTERN.test(raw)) return null
    return raw
}

/** Caminho público do arquivo de verificação, derivado da própria chave. */
export function indexNowKeyLocation(key: string): string {
    return `${SITE_URL}/${key}.txt`
}

/**
 * Monta a URL pública de um conteúdo. Devolve null quando o tipo não tem página
 * própria ou o slug é inutilizável — em vez de montar `/artists/undefined`.
 */
export function buildIndexNowUrl(type: WPPostType, slug: string): string | null {
    const base = INDEXNOW_PUBLIC_BASE[type]
    if (!base) return null
    const limpo = slug.trim()
    // Slug do WP é sempre um segmento simples; barra ou '..' aqui significa
    // payload adulterado, não conteúdo real.
    if (!limpo || limpo.includes('/') || limpo.includes('..') || limpo !== encodeURIComponent(limpo)) return null
    return `${SITE_URL}/${base}/${limpo}`
}

/** Aceita apenas URLs https do host canônico, sem porta, usuário ou fragmento. */
export function isSubmittableUrl(url: string): boolean {
    let parsed: URL
    let canonical: URL
    try {
        parsed = new URL(url)
        canonical = new URL(SITE_URL)
    } catch {
        return false
    }
    return (
        parsed.protocol === 'https:' &&
        parsed.host === canonical.host &&
        parsed.username === '' &&
        parsed.password === '' &&
        parsed.hash === ''
    )
}

const enviadasRecentemente = new Map<string, number>()

/** Remove entradas vencidas e, se ainda estourar, as mais antigas. */
function podarDedupe(agora: number): void {
    for (const [url, quando] of enviadasRecentemente) {
        if (agora - quando > DEDUPE_TTL_MS) enviadasRecentemente.delete(url)
    }
    while (enviadasRecentemente.size > DEDUPE_MAX_ENTRIES) {
        const maisAntiga = enviadasRecentemente.keys().next().value
        if (maisAntiga === undefined) break
        enviadasRecentemente.delete(maisAntiga)
    }
}

/** Exposto para os testes; o cache é por processo e não precisa persistir. */
export function resetIndexNowDedupe(): void {
    enviadasRecentemente.clear()
}

export function dedupeSize(): number {
    return enviadasRecentemente.size
}

type SubmitOptions = {
    /** Ignora o cache de deduplicação. Para reenvio manual deliberado. */
    force?: boolean
    fetchImpl?: typeof fetch
    env?: NodeJS.ProcessEnv
    now?: () => number
}

/**
 * Submete URLs ao IndexNow. Nunca lança: devolve o desfecho para quem quiser
 * registrar, e quem chama pode ignorar com segurança.
 */
export async function submitToIndexNow(urls: string[], options: SubmitOptions = {}): Promise<IndexNowOutcome> {
    const { force = false, fetchImpl = fetch, env = process.env, now = Date.now } = options

    const key = getIndexNowKey(env)
    if (!key) return { ok: false, reason: 'disabled', detail: 'INDEXNOW_KEY ausente ou malformada' }

    const agora = now()
    podarDedupe(agora)

    const vistas = new Set<string>()
    const validas: string[] = []
    for (const url of urls) {
        if (validas.length >= INDEXNOW_MAX_URLS) break
        if (!isSubmittableUrl(url) || vistas.has(url)) continue
        vistas.add(url)
        const ultima = enviadasRecentemente.get(url)
        if (!force && ultima !== undefined && agora - ultima <= DEDUPE_TTL_MS) continue
        validas.push(url)
    }
    if (validas.length === 0) return { ok: false, reason: 'no-valid-urls' }

    const host = new URL(SITE_URL).host
    let response: Response
    try {
        response = await fetchImpl(INDEXNOW_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ host, key, keyLocation: indexNowKeyLocation(key), urlList: validas }),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            cache: 'no-store',
        })
    } catch (erro) {
        return { ok: false, reason: 'network-error', detail: erro instanceof Error ? erro.message : String(erro) }
    }

    if (!response.ok) {
        // Não marca como enviada: um 429 ou 403 precisa poder ser reenviado
        // assim que a causa for corrigida.
        return { ok: false, reason: 'http-error', status: response.status }
    }

    for (const url of validas) enviadasRecentemente.set(url, agora)
    return { ok: true, submitted: validas, status: response.status }
}
