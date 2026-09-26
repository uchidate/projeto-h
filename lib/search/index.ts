import type { SearchResult, SearchResultType } from '@/lib/search/types'
import { stripHtml } from '@/lib/utils'
import { buildParams, wpFetchWithTotal } from '@/lib/wordpress/client'
import { WP_CACHE_TAGS } from '@/lib/wordpress/cache'
import { foldAccents, fuzzyThreshold, levenshtein, scoreTitle, stripSeparators } from '@/lib/search/scoring'

/**
 * Indice de busca em memoria: todos os titulos do acervo (~8 mil fichas, ~1 MB)
 * carregados do WordPress uma vez e consultados localmente — ms em vez de ~1 s.
 *
 * Nunca bloqueia nem quebra a busca: sem indice pronto (primeira requisicao
 * depois de subir, WP fora do ar) `searchIndex` devolve null e quem chamou usa a
 * busca REST. O indice se renova sozinho (stale-while-revalidate).
 */

const TTL_MS = 10 * 60 * 1000
const PER_PAGE = 100
const CONCURRENCY = 4

type Colecao = { type: SearchResultType; endpoint: string; prefix: string; tag: string; weight: number; fuzzy: boolean }

const COLECOES: Colecao[] = [
    { type: 'production', endpoint: 'production', prefix: '/productions', tag: WP_CACHE_TAGS.productions, weight: 1,   fuzzy: true },
    { type: 'artist',     endpoint: 'artist',      prefix: '/artists',     tag: WP_CACHE_TAGS.artists,     weight: 1.2, fuzzy: true },
    { type: 'group',      endpoint: 'group',       prefix: '/groups',      tag: WP_CACHE_TAGS.groups,      weight: 1.2, fuzzy: true },
    { type: 'post',       endpoint: 'posts',       prefix: '/blog',        tag: WP_CACHE_TAGS.posts,       weight: 0.6, fuzzy: false },
    { type: 'company',    endpoint: 'company',     prefix: '/empresas',    tag: WP_CACHE_TAGS.companies,   weight: 0.8, fuzzy: false },
    { type: 'food',       endpoint: 'food',        prefix: '/comidas',     tag: WP_CACHE_TAGS.foods,       weight: 0.8, fuzzy: false },
]

type WPItem = {
    id: number
    slug: string
    title: { rendered: string }
    featured_image_url?: string | null
    /** Os campos editoriais vivem em `acf`; `meta` so traz Rank Math. */
    acf?: {
        groups?: number[]
        trending_score?: number | null
        popularity_score?: number | null
        roles?: string[]
        birth_date?: string | null
        name_hangul?: string | null
        name_romanized?: string | null
        original_title?: string | null
        type?: string | null
        year?: number | null
    } | []
}

type Entrada = {
    id: number
    title: string
    /** Outras grafias buscaveis: slug, nome romanizado, hangul / titulo original. */
    alternativas: string[]
    /** Subconjunto de `alternativas` que vale mostrar ao usuario (sem o slug). */
    grafias: string[]
    /** Complemento exibido sob o titulo, para diferenciar homonimos ("Ator · 1972"). */
    detalhe?: string
    /** Nomes dos grupos do artista: "jisoo blackpink" acha a Jisoo pelo grupo. */
    contexto: string[]
    href: string
    type: SearchResultType
    thumbnail?: string
    weight: number
    fuzzy: boolean
    trending: number
    grupos: number[]
    palavras: string[]
    justo: string
}

let entradas: Entrada[] | null = null
let carregadoEm = 0
let carregando: Promise<void> | null = null

const PAPEL: Record<string, string> = {
    actor: 'Ator/Atriz', singer: 'Cantor(a)', idol: 'Idol', model: 'Modelo', dancer: 'Dançarino(a)',
    rapper: 'Rapper', director: 'Diretor(a)', writer: 'Roteirista', host: 'Apresentador(a)',
}

function anoDe(valor?: string | number | null): string | undefined {
    const m = String(valor ?? '').match(/^(\d{4})/)
    return m ? m[1] : undefined
}

/** Texto que diferencia fichas de mesmo nome: papel + ano de nascimento; tipo + ano da obra. */
function detalheDe(type: SearchResultType, acf?: Exclude<WPItem['acf'], unknown[] | undefined>): string | undefined {
    if (!acf) return undefined
    if (type === 'artist') {
        const papel = PAPEL[acf.roles?.[0] ?? '']
        return [papel, anoDe(acf.birth_date)].filter(Boolean).join(' · ') || undefined
    }
    if (type === 'production') {
        const tipo = acf.type === 'movie' ? 'Filme' : acf.type === 'drama' ? 'Série' : undefined
        return [tipo, anoDe(acf.year)].filter(Boolean).join(' · ') || undefined
    }
    return undefined
}

