import { wpBuscarOpcional, wpFetchWithTotal, buildParams, wpFetchPorSlug } from './client'
import { getWPItemTag, WP_CACHE_TAGS } from './cache'
import type { WPArtist } from './types'

export type ArtistsQuery = {
    /** Só itens com tradução publicada neste idioma (REST `oc_locale`); traz `translations`. */
    locale?: string
    page?: number
    perPage?: number
    search?: string
    orderby?: 'date' | 'title' | 'modified' | 'menu_order' | 'trending_score' | 'popularity'
    order?: 'desc' | 'asc'
    slug?: string
    role?: string       // singer | actor | rapper | dancer | model | host | composer
    gender?: 'male' | 'female'
    letter?: string     // A–Z, primeira letra do nome
    birthMonth?: number // 1-12
    agency?: number
    agencies?: number[]
    affiliation?: 'group' | 'solo'
}

export async function getArtists(query: ArtistsQuery = {}) {
    const { page = 1, perPage = 24, search, orderby = 'date', order = 'desc', slug, role, gender, letter, birthMonth, agency, agencies, affiliation, locale } = query
    const isMetaOrder = orderby === 'trending_score' || orderby === 'popularity'
    const params: Record<string, string | number | boolean | undefined> = {
        page, per_page: perPage, orderby: isMetaOrder ? 'date' : orderby, order, status: 'publish',
        _fields: locale ? 'id,slug,title,date,featured_image_url,acf,translations' : 'id,slug,title,date,featured_image_url,acf',
        oc_locale: locale,
        slug: slug ?? undefined, search: search ?? undefined,
        oc_role: role ?? undefined, oc_gender: gender ?? undefined,
        oc_letter: letter ?? undefined,
        oc_birth_month: birthMonth ?? undefined, oc_agency: agency ?? undefined,
        oc_agencies: agencies?.length ? agencies.join(',') : undefined,
        oc_affiliation: affiliation ?? undefined,
        oc_orderby: isMetaOrder ? orderby : undefined,
    }
    return wpFetchWithTotal<WPArtist>(`/wp/v2/artist${buildParams(params)}`, {
        revalidate: 1800, tags: [WP_CACHE_TAGS.artists],
    })
}

export async function getArtistsByIds(ids: number[]): Promise<WPArtist[]> {
    if (!ids.length) return []
    try {
        return await wpBuscarOpcional<WPArtist[]>(
            `/wp/v2/artist${buildParams({ include: ids.join(','), per_page: ids.length, status: 'publish', _fields: 'id,slug,title,date,featured_image_url,acf', orderby: 'include' })}`,
            { revalidate: 1800, tags: [WP_CACHE_TAGS.artists] },
        )
    } catch { return [] }
}

export async function getArtistBySlug(slug: string): Promise<WPArtist | null> {
    // wpFetchPorSlug e nao wpFetch: `[]` de um wpFetch com falha e
    // indistinguivel de "nao existe", e o notFound() da pagina transformava
    // um soluço do WordPress em 404 permanente aos olhos do Google.
    return wpFetchPorSlug<WPArtist>(
        `/wp/v2/artist${buildParams({ slug, status: 'publish', _embed: true })}`,
        { revalidate: 1800, tags: [getWPItemTag('artist', slug)] },
    )
}

export async function getRelatedArtists(excludeId: number, agencyId?: number, role?: string, perPage = 6): Promise<WPArtist[]> {
    try {
        // With agency: fetch same-agency artists (most relevant)
        if (agencyId) {
            const artists = await wpBuscarOpcional<WPArtist[]>(
                `/wp/v2/artist${buildParams({ per_page: perPage, status: 'publish', _fields: 'id,slug,title,featured_image_url,acf', orderby: 'modified', order: 'desc', exclude: excludeId, oc_agency: agencyId })}`,
                { revalidate: 1800, tags: [WP_CACHE_TAGS.artists] },
            )
            if (artists.length >= 3) return artists.slice(0, perPage)
        }
        // Fallback: fetch by role to show musically similar artists
        const params: Record<string, string | number | boolean | undefined> = { per_page: 24, status: 'publish', _fields: 'id,slug,title,featured_image_url,acf', orderby: 'modified', order: 'desc', exclude: excludeId }
        if (role) params.oc_role = role
        const pool = await wpBuscarOpcional<WPArtist[]>(
            `/wp/v2/artist${buildParams(params)}`,
            { revalidate: 1800, tags: [WP_CACHE_TAGS.artists] },
        )
        // Shuffle pool using excludeId as seed for variety between artists
        const seed = excludeId % pool.length || 1
        const shuffled = [...pool.slice(seed), ...pool.slice(0, seed)]
        return shuffled.slice(0, perPage)
    } catch { return [] }
}

