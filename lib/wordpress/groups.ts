import { wpBuscarOpcional, wpFetchWithTotal, buildParams, wpFetchPorSlug } from './client'
import { getWPItemTag, WP_CACHE_TAGS } from './cache'
import type { WPGroup } from './types'

export type GroupsQuery = {
    /** Só itens com tradução publicada neste idioma (REST `oc_locale`); traz `translations`. */
    locale?: string
    page?: number
    perPage?: number
    search?: string
    type?: 'girl_group' | 'boy_group' | 'co_ed' | 'solo'
    active?: boolean
    /** 'popularity' = relevância (meta popularity_score via oc_orderby, fallback date) */
    orderby?: 'date' | 'title' | 'modified' | 'menu_order' | 'popularity'
    order?: 'desc' | 'asc'
    slug?: string
    letter?: string
    agency?: number
    agencies?: number[]
    /** filtro por geração — 'YYYYMMDD' (ou prefixo 'YYYY'), comparado contra debut_date */
    debutMin?: string
    debutMax?: string
}

export async function getGroups(query: GroupsQuery = {}) {
    const { page = 1, perPage = 24, search, type, active, orderby = 'date', order = 'desc', slug, letter, agency, agencies, debutMin, debutMax, locale } = query
    const isMetaOrder = orderby === 'popularity'
    const params: Record<string, string | number | boolean | undefined> = {
        // oc_orderby é aplicado no PHP (oc_meta_orderby); orderby=date fica como
        // fallback caso o filtro ainda não esteja deployado no WP.
        page, per_page: perPage, orderby: isMetaOrder ? 'date' : orderby, order, status: 'publish',
        oc_orderby: isMetaOrder ? 'popularity' : undefined,
        _fields: locale ? 'id,slug,title,date,featured_image_url,acf,translations' : 'id,slug,title,date,featured_image_url,acf',
        oc_locale: locale,
        slug: slug ?? undefined, search: search ?? undefined,
        oc_type: type, oc_active: active !== undefined ? String(active) : undefined,
        oc_letter: letter ?? undefined, oc_agency: agency ?? undefined,
        oc_agencies: agencies?.length ? agencies.join(',') : undefined,
        oc_debut_min: debutMin ?? undefined, oc_debut_max: debutMax ?? undefined,
    }
    return wpFetchWithTotal<WPGroup>(`/wp/v2/group${buildParams(params)}`, {
        revalidate: 1800, tags: [WP_CACHE_TAGS.groups],
    })
}

/**
 * Fetches the complete group directory in cached WordPress pages.
 * Intended for lightweight relationship maps such as the agency directory.
 */
export async function getAllGroups(query: Omit<GroupsQuery, 'page' | 'perPage'> = {}): Promise<WPGroup[]> {
    const perPage = 100
    const first = await getGroups({ ...query, page: 1, perPage })
    if (first.totalPages <= 1) return first.items

    const remaining = await Promise.all(
        Array.from({ length: first.totalPages - 1 }, (_, index) =>
            getGroups({ ...query, page: index + 2, perPage }),
        ),
    )
    return [first.items, ...remaining.map(result => result.items)].flat()
}

export async function getTrendingGroups(limit = 10): Promise<WPGroup[]> {
    // Ordenação server-side via oc_meta_orderby (cpts.php) — evita baixar o
    // catálogo inteiro só para ordenar aqui.
    return wpBuscarOpcional<WPGroup[]>(
        `/wp/v2/group${buildParams({ per_page: limit, status: 'publish', _fields: 'id,slug,title,featured_image_url,acf', oc_orderby: 'trending_score', order: 'desc' })}`,
        { revalidate: 300, tags: [WP_CACHE_TAGS.groups, WP_CACHE_TAGS.trendingGroups] },
    )
}

export async function getGroupsByIds(ids: number[]): Promise<WPGroup[]> {
    if (!ids.length) return []
    try {
        return await wpBuscarOpcional<WPGroup[]>(
            `/wp/v2/group${buildParams({ include: ids.join(','), per_page: ids.length, status: 'publish', _fields: 'id,slug,title,date,featured_image_url,acf', orderby: 'include' })}`,
            { revalidate: 1800, tags: [WP_CACHE_TAGS.groups] },
        )
    } catch { return [] }
}

export async function getGroupsByMemberId(memberId: number): Promise<WPGroup[]> {
    if (!memberId) return []
    try {
        return await wpBuscarOpcional<WPGroup[]>(
            `/wp/v2/group${buildParams({ oc_member: memberId, per_page: 20, status: 'publish', _fields: 'id,slug,title,date,featured_image_url,acf', orderby: 'date', order: 'desc' })}`,
            { revalidate: 1800, tags: [WP_CACHE_TAGS.groups] },
        )
    } catch { return [] }
}

export async function getRelatedGroups(excludeId: number, agencyId?: number, perPage = 6): Promise<WPGroup[]> {
    try {
        const groups = await wpBuscarOpcional<WPGroup[]>(
            `/wp/v2/group${buildParams({ per_page: perPage, status: 'publish', _fields: 'id,slug,title,date,featured_image_url,acf', orderby: 'date', order: 'desc', exclude: excludeId, oc_agency: agencyId })}`,
            { revalidate: 1800, tags: [WP_CACHE_TAGS.groups] },
        )
        return groups.slice(0, perPage)
    } catch { return [] }
}

/** Grupos com pelo menos um membro na posição informada (leader, main_vocal, visual, maknae, etc.) */
export async function getGroupsByPosition(position: string): Promise<WPGroup[]> {
    try {
        return await wpBuscarOpcional<WPGroup[]>(
            `/wp/v2/group${buildParams({ oc_position: position, per_page: 100, status: 'publish', _fields: 'id,slug,title,featured_image_url,acf,member_positions', orderby: 'title', order: 'asc' })}`,
            { revalidate: 1800, tags: [WP_CACHE_TAGS.groups] },
        )
    } catch { return [] }
}

export async function getGroupBySlug(slug: string): Promise<WPGroup | null> {
    // wpFetchPorSlug e nao wpFetch: `[]` de um wpFetch com falha e
    // indistinguivel de "nao existe", e o notFound() da pagina transformava
    // um soluço do WordPress em 404 permanente aos olhos do Google.
    return wpFetchPorSlug<WPGroup>(
        `/wp/v2/group${buildParams({ slug, status: 'publish', _embed: true })}`,
        { revalidate: 1800, tags: [getWPItemTag('group', slug)] },
    )
}