async function buscarColecao(c: Colecao): Promise<Entrada[]> {
    const pagina = (page: number) => wpFetchWithTotal<WPItem>(
        `/wp/v2/${c.endpoint}${buildParams({
            page,
            per_page: PER_PAGE,
            status: 'publish',
            // Ordem estavel: sem ela, itens com a mesma data repetem/somem entre paginas.
            orderby: 'id',
            order: 'asc',
            _fields: 'id,slug,title,featured_image_url,acf.groups,acf.trending_score,acf.popularity_score,acf.roles,acf.birth_date,acf.name_hangul,acf.name_romanized,acf.original_title,acf.type,acf.year',
        })}`,
        { revalidate: 300, tags: [c.tag] },
    )
    const primeira = await pagina(1)
    if (primeira.items.length === 0) return []
    const itens = [...primeira.items]
    for (let p = 2; p <= primeira.totalPages; p += CONCURRENCY) {
        const paginas = Array.from({ length: Math.min(CONCURRENCY, primeira.totalPages - p + 1) }, (_, i) => p + i)
        const lote = await Promise.all(paginas.map(pagina))
        lote.forEach(r => itens.push(...r.items))
    }
    // Rede de seguranca: se o WP mesmo assim repetir um id entre paginas, fica um so.
    const unicos = [...new Map(itens.map(i => [i.id, i])).values()]
    return unicos.map(item => {
        const titulo = stripHtml(item.title.rendered)
        const acf = Array.isArray(item.acf) || !item.acf ? undefined : item.acf
        const grafias = [acf?.name_romanized, acf?.name_hangul, acf?.original_title]
            .filter((x): x is string => !!x && x !== titulo)
        return {
            id: item.id,
            title: titulo,
            grafias,
            alternativas: [item.slug.replace(/-/g, ' '), ...grafias],
            detalhe: detalheDe(c.type, acf),
            contexto: [],
            href: `${c.prefix}/${item.slug}`,
            type: c.type,
            thumbnail: item.featured_image_url ?? undefined,
            weight: c.weight,
            fuzzy: c.fuzzy,
            trending: Math.max(acf?.trending_score ?? 0, acf?.popularity_score ?? 0),
            grupos: acf?.groups ?? [],
            palavras: foldAccents(titulo).split(/[\s\-]+/).filter(Boolean),
            justo: stripSeparators(titulo),
        }
    })
}

async function carregar(): Promise<void> {
    const partes = await Promise.all(COLECOES.map(buscarColecao))
    // Colecao vazia = WP falhou (ou build): nao substitui um indice bom por um pela metade.
    if (partes.some(p => p.length === 0)) throw new Error('indice de busca incompleto')
    const todas = partes.flat()
    const nomeGrupo = new Map(todas.filter(e => e.type === 'group').map(g => [g.id, g.title]))
    for (const e of todas) {
        if (e.type === 'artist') e.contexto = e.grupos.map(id => nomeGrupo.get(id)).filter((n): n is string => !!n)
    }
    entradas = todas
    carregadoEm = Date.now()
}

function garantirCarregando(): void {
    if (carregando) return
    carregando = carregar()
        .catch(e => { console.error('Indice de busca: falha ao carregar', e) })
        .finally(() => { carregando = null })
}

/** Para testes. */
export function __reiniciarIndice(): void {
    entradas = null
    carregadoEm = 0
    carregando = null
}

/** Espera a carga em andamento (uso: testes e aquecimento). */
export async function aguardarIndice(): Promise<void> {
    garantirCarregando()
    await carregando
}

/**
 * Distancia entre uma palavra digitada e o texto (inteiro ou por palavra), mas so
 * contra candidatos de tamanho parecido: sem isso "blakpink" (8) chegava a "Apink"
 * (5) e trazia o grupo errado. Infinity quando nenhum candidato serve.
 */
function distanciaDaPalavra(texto: string, p: string): number {
    let melhor = Infinity
    for (const c of [stripSeparators(texto), ...foldAccents(texto).split(/[\s\-]+/).filter(Boolean)]) {
        if (Math.abs(c.length - p.length) > 1) continue
        melhor = Math.min(melhor, levenshtein(c, p))
    }
    return melhor
}

/**
 * Consulta com varias palavras ("jisoo blackpink"): cada palavra precisa casar
 * com algum campo da ficha ou com o nome do grupo (esse com peso menor). Vale
 * um pouco menos que o casamento da frase inteira, que continua tendo prioridade.
 */
