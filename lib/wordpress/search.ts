import type { SearchResult, SearchResultType } from '@/lib/search/types'
import { stripHtml } from '@/lib/utils'
import { buildParams, wpBuscarOpcional } from './client'
import { WP_CACHE_TAGS } from './cache'

type WPItem = {
    id: number
    slug: string
    title: { rendered: string }
    featured_image_url?: string | null
    meta?: { trending_score?: number; groups?: number[] }
}

type TypeConfig = {
    type: SearchResultType
    endpoint: string
    prefix: string
    perPage: number
    /** Tipos elegíveis a fallback fuzzy quando a busca direta não acha nada */
    fuzzy: boolean
}

const TYPES: TypeConfig[] = [
    { type: 'production', endpoint: 'production', prefix: '/productions', perPage: 20, fuzzy: true },
    { type: 'artist',     endpoint: 'artist',      prefix: '/artists',     perPage: 20, fuzzy: true },
    { type: 'group',      endpoint: 'group',       prefix: '/groups',     perPage: 12, fuzzy: true },
    { type: 'post',       endpoint: 'posts',       prefix: '/blog',        perPage: 8,  fuzzy: false },
    { type: 'company',    endpoint: 'company',     prefix: '/empresas',    perPage: 6,  fuzzy: false },
    { type: 'food',       endpoint: 'food',        prefix: '/comidas',     perPage: 6,  fuzzy: false },
]

const TYPE_WEIGHT: Record<SearchResultType, number> = {
    artist: 1.2,
    group: 1.2,
    production: 1,
    company: 0.8,
    food: 0.8,
    post: 0.6,
}

const COMBINING_DIACRITICS = /[̀-ͯ]/g

function foldAccents(s: string): string {
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(COMBINING_DIACRITICS, '')
        .trim()
}

function stripSeparators(s: string): string {
    return foldAccents(s).replace(/[\s\-]+/g, '')
}

/**
 * Score de relevância do título contra a query, tolerante a variação de
 * espaço/hífen na romanização (ex: "Black Pink" ~ "BLACKPINK").
 * Retorna 0 quando não há match por substring (candidato a fuzzy fallback).
 */
function scoreTitle(title: string, query: string): number {
    const titleFolded = foldAccents(title)
    const queryFolded = foldAccents(query)
    const titleTight = stripSeparators(title)
    const queryTight = stripSeparators(query)

    if (!titleTight.includes(queryTight)) return 0

    if (titleFolded === queryFolded || titleTight === queryTight) return 100
    if (titleFolded.startsWith(queryFolded) || titleTight.startsWith(queryTight)) return 80

    const words = titleFolded.split(/[\s\-]+/)
    if (words.includes(queryFolded)) return 70
    if (words.some(w => w.startsWith(queryFolded))) return 50

    // Substring dentro do titulo ainda e match de titulo: fica ACIMA do fallback (40)
    // dado a itens que o WP achou por meta/conteudo. Antes valia 20 e "jisoo" perdia
    // a ficha "Kim Ji-soo" para artistas sem relacao.
    return 45
}

function levenshtein(a: string, b: string): number {
    const m = a.length
    const n = b.length
    if (m === 0) return n
    if (n === 0) return m

    let prev = Array.from({ length: n + 1 }, (_, i) => i)
    for (let i = 1; i <= m; i++) {
        const curr = [i]
        for (let j = 1; j <= n; j++) {
            curr[j] = a[i - 1] === b[j - 1]
                ? prev[j - 1]
                : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1])
        }
        prev = curr
    }
    return prev[n]
}

/** Menor distância entre a query e o título inteiro ou qualquer palavra do título. */
function fuzzyDistance(title: string, query: string): number {
    const queryFolded = foldAccents(query)
    const candidates = [stripSeparators(title), ...foldAccents(title).split(/[\s\-]+/).filter(Boolean)]
    return Math.min(...candidates.map(c => levenshtein(c, queryFolded)))
}

function fuzzyThreshold(query: string): number {
    return Math.max(1, Math.ceil(foldAccents(query).length * 0.34))
}

async function fetchPool(cfg: TypeConfig, q: string, fields: string, revalidate: number, tags: string[]) {
    const extra = cfg.type === 'post' ? `,excerpt` : ''
    return wpBuscarOpcional<WPItem[]>(
        `/wp/v2/${cfg.endpoint}${buildParams({ search: q, per_page: cfg.perPage, status: 'publish', _fields: `${fields}${extra}` })}`,
        { revalidate, tags },
    )
}

