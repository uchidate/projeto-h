import { wpFetchWithTotal } from './client'
import { WP_CACHE_TAGS } from './cache'
import { garantirRankingRemoto } from './ranking-remoto'

export type StoreProduct = {
    id: number
    title: { rendered: string }
    date_gmt: string
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
        price_history: { date: string; price: string }[] | null
    }
}

/** Calcula o desconto real a partir dos dois preços já gravados — nunca inventa percentual. */
export function calcularDesconto(price?: string | null, originalPrice?: string | null): number | null {
    if (!price || !originalPrice) return null
    const parse = (s: string) => Number(s.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'))
    const atual = parse(price)
    const original = parse(originalPrice)
    if (!Number.isFinite(atual) || !Number.isFinite(original) || original <= atual) return null
    return Math.round(((original - atual) / original) * 100)
}

const parsePrecoBR = (s: string) => Number(s.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'))

/**
 * Queda real de preço: o maior valor registrado na janela contra o atual. Só existe quando o
 * histórico tem leituras na janela, o preço atual é menor que o maior delas e a queda passa de
 * `minimoPercentual` — preço parado ou oscilação de centavos nunca vira "queda".
 */
export function quedaDePreco(
    price: string | null,
    history: { date: string; price: string }[] | null,
    dias = 30,
    minimoPercentual = 5,
): { de: number; percentual: number } | null {
    if (!price || !history || history.length < 2) return null
    const atual = parsePrecoBR(price)
    if (!Number.isFinite(atual) || atual <= 0) return null
    const limite = Date.now() - dias * 24 * 60 * 60 * 1000
    const janela = history.filter(h => new Date(h.date).getTime() >= limite).map(h => parsePrecoBR(h.price)).filter(Number.isFinite)
    if (janela.length < 2) return null
    const maior = Math.max(...janela)
    if (maior <= atual) return null
    const percentual = Math.round(((maior - atual) / maior) * 100)
    return percentual >= minimoPercentual ? { de: maior, percentual } : null
}

/**
 * true só quando o preço atual é o menor da janela E já foi mais alto nela (houve queda real).
 * Preço que ficou igual o tempo todo não é "menor preço": antes do histórico diário isso passava
 * despercebido, com leituras diárias todo produto estável ganharia o selo.
 */
export function ehMenorPrecoEmDias(price: string | null, history: { date: string; price: string }[] | null, dias = 30): boolean {
    if (!price || !history || history.length < 2) return false
    const atual = parsePrecoBR(price)
    if (!Number.isFinite(atual)) return false
    const limite = Date.now() - dias * 24 * 60 * 60 * 1000
    const janela = history.filter(h => new Date(h.date).getTime() >= limite).map(h => parsePrecoBR(h.price)).filter(Number.isFinite)
    if (janela.length < 2) return false
    return atual <= Math.min(...janela) && Math.max(...janela) > atual
}

/** Data real de publicação do post — nunca "novo" fabricado. */
export function ehNovo(dateGmt: string, dias = 14): boolean {
    const publicado = new Date(`${dateGmt}Z`).getTime()
    if (!Number.isFinite(publicado)) return false
    return Date.now() - publicado <= dias * 24 * 60 * 60 * 1000
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
    alimenta:    'Comida Coreana', // valor gravado por engano no lugar de "snacks" nos produtos importados
    outros:      'Outros',
}

export function formatCategory(category: string): string {
    return CATEGORY_LABELS[category] ?? category.replace(/_/g, ' ')
}

export async function getStoreProducts(): Promise<StoreProduct[]> {
    // Toda rota que ordena prateleira lê os produtos antes; aqui o ranking remoto já fica em memória
    // para o ordenarPrateleira (síncrono) usar. Não lança: falha mantém o ranking anterior ou o arquivo.
    await garantirRankingRemoto()
    const opts = { revalidate: 300, tags: [WP_CACHE_TAGS.storeProducts] }
    const first = await wpFetchWithTotal<StoreProduct>(
        '/wp/v2/store_products?per_page=100&page=1&orderby=id&order=asc&status=publish',
        opts,
    )
    if (!Array.isArray(first.items)) return []
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

/** Tipo de página para a vitrine de reserva: o que combina com quem está lendo. */
export type TipoVitrine = 'kpop' | 'drama'

const CATEGORIAS_POR_TIPO: Record<TipoVitrine, readonly string[]> = {
    kpop: ['photocard', 'lightstick', 'kpop_album', 'kbeauty', 'clothing', 'acessorios'],
    drama: ['alimenta', 'kbeauty', 'acessorios', 'outros'],
}

/**
 * Vitrine de reserva (páginas sem produto próprio): só produto com preço e link, do tipo que combina
 * com a página (K-pop → photocard, lightstick, álbum; drama → comida e K-beauty). Antes eram só os
 * "destaques", que hoje estão quase todos sem preço, e o mesmo macarrão aparecia na ficha de qualquer artista.
 * Se o filtro deixa menos de 3, completa com os demais com preço, para a vitrine não esvaziar.
 */
export async function getFeaturedStoreProducts(limit = 5, tipo?: TipoVitrine): Promise<StoreProduct[]> {
    const products = await getStoreProducts()
    const validos = products.filter(p => !p.acf.is_hidden && p.acf.affiliate_url && p.acf.price)
    const doTipo = tipo ? validos.filter(p => CATEGORIAS_POR_TIPO[tipo].includes(p.acf.category ?? '')) : validos
    const base = doTipo.length >= 3 ? doTipo : validos
    const peso = (p: StoreProduct) => (p.acf.featured ? 2 : 0) + (calcularDesconto(p.acf.price, p.acf.original_price) !== null ? 1 : 0)
    return [...base].sort((a, b) => peso(b) - peso(a) || (a.acf.position ?? 999) - (b.acf.position ?? 999)).slice(0, limit)
}
