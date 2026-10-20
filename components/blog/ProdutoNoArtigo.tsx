import { StoreCard } from '@/components/ui/StoreCard'
import type { StoreProduct } from '@/lib/wordpress/store'

export interface ProdutoDoTexto {
    produto: StoreProduct
    legendaHtml?: string
}

function Legenda({ html }: { html?: string }) {
    if (!html) return null
    // `<p>` e não `<figcaption>`: o estilo global de legenda de imagem (borda lateral, mono, itálico) não cabe num cartão de loja.
    return <p className="mt-2 text-xs leading-snug text-foreground-subtle" dangerouslySetInnerHTML={{ __html: html }} />
}

/**
 * Produto mostrado no ponto do texto em que ele é o assunto (bloco `product` do editor).
 * Usa o mesmo cartão da loja, então foto, preço e selos são os de agora e o clique entra na medição.
 */
export function ProdutoNoArtigo({ produto, legendaHtml, contexto }: ProdutoDoTexto & { contexto: string }) {
    return (
        <figure className="not-prose my-8 mx-auto w-full max-w-[280px]" data-produto-no-artigo={produto.id}>
            <StoreCard product={produto} contexto={contexto} />
            <Legenda html={legendaHtml} />
        </figure>
    )
}

/**
 * Blocos de produto em sequência viram uma prateleira: lado a lado no desktop (2 ou 3 colunas, conforme a
 * quantidade) e em 2 colunas no celular, em vez de uma coluna longa de cartões de 280 px.
 */
export function ProdutosNoArtigo({ itens, contexto }: { itens: ProdutoDoTexto[]; contexto: string }) {
    if (itens.length === 1) return <ProdutoNoArtigo {...itens[0]} contexto={contexto} />
    const colunas = itens.length === 2 || itens.length === 4 ? 'md:grid-cols-2 md:max-w-[34rem]' : 'md:grid-cols-3'
    return (
        <div className={`not-prose my-8 mx-auto grid grid-cols-2 gap-3 sm:gap-4 ${colunas}`} data-produtos-no-artigo={itens.length}>
            {itens.map(({ produto, legendaHtml }) => (
                <figure key={produto.id} className="min-w-0" data-produto-no-artigo={produto.id}>
                    <StoreCard product={produto} contexto={contexto} />
                    <Legenda html={legendaHtml} />
                </figure>
            ))}
        </div>
    )
}
