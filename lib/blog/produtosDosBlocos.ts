import type { WPPost } from '@/lib/wordpress/types'
import { getStoreProducts, type StoreProduct } from '@/lib/wordpress/store'

/** Produtos citados por blocos `product` do artigo, só os que ainda podem ser exibidos (visíveis e com link). */
export async function getProdutosDosBlocos(post: WPPost | null | undefined): Promise<StoreProduct[]> {
    if (!post?.article_blocks?.length) return []
    const ids = new Set<number>()
    const varrer = (blocos: NonNullable<typeof post.article_blocks>) => {
        for (const b of blocos) {
            if (b.name.endsWith('/product') && Number(b.attrs?.productId) > 0) ids.add(Number(b.attrs.productId))
            if (b.innerBlocks?.length) varrer(b.innerBlocks)
        }
    }
    varrer(post.article_blocks)
    if (ids.size === 0) return []
    const todos = await getStoreProducts()
    return todos.filter(p => ids.has(p.id) && !p.acf.is_hidden && p.acf.affiliate_url)
}
