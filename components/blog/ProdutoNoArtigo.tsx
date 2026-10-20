import { StoreCard } from '@/components/ui/StoreCard'
import type { StoreProduct } from '@/lib/wordpress/store'

/**
 * Produto mostrado no ponto do texto em que ele é o assunto (bloco `product` do editor).
 * Usa o mesmo cartão da loja, então foto, preço e selos são os de agora e o clique entra na medição.
 */
export function ProdutoNoArtigo({ produto, legendaHtml, contexto }: { produto: StoreProduct; legendaHtml?: string; contexto: string }) {
    return (
        <figure className="not-prose my-8 mx-auto w-full max-w-[280px]" data-produto-no-artigo={produto.id}>
            <StoreCard product={produto} contexto={contexto} />
            {legendaHtml ? <figcaption className="mt-2 text-center text-xs leading-snug text-foreground-subtle" dangerouslySetInnerHTML={{ __html: legendaHtml }} /> : null}
        </figure>
    )
}
