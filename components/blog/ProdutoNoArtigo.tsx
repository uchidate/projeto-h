import { StoreCard } from '@/components/ui/StoreCard'
import type { StoreProduct } from '@/lib/wordpress/store'
import { stripHtml } from '@/lib/utils'

export interface ProdutoDoTexto {
    produto: StoreProduct
    legendaHtml?: string
}

const normaliza = (t: string) => stripHtml(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** Legenda que só repete o nome do produto (a do editor costuma ser o próprio título) não acrescenta nada ao cartão. */
export function legendaRepeteTitulo(legendaHtml: string | undefined, titulo: string) {
    if (!legendaHtml) return false
    const l = normaliza(legendaHtml)
    const t = normaliza(titulo)
    if (!l || !t) return false
    const colado = (x: string) => x.replace(/ /g, '')
    if (colado(l) === colado(t) || colado(t).includes(colado(l)) || colado(l).includes(colado(t))) return true
    const palavras = l.split(' ')
    const comuns = palavras.filter(p => t.split(' ').includes(p)).length
    return comuns / palavras.length >= 0.8
}

function Legenda({ html }: { html?: string }) {
    if (!html) return null
    // `<p>` e não `<figcaption>`: o estilo global de legenda de imagem (borda lateral, mono, itálico) não cabe num cartão de loja.
    // `!` porque o estilo global de parágrafo do artigo (tamanho de leitura, justificado) vence a classe sem ele.
    return <p className="mt-2 !text-left !text-xs !leading-snug !hyphens-none text-foreground-subtle" dangerouslySetInnerHTML={{ __html: html }} />
}

/**
 * Produto mostrado no ponto do texto em que ele é o assunto (bloco `product` do editor).
 * Usa o mesmo cartão da loja, então foto, preço e selos são os de agora e o clique entra na medição.
 */
export function ProdutoNoArtigo({ produto, legendaHtml, contexto }: ProdutoDoTexto & { contexto: string }) {
    return (
        <div className="not-prose mx-auto my-8 w-full max-w-[34rem]" data-produto-no-artigo={produto.id}>
            <StoreCard product={produto} contexto={contexto} linha />
            <Legenda html={legendaRepeteTitulo(legendaHtml, produto.title.rendered) ? undefined : legendaHtml} />
        </div>
    )
}

// `div` e não `figure`: o estilo global `.wp-article-content figure` (largura 100%, margem, centralização) e
// `figure img` (largura automática, borda, sombra, `contain`) vazavam para o cartão. No celular cada cartão
// ocupava a tela inteira, com a foto encolhida e um vão branco embaixo (544 px por produto).
/**
 * Blocos de produto em sequência viram uma prateleira: lado a lado no desktop (2 ou 3 colunas, conforme a
 * quantidade) e em 2 colunas no celular, em vez de uma coluna longa de cartões de 280 px.
 */
export function ProdutosNoArtigo({ itens, contexto }: { itens: ProdutoDoTexto[]; contexto: string }) {
    if (itens.length === 1) return <ProdutoNoArtigo {...itens[0]} contexto={contexto} />
    // Dois cartões cabem inteiros lado a lado; de três em diante, um pedaço do próximo mostra que a faixa rola.
    const largura = itens.length === 2 ? 'w-[calc(50%-0.375rem)]' : 'w-[44%]'
    const colunas = itens.length === 2 || itens.length === 4 ? 'md:grid-cols-2 md:max-w-[34rem]' : 'md:grid-cols-3'
    // Celular: faixa que rola de lado (dois cartões e um pedaço do terceiro à vista indicam que há mais), em vez de grade que deixa um cartão sozinho na última linha.
    return (
        <div
            className={`not-prose -mx-4 my-8 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-auto sm:scroll-px-0 sm:px-0 md:grid md:items-stretch md:gap-4 md:overflow-visible md:pb-0 md:mx-auto ${colunas}`}
            data-produtos-no-artigo={itens.length}
        >
            {itens.map(({ produto, legendaHtml }) => (
                <div key={produto.id} className={`flex ${largura} shrink-0 snap-start flex-col sm:w-[45%] md:w-auto md:min-w-0 [&>div]:flex-1`} data-produto-no-artigo={produto.id}>
                    <StoreCard product={produto} contexto={contexto} />
                    <Legenda html={legendaHtml} />
                </div>
            ))}
        </div>
    )
}
