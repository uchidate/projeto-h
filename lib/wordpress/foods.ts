import { wpBuscarOpcional, wpFetchWithTotal, buildParams, wpFetchPorSlug } from './client'
import { getWPItemTag, WP_CACHE_TAGS } from './cache'
import type { WPFood, FoodCategory } from './types'

export type FoodsQuery = {
    page?: number
    perPage?: number
    search?: string
    orderby?: 'date' | 'title' | 'modified' | 'trending_score'
    order?: 'desc' | 'asc'
    slug?: string
    category?: FoodCategory
    letter?: string
    vegetarian?: boolean
    maxSpicy?: number
    occasion?: string
    season?: string
    region?: string
}

export async function getFoods(query: FoodsQuery = {}) {
    const {
        page = 1, perPage = 24, search, orderby = 'date', order = 'desc',
        slug, category, letter, vegetarian, maxSpicy, occasion, season, region,
    } = query

    const params: Record<string, string | number | boolean | undefined> = {
        page, per_page: perPage, orderby, order, status: 'publish',
        _fields: 'id,slug,title,excerpt,date,featured_image_url,acf',
        slug: slug ?? undefined,
        search: search ?? undefined,
        oc_category: category ?? undefined,
        oc_letter: letter ?? undefined,
        oc_vegetarian: vegetarian ? 'true' : undefined,
        oc_max_spicy: maxSpicy ?? undefined,
        oc_occasion: occasion ?? undefined,
        oc_season: season ?? undefined,
        oc_region: region ?? undefined,
    }

    return wpFetchWithTotal<WPFood>(`/wp/v2/food${buildParams(params)}`, {
        revalidate: 1800,
        tags: [WP_CACHE_TAGS.foods],
    })
}

export async function getFoodBySlug(slug: string): Promise<WPFood | null> {
    // wpFetchPorSlug e nao wpFetch: `[]` de um wpFetch com falha e
    // indistinguivel de "nao existe", e o notFound() da pagina transformava
    // um soluço do WordPress em 404 permanente aos olhos do Google.
    return wpFetchPorSlug<WPFood>(
        `/wp/v2/food${buildParams({ slug, status: 'publish', _embed: true })}`,
        { revalidate: 1800, tags: [getWPItemTag('food', slug)] },
    )
}

export async function getFoodsByIds(ids: number[]): Promise<WPFood[]> {
    if (!ids.length) return []
    try {
        return await wpBuscarOpcional<WPFood[]>(
            `/wp/v2/food${buildParams({
                include: ids.join(','),
                per_page: ids.length,
                status: 'publish',
                _fields: 'id,slug,title,featured_image_url,acf',
                orderby: 'include',
            })}`,
            { revalidate: 1800, tags: [WP_CACHE_TAGS.foods] },
        )
    } catch { return [] }
}

export async function getRelatedFoods(excludeId: number, category?: FoodCategory, perPage = 6): Promise<WPFood[]> {
    try {
        const params: Record<string, string | number | boolean | undefined> = {
            per_page: 24, status: 'publish',
            _fields: 'id,slug,title,featured_image_url,acf',
            orderby: 'date', order: 'desc', exclude: excludeId,
            oc_category: category ?? undefined,
        }
        const pool = await wpBuscarOpcional<WPFood[]>(
            `/wp/v2/food${buildParams(params)}`,
            { revalidate: 1800, tags: [WP_CACHE_TAGS.foods] },
        )
        const seed = excludeId % (pool.length || 1)
        const shuffled = [...pool.slice(seed), ...pool.slice(0, seed)]
        return shuffled.slice(0, perPage)
    } catch { return [] }
}

export const FOOD_CATEGORY_LABELS: Record<string, string> = {
    rice:        'Arroz',
    noodles:     'Macarrão',
    soup_stew:   'Sopas e Guisados',
    bbq:         'Churrasco',
    pancake:     'Jeon / Pajeon',
    street_food: 'Street Food',
    banchan:     'Banchan',
    dessert:     'Sobremesas',
    drink:       'Bebidas',
    snack:       'Snacks',
}

export const FOOD_CATEGORY_EMOJI: Record<string, string> = {
    rice:        '🍚',
    noodles:     '🍜',
    soup_stew:   '🍲',
    bbq:         '🥩',
    pancake:     '🥞',
    street_food: '🌮',
    banchan:     '🥗',
    dessert:     '🍡',
    drink:       '🍵',
    snack:       '🍘',
}

// Lista fechada de regiões (17 divisões de primeiro nível da Coreia do Sul) —
// precisa espelhar $valid_regions em plugin de CPTs do WordPress (filtro oc_region).
export const KOREA_REGIONS = [
    'Seoul', 'Busan', 'Daegu', 'Incheon', 'Gwangju', 'Daejeon', 'Ulsan', 'Sejong',
    'Gyeonggi', 'Gangwon', 'Chungbuk', 'Chungnam', 'Jeonbuk', 'Jeonnam',
    'Gyeongbuk', 'Gyeongnam', 'Jeju',
] as const

export type KoreaRegion = typeof KOREA_REGIONS[number]
