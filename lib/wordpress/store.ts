import { wpFetchWithTotal } from './client'
import { WP_CACHE_TAGS } from './cache'

export type StoreProduct = {
    id: number
    title: { rendered: string }
    acf: {
        price: string | null
        original_price: string | null
        image_url: string | null
        affiliate_url: string | null
        store: string | null          // shopee | amazon | mercadolivre | magalu | shein | outro
        category: string | null       // kpop_album | lightstick | kbeauty | kdrama | clothing | acessorios | photocard | snacks | outros
        badge: string | null
        rating: number | null
        sold_count: string | null
        featured: boolean | null
        is_hidden: boolean | null
        position: number | null
        related_group: number | null
        related_artist: number | null
    }
}

export const STORE_LABELS: Record<string, string> = {
    shopee:       'Shopee',
    amazon:       'Amazon',
    mercadolivre: 'Mercado Livre',
    magalu:       'Magalu',
    shein:        'Shein',
    outro:        'Parceiros',
}

export const CATEGORY_LABELS: Record<string, string> = {
    kpop_album:  'Álbuns K-Pop',
    lightstick:  'Lightsticks',
    kbeauty:     'K-Beauty',
    kdrama:      'K-Drama',
    clothing:    'Moda',
    acessorios:  'Acessórios',
    photocard:   'Photocards',
    snacks:      'Snacks',
    outros:      'Outros',
}

export function formatCategory(category: string): string {
    return CATEGORY_LABELS[category] ?? category.replace(/_/g, ' ')
}

export async function getStoreProducts(): Promise<StoreProduct[]> {
    const opts = { revalidate: 300, tags: [WP_CACHE_TAGS.storeProducts] }
    const first = await wpFetchWithTotal<StoreProduct>(
        '/wp/v2/store_products?per_page=100&page=1&orderby=id&order=asc&status=publish',
        opts,
    )
    const items = [...first.items]
    for (let page = 2; page <= first.totalPages; page++) {
        const next = await wpFetchWithTotal<StoreProduct>(
            `/wp/v2/store_products?per_page=100&page=${page}&orderby=id&order=asc&status=publish`,
            opts,
        )
        items.push(...next.items)
    }
    return items
}

export async function getStoreProductsByGroupId(groupId: number): Promise<StoreProduct[]> {
    const products = await getStoreProducts()
    return products.filter(p => !p.acf.is_hidden && p.acf.related_group === groupId)
}

export async function getStoreProductsByArtistId(artistId: number): Promise<StoreProduct[]> {
    const products = await getStoreProducts()
    return products.filter(p => !p.acf.is_hidden && p.acf.related_artist === artistId)
}
