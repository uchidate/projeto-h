import { wpFetchItem, wpFetchWithTotal, buildParams, wpFetchPorSlug } from './client'
import { getWPItemTag, WP_CACHE_TAGS } from './cache'
import type { WPAgency } from './types'

export type AgenciesQuery = {
    page?: number
    perPage?: number
    search?: string
    orderby?: 'date' | 'title' | 'modified' | 'menu_order'
    order?: 'desc' | 'asc'
    slug?: string
}

export async function getAgencies(query: AgenciesQuery = {}) {
    const { page = 1, perPage = 24, search, orderby = 'date', order = 'desc', slug } = query
    const params: Record<string, string | number | boolean | undefined> = {
        page, per_page: perPage, orderby, order, status: 'publish',
        _fields: 'id,slug,title,date,excerpt,featured_image_url,acf,agency_type,accent_color,country,milestones,achievements',
        slug: slug ?? undefined, search: search ?? undefined,
    }
    return wpFetchWithTotal<WPAgency>(`/wp/v2/agency${buildParams(params)}`, {
        revalidate: 3600, tags: [WP_CACHE_TAGS.agencies],
    })
}

export async function getAgencyById(id: number): Promise<WPAgency | null> {
    if (!id) return null
    try {
        // wpFetchItem devolve null em erro/timeout e quando o WP responde array
        // no lugar do objeto — antes o [] (truthy) passava adiante como se fosse
        // uma agência e `agency.title.rendered` derrubava a página de
        // artista/grupo em qualquer soluço do WP.
        return await wpFetchItem<WPAgency>(
            `/wp/v2/agency/${id}${buildParams({ _embed: true })}`,
            { revalidate: 3600, tags: [WP_CACHE_TAGS.agencies] },
        )
    } catch { return null }
}

export async function getAgencyBySlug(slug: string): Promise<WPAgency | null> {
    // wpFetchPorSlug e nao wpFetch: `[]` de um wpFetch com falha e
    // indistinguivel de "nao existe", e o notFound() da pagina transformava
    // um soluço do WordPress em 404 permanente aos olhos do Google.
    return wpFetchPorSlug<WPAgency>(
        `/wp/v2/agency${buildParams({ slug, status: 'publish', _embed: true })}`,
        { revalidate: 3600, tags: [getWPItemTag('agency', slug)] },
    )
}