// Artistas ordenados por streaming_score (presença nos Top 10 das plataformas)
// combinado com trending_score para desempate.
export async function getStreamingArtists(limit = 12) {
    const artists = await wpBuscarOpcional<WPArtist[]>(
        `/wp/v2/artist${buildParams({ per_page: 100, status: 'publish', _fields: 'id,slug,title,featured_image_url,acf', orderby: 'modified', order: 'desc' })}`,
        { revalidate: 300, tags: [WP_CACHE_TAGS.artists, WP_CACHE_TAGS.trendingArtists] },
    )
    return artists
        .filter(a => (a.acf?.streaming_score ?? 0) > 0)
        .sort((a, b) => {
            const streamingDiff = (b.acf?.streaming_score ?? 0) - (a.acf?.streaming_score ?? 0)
            if (streamingDiff !== 0) return streamingDiff
            return (b.acf?.trending_score ?? 0) - (a.acf?.trending_score ?? 0)
        })
        .slice(0, limit)
}

export async function getTrendingArtists(limit = 10) {
    const artists = await wpBuscarOpcional<WPArtist[]>(
        `/wp/v2/artist${buildParams({ per_page: limit, status: 'publish', _fields: 'id,slug,title,featured_image_url,acf', oc_orderby: 'trending_score', order: 'desc' })}`,
        { revalidate: 300, tags: [WP_CACHE_TAGS.artists, WP_CACHE_TAGS.trendingArtists] },
    )
    return artists
        .sort((a, b) => (b.acf?.trending_score ?? 0) - (a.acf?.trending_score ?? 0))
        .slice(0, limit)
}

/** Interesse acumulado verificável, distinto de tendência recente. */
/**
 * Os artistas que o público do site mais abriu, por access_score —
 * sessões distintas medidas no Umami (scripts/update-artist-access.mjs).
 *
 * Distinto de getPopularArtists, que ordena por popularity_score: aquele vem
 * de pageviews da Wikipédia EN e mede interesse global, o que é o critério
 * certo para decidir sobre quem ainda vale escrever — e por isso ordena a fila
 * de dossiês — mas não diz nada sobre este site.
 *
 * O recuo para popularidade não é decoração: access_score só existe depois de
 * o script rodar, e a home não pode ficar vazia até lá.
 */
export async function getMostAccessedArtists(limit = 10) {
    const acessados = await wpBuscarOpcional<WPArtist[]>(
        `/wp/v2/artist${buildParams({ per_page: limit, status: 'publish', _fields: 'id,slug,title,featured_image_url,acf', oc_orderby: 'access', order: 'desc' })}`,
        { revalidate: 300, tags: [WP_CACHE_TAGS.artists, WP_CACHE_TAGS.trendingArtists] },
    )
    if (acessados.some(artist => (artist.acf?.access_score ?? 0) > 0)) {
        return acessados
            .sort((a, b) => (b.acf?.access_score ?? 0) - (a.acf?.access_score ?? 0))
            .slice(0, limit)
    }
    return getPopularArtists(limit)
}

export async function getPopularArtists(limit = 10) {
    const popular = await wpBuscarOpcional<WPArtist[]>(
        `/wp/v2/artist${buildParams({ per_page: limit, status: 'publish', _fields: 'id,slug,title,featured_image_url,acf', oc_orderby: 'popularity', order: 'desc' })}`,
        { revalidate: 300, tags: [WP_CACHE_TAGS.artists, WP_CACHE_TAGS.trendingArtists] },
    )
    if (popular.some(artist => (artist.acf?.popularity_score ?? 0) > 0)) {
        return popular
            .sort((a, b) => (b.acf?.popularity_score ?? 0) - (a.acf?.popularity_score ?? 0))
            .slice(0, limit)
    }
    return getTrendingArtists(limit)
}
