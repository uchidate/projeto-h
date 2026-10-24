import type { StoreProduct } from '@/lib/wordpress/store'

/** Vendidos informados pelo marketplace (campo de texto no WP). Ausente ou ilegível vale zero. */
export function vendidos(p: StoreProduct): number {
    const n = Number(String(p.acf.sold_count ?? '').replace(/\D/g, ''))
    return Number.isFinite(n) ? n : 0
}

/**
 * Os mais vendidos entre os produtos que o visitante consegue comprar (com preço, imagem e link).
 * Sem nenhum número de vendas devolve vazio: o título "Mais vendidos" não pode ser dito sem dado.
 */
export function maisVendidos(produtos: StoreProduct[], n = 5): StoreProduct[] {
    return produtos
        .filter(p => !p.acf.is_hidden && p.acf.affiliate_url && p.acf.price && p.acf.image_url && vendidos(p) > 0)
        .sort((a, b) => vendidos(b) - vendidos(a))
        .slice(0, n)
}
