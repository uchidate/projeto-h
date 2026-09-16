export const WP_CACHE_TAGS = {
    posts: 'posts',
    productions: 'productions',
    artists: 'artists',
    trendingArtists: 'artists-trending',
    groups: 'groups',
    trendingGroups: 'groups-trending',
    agencies: 'agencies',
    foods: 'foods',
    companies: 'companies',
    categories: 'categories',
    tags: 'tags',
    productionGenres: 'production-genres',
    productionPlatforms: 'production-platforms',
    siteSettings: 'site-settings',
    monetization: 'monetization',
    guias: 'guias',
    storeProducts: 'store-products',
    musicReleases: 'music-releases',
} as const

export type WPPostType = 'post' | 'production' | 'artist' | 'group' | 'agency' | 'food' | 'company' | 'music_release'

const COLLECTION_TAG_BY_TYPE: Record<WPPostType, string> = {
    post: WP_CACHE_TAGS.posts,
    production: WP_CACHE_TAGS.productions,
    artist: WP_CACHE_TAGS.artists,
    group: WP_CACHE_TAGS.groups,
    agency: WP_CACHE_TAGS.agencies,
    food: WP_CACHE_TAGS.foods,
    company: WP_CACHE_TAGS.companies,
    music_release: WP_CACHE_TAGS.musicReleases,
}

export function isWPPostType(value: unknown): value is WPPostType {
    return typeof value === 'string' && value in COLLECTION_TAG_BY_TYPE
}

export function getWPCollectionTag(type: WPPostType): string {
    return COLLECTION_TAG_BY_TYPE[type]
}

export function getWPItemTag(type: WPPostType, slug: string): string {
    return `${type}-${slug}`
}

const COLLECTION_TAGS: string[] = Object.values(WP_CACHE_TAGS)
const ITEM_TAG_PREFIXES = Object.keys(COLLECTION_TAG_BY_TYPE) as WPPostType[]

/**
 * O admin do WP monta a tag de item como `music-release-<slug>`, mas as páginas
 * registram `music_release-<slug>` (getWPItemTag usa o post type cru). Sem
 * normalizar, o botão "Revalidar cache" invalida uma tag que ninguém usa.
 */
export function normalizeWPTag(tag: string): string {
    return tag.startsWith('music-release-') ? tag.replace('music-release-', 'music_release-') : tag
}

/** Aceita tag de coleção conhecida ou tag de item de um post type válido. */
export function isKnownWPTag(tag: string): boolean {
    const normalized = normalizeWPTag(tag)
    if (COLLECTION_TAGS.includes(normalized)) return true
    return ITEM_TAG_PREFIXES.some(type => normalized.startsWith(`${type}-`) && normalized.length > type.length + 1)
}