function pontuarPalavras(e: Entrada, palavras: string[], tolerante = false): number {
    if (palavras.length < 2) return 0
    let soma = 0
    for (const p of palavras) {
        const direto = Math.max(scoreTitle(e.title, p), ...e.alternativas.map(a => scoreTitle(a, p)))
        const porGrupo = Math.max(0, ...e.contexto.map(g => scoreTitle(g, p) * 0.6))
        let melhor = Math.max(direto, porGrupo)
        // Erro de digitacao numa das palavras ("blakpink jisoo"): vale menos que o acerto exato.
        if (melhor === 0 && tolerante && p.length >= 3) {
            const dist = Math.min(...[e.title, ...e.alternativas, ...e.contexto].map(t => distanciaDaPalavra(t, p)))
            if (dist <= Math.min(fuzzyThreshold(p), 2)) melhor = 30 - dist
        }
        if (melhor === 0) return 0
        soma += melhor
    }
    return (soma / palavras.length) * 0.9
}

/**
 * Fichas mais em alta (artista, grupo, produção): o que sugerir quando a busca
 * não acha nada, para a pessoa não ficar diante de um beco sem saída. Vazio com o
 * índice ainda frio: sem ele não há como ordenar, e a resposta não é adiada por isso.
 */
export function populares(limit = 6): SearchResult[] {
    if (!entradas) return []
    return entradas
        .filter(e => (e.type === 'artist' || e.type === 'group' || e.type === 'production') && e.trending > 0)
        .sort((a, b) => b.trending - a.trending)
        .slice(0, limit)
        .map(e => ({ id: e.id, title: e.title, href: e.href, type: e.type, thumbnail: e.thumbnail, subtitle: e.detalhe }))
}

export async function searchIndex(query: string, limit: number): Promise<SearchResult[] | null> {
    if (!entradas || Date.now() - carregadoEm > TTL_MS) garantirCarregando()
    if (!entradas) return null // primeira vez: quem chamou usa a busca REST

    const q = query.trim()
    const palavras = foldAccents(q).split(/\s+/).filter(p => p.length >= 2)
    const base = entradas
    const ranqueado: Array<{ e: Entrada; score: number }> = []
    for (const e of base) {
        // Melhor entre titulo e grafias alternativas (slug, romanizado, hangul).
        const s = Math.max(
            scoreTitle(e.title, q),
            ...e.alternativas.map(a => scoreTitle(a, q)),
            pontuarPalavras(e, palavras),
        )
        if (s > 0) ranqueado.push({ e, score: s * e.weight + Math.min(e.trending, 100) * 0.05 })
    }

    // Erro de digitacao: so quando quase nada casou direto. Toda a base, mas com
    // pre-filtro por tamanho para nao pagar Levenshtein em 8 mil titulos.
    if (ranqueado.length < 3 && q.length >= 3) {
        const alvo = foldAccents(q)
        const limiar = Math.max(1, Math.ceil(alvo.length * 0.34))
        const jaAchados = new Set(ranqueado.map(x => x.e))
        if (palavras.length >= 2) {
            for (const e of base) {
                if (!e.fuzzy || jaAchados.has(e)) continue
                const s = pontuarPalavras(e, palavras, true)
                if (s > 0) { ranqueado.push({ e, score: s * e.weight + Math.min(e.trending, 100) * 0.05 }); jaAchados.add(e) }
            }
        }
        for (const e of base) {
            if (!e.fuzzy || jaAchados.has(e)) continue
            let melhor = Infinity
            for (const c of [e.justo, ...e.palavras]) {
                if (Math.abs(c.length - alvo.length) > limiar) continue
                melhor = Math.min(melhor, levenshtein(c, alvo))
            }
            if (melhor <= limiar) ranqueado.push({ e, score: (30 - melhor) * e.weight + Math.min(e.trending, 100) * 0.05 })
        }
    }

    ranqueado.sort((a, b) => b.score - a.score)
    const nomeGrupo = new Map(base.filter(e => e.type === 'group').map(g => [g.id, g.title]))
    return ranqueado.slice(0, limit).map(({ e }) => {
        const r: SearchResult = { id: e.id, title: e.title, href: e.href, type: e.type, thumbnail: e.thumbnail }
        // Achou por outra grafia (ex.: hangul): mostra qual, senao o resultado parece aleatorio.
        if (scoreTitle(e.title, q) === 0) {
            const alias = e.grafias.find(g => scoreTitle(g, q) > 0)
            if (alias) r.alias = alias
        }
        if (e.type === 'artist') {
            const nomes = e.grupos.map(id => nomeGrupo.get(id)).filter(Boolean)
            const ano = e.detalhe?.match(/\d{4}$/)?.[0]
            if (nomes.length) r.subtitle = [`Membro de ${nomes.slice(0, 2).join(', ')}`, ano].filter(Boolean).join(' · ')
            else if (e.detalhe) r.subtitle = e.detalhe
        } else if (e.detalhe) {
            r.subtitle = e.detalhe
        }
        return r
    })
}
