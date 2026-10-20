import type { ReactNode } from 'react'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import type { ArticleModel } from '@/lib/blog/articleModel'
import { ProdutosNoArtigo, type ProdutoDoTexto } from '@/components/blog/ProdutoNoArtigo'
import { BLOCK_ALT_PREFIX } from '@/lib/constants/identidade.mjs'
import type { StoreProduct } from '@/lib/wordpress/store'

const BLOCO_PRODUTO = `${BLOCK_ALT_PREFIX}/product`

/** Texto da legenda do bloco de produto (o `<p class="oc-product__caption">` salvo pelo editor). */
function legendaDoBloco(html: string) {
    return html.match(/<p[^>]*oc-product__caption[^>]*>([\s\S]*?)<\/p>/i)?.[1]?.trim() || undefined
}

/** `cardGrupo` (variante B do teste) entra na primeira quebra de anúncio, logo antes dela; em texto curto, sem quebra, vai ao fim do corpo. */
/** `sugestaoMeio` entra após ~40% dos blocos, em artigo com pelo menos 8; nunca antes do 3º bloco. */
export function GutenbergArticleRenderer({ model, cardGrupo, sugestaoMeio, lojaMeio, produtos, contextoProduto = 'artigo' }: { model: ArticleModel; cardGrupo?: ReactNode; sugestaoMeio?: ReactNode; lojaMeio?: ReactNode; produtos?: Map<number, StoreProduct>; contextoProduto?: string }) {
    const idMeio = sugestaoMeio && model.blocks.length >= 8
        ? model.blocks[Math.max(2, Math.floor(model.blocks.length * 0.4))]?.id
        : undefined
    // Faixa de loja em ~70% do texto (artigo com 10+ blocos): longe da sugestão de leitura (40%) e dos anúncios.
    const idLoja = lojaMeio && model.blocks.length >= 10
        ? model.blocks[Math.max(4, Math.floor(model.blocks.length * 0.7))]?.id
        : undefined
    const primeiraQuebra = cardGrupo
        ? (model.blocks.find(b => model.adBreakAfter.has(b.id)) ?? model.blocks[model.blocks.length - 1])?.id
        : undefined
    // Produtos em sequência saem juntos, numa prateleira; o primeiro bloco da sequência a desenha e os demais ficam vazios.
    const prateleiras = new Map<string, ProdutoDoTexto[]>()
    let atual: ProdutoDoTexto[] | null = null
    for (const b of model.blocks) {
        if (b.name !== BLOCO_PRODUTO) { atual = null; continue }
        // Produto oculto, removido ou sem link some do texto em vez de deixar um buraco.
        const produto = produtos?.get(Number(b.attrs.productId))
        if (!atual) { atual = []; prateleiras.set(b.id, atual) }
        if (produto) atual.push({ produto, legendaHtml: legendaDoBloco(b.html) })
    }
    return (
        <div className="prose dark:prose-invert max-w-none sm:[&_p]:text-justify" data-article-model-version={model.version}>
            {model.blocks.map((block) => (
                <div
                    key={block.id}
                    id={block.name === 'core/heading' && !/\sid=/.test(block.html) ? block.id : undefined}
                    data-article-block={block.name}
                >
                    {block.name === BLOCO_PRODUTO
                        ? (prateleiras.get(block.id)?.length ? <ProdutosNoArtigo itens={prateleiras.get(block.id)!} contexto={contextoProduto} /> : null)
                        : <div dangerouslySetInnerHTML={{ __html: block.html }} />}
                    {block.id === primeiraQuebra && cardGrupo}
                    {block.id === idMeio && sugestaoMeio}
                    {block.id === idLoja && <div className="not-prose my-8">{lojaMeio}</div>}
                    {model.adBreakAfter.has(block.id) && ADSENSE.slots.inline && (
                        <div className="not-prose my-8"><AdSlotInline slot={ADSENSE.slots.inline} layout="content" analyticsPlacement="article_body" /></div>
                    )}
                </div>
            ))}
        </div>
    )
}