/** Pool sem filtro de busca, para comparar via distância de edição quando a busca direta não acha nada. */
async function fetchFuzzyPool(cfg: TypeConfig, fields: string, revalidate: number, tags: string[]) {
    return wpBuscarOpcional<WPItem[]>(
        `/wp/v2/${cfg.endpoint}${buildParams({ per_page: 30, status: 'publish', orderby: 'date', order: 'desc', _fields: fields })}`,
        { revalidate, tags },
    )
}

type ScoredCandidate = SearchResult & { _trendingScore: number; _groupIds?: number[] }

function toResults(cfg: TypeConfig, items: WPItem[]): ScoredCandidate[] {
    return items.map(item => ({
        id: item.id,
        title: stripHtml(item.title.rendered),
        href: `${cfg.prefix}/${item.slug}`,
        type: cfg.type,
        thumbnail: item.featured_image_url ?? undefined,
        _trendingScore: item.meta?.trending_score ?? 0,
        _groupIds: item.meta?.groups,
    }))
}

/**
 * Resolve o(s) grupo(s) de artistas encontrados para exibir "Membro de X" como subtítulo.
 */
async function attachGroupSubtitles(candidates: ScoredCandidate[], revalidate: number, tags: string[]) {
    const artistCandidates = candidates.filter(c => c.type === 'artist' && c._groupIds?.length)
    const groupIds = [...new Set(artistCandidates.flatMap(c => c._groupIds ?? []))]
    if (groupIds.length === 0) return

    const groups = await wpBuscarOpcional<WPItem[]>(
        `/wp/v2/group${buildParams({ include: groupIds.join(','), per_page: groupIds.length, _fields: 'id,title' })}`,
        { revalidate, tags },
    )
    const nameById = new Map(groups.map(g => [g.id, stripHtml(g.title.rendered)]))

    for (const c of artistCandidates) {
        const names = (c._groupIds ?? []).map(id => nameById.get(id)).filter(Boolean)
        if (names.length) c.subtitle = `Membro de ${names.slice(0, 2).join(', ')}`
    }
}

/**
 * Busca paralela nos CPTs via /wp/v2/{type}?search=...
 *
 * O `search=` do WP core já é estendido no PHP (rest_artist_query / rest_group_query /
 * rest_production_query / rest_company_query / rest_food_query) para casar variações de
 * hífen/espaço e os campos meta name_hangul/name_romanized/original_title/name_korean.
 *
 * Aqui: (1) rerankeamos o pool por relevância real — exato > prefixo > palavra inteira >
 * substring —, ponderado por tipo e por trending_score; (2) quando um tipo prioritário
 * (production/artist/group) não acha nada, tentamos um fallback fuzzy por distância de
 * edição contra um pool recente, para cobrir erros de digitação; (3) artistas ganham um
 * subtítulo "Membro de X" quando pertencem a algum grupo.
 */
export async function searchWordPress(query: string, limit = 10): Promise<SearchResult[]> {
    const q = query.trim()
    if (q.length < 2) return []

    const revalidate = 60
    const tags = [
        WP_CACHE_TAGS.productions, WP_CACHE_TAGS.artists, WP_CACHE_TAGS.groups,
        WP_CACHE_TAGS.posts, WP_CACHE_TAGS.companies, WP_CACHE_TAGS.foods,
    ]
    const fields = 'id,slug,title,featured_image_url,meta'

    const pools = await Promise.allSettled(TYPES.map(cfg => fetchPool(cfg, q, fields, revalidate, tags)))

    const candidates: ScoredCandidate[] = []
    const emptyFuzzyCandidates: TypeConfig[] = []

    TYPES.forEach((cfg, i) => {
        const pool = pools[i]
        const items = pool.status === 'fulfilled' ? pool.value : []
        candidates.push(...toResults(cfg, items))
        if (cfg.fuzzy && items.length === 0 && q.length >= 3) emptyFuzzyCandidates.push(cfg)
    })

    if (emptyFuzzyCandidates.length > 0) {
        const threshold = fuzzyThreshold(q)
        const fuzzyPools = await Promise.allSettled(
            emptyFuzzyCandidates.map(cfg => fetchFuzzyPool(cfg, fields, revalidate, tags)),
        )
        fuzzyPools.forEach((pool, i) => {
            if (pool.status !== 'fulfilled') return
            const cfg = emptyFuzzyCandidates[i]
            const matches = pool.value.filter(item => fuzzyDistance(stripHtml(item.title.rendered), q) <= threshold)
            candidates.push(...toResults(cfg, matches))
        })
    }

    await attachGroupSubtitles(candidates, revalidate, tags)

    return candidates
        .map(c => ({
            c,
            score: (scoreTitle(c.title, q) || 40) * TYPE_WEIGHT[c.type] + Math.min(c._trendingScore, 100) * 0.05,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ c }) => {
            const { _trendingScore, _groupIds, ...result } = c
            return result
        })
}
