import { wpBuscarOpcional, wpFetchWithTotal, buildParams, wpFetchPorSlug } from './client'
import { getWPItemTag, WP_CACHE_TAGS } from './cache'
import type { WPProduction, WPTerm } from './types'

export type ProductionsQuery = {
    /** Só itens com tradução publicada neste idioma (REST `oc_locale`); traz `translations`. */
    locale?: string
    page?: number
    perPage?: number
    genre?: string       // slug da taxonomia production_genre (ex: 'romance', 'terror')
    tag?: string         // slug da taxonomia production_tag (sub-gênero temático, ex: 'medico', 'escola')
    platform?: string    // nome da plataforma no ACF (ex: 'Netflix', 'Disney+') via oc_platform
    network?: string     // valor do ACF 'network' (ex: 'SBS', 'tvN') via oc_network
    type?: 'drama' | 'movie' | 'special' | 'variety'
    search?: string
    orderby?: 'date' | 'title' | 'modified' | 'menu_order' | 'meta_value' | 'meta_value_num' | 'trending_score'
    order?: 'desc' | 'asc'
    slug?: string
    year?: number
    maxYear?: number
    minRating?: number
    metaKey?: string
    excludeAdult?: boolean
}

async function resolveTermId(slug: string, fetchTerms: () => Promise<WPTerm[]>): Promise<number | undefined> {
    try {
        const terms = await fetchTerms()
        return terms.find(t => t.slug === slug)?.id
    } catch { return undefined }
}

export async function getProductions(query: ProductionsQuery = {}) {
    const {
        page = 1, perPage = 24, genre, tag, platform, network, type, search,
        orderby = 'trending_score', order = 'desc', slug, year, maxYear, minRating, metaKey, excludeAdult = true, locale,
    } = query
    const isCustomOrder = orderby === 'trending_score'

    // WP REST API exige ID inteiro para filtro de taxonomia — resolve slug → ID
    const genreId = genre ? await resolveTermId(genre, getProductionGenres) : undefined

    const params: Record<string, string | number | boolean | undefined> = {
        page, per_page: perPage,
        orderby: isCustomOrder ? 'date' : orderby,
        order, status: 'publish',
        _fields: locale ? 'id,slug,title,date,featured_image_url,acf,production_genre,translations' : 'id,slug,title,date,featured_image_url,acf,production_genre',
        oc_locale: locale,
        slug: slug ?? undefined, search: search ?? undefined,
        oc_type: type, oc_year: year, oc_max_year: maxYear, oc_min_rating: minRating,
        production_genre: genreId,
        oc_tag: tag,
        oc_platform: platform,   // filtra via acf.platforms[] (LIKE match no WP)
        oc_network: network,
        meta_key: metaKey,
        oc_exclude_adult: excludeAdult ? '1' : undefined,
        oc_orderby: isCustomOrder ? 'trending_score' : undefined,
    }
    return wpFetchWithTotal<WPProduction>(`/wp/v2/production${buildParams(params)}`, {
        revalidate: 1800, tags: [WP_CACHE_TAGS.productions],
    })
}

export async function getProductionBySlug(slug: string): Promise<WPProduction | null> {
    // wpFetchPorSlug e nao wpFetch: `[]` de um wpFetch com falha e
    // indistinguivel de "nao existe", e o notFound() da pagina transformava
    // um soluço do WordPress em 404 permanente aos olhos do Google.
    return wpFetchPorSlug<WPProduction>(
        `/wp/v2/production${buildParams({ slug, status: 'publish', _embed: true })}`,
        { revalidate: 1800, tags: [getWPItemTag('production', slug)] },
    )
}

export async function getProductionsByIds(ids: number[]): Promise<WPProduction[]> {
    if (!ids.length) return []
    try {
        return await wpBuscarOpcional<WPProduction[]>(
            `/wp/v2/production${buildParams({ include: ids.join(','), per_page: ids.length, status: 'publish', _fields: 'id,slug,title,date,featured_image_url,acf,production_genre', orderby: 'include' })}`,
            { revalidate: 1800, tags: [WP_CACHE_TAGS.productions] },
        )
    } catch { return [] }
}

export async function getProductionGenres() {
    return wpBuscarOpcional<WPTerm[]>(
        `/wp/v2/production_genre${buildParams({ per_page: 100, hide_empty: true, orderby: 'name' })}`,
        { revalidate: 3600, tags: [WP_CACHE_TAGS.productionGenres] },
    )
}

export async function getProductionPlatforms() {
    return wpBuscarOpcional<WPTerm[]>(
        `/wp/v2/production_platform${buildParams({ per_page: 50, hide_empty: true })}`,
        { revalidate: 3600, tags: [WP_CACHE_TAGS.productionPlatforms] },
    )
}

export async function getProductionsByArtist(artistSlug: string, perPage = 20): Promise<WPProduction[]> {
    try {
        return await wpBuscarOpcional<WPProduction[]>(
            `/wp/v2/production${buildParams({ artist_slug: artistSlug, per_page: perPage, status: 'publish', _fields: 'id,slug,title,date,featured_image_url,acf,production_genre', orderby: 'date', order: 'desc' })}`,
            { revalidate: 1800, tags: [WP_CACHE_TAGS.productions] },
        )
    } catch { return [] }
}

export async function getRelatedProductions(genreId: number, excludeId: number, perPage = 6): Promise<WPProduction[]> {
    try {
        return await wpBuscarOpcional<WPProduction[]>(
            `/wp/v2/production${buildParams({ production_genre: genreId, exclude: excludeId, per_page: perPage, status: 'publish', _fields: 'id,slug,title,date,featured_image_url,acf,production_genre', orderby: 'date', order: 'desc' })}`,
            { revalidate: 1800, tags: [WP_CACHE_TAGS.productions] },
        )
    } catch { return [] }
}

export async function getSmartRelatedProductions({
    excludeId,
    genreId,
    type,
    castSlugs = [],
    genres: _genres = [],
    perPage = 6,
}: {
    excludeId: number
    genreId?: number
    type?: ProductionsQuery['type']
    castSlugs?: string[]
    genres?: string[]
    perPage?: number
}): Promise<WPProduction[]> {
    const [castResults, genreResults, fallbackResult] = await Promise.all([
        Promise.all(castSlugs.slice(0, 1).map(slug => getProductionsByArtist(slug, perPage))),
        genreId ? getRelatedProductions(genreId, excludeId, perPage) : Promise.resolve([]),
        getProductions({ type, perPage: 12, orderby: 'trending_score', order: 'desc' })
            .then(result => result.items)
            .catch(() => []),
    ])
    return [...castResults.flat(), ...genreResults, ...fallbackResult]
        .filter(p => p.id !== excludeId)
        .filter((p, i, all) => all.findIndex(x => x.id === p.id) === i)
        .slice(0, perPage)
}
