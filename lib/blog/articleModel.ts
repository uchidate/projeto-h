import { stripHtml } from '@/lib/utils'
import { ARTICLE_BLOCKS, isArticleBlockSupported } from './articleBlockCatalog'

export type WPArticleBlock = {
    name: string
    attrs: Record<string, unknown>
    html: string
    innerBlocks: WPArticleBlock[]
}

type ArticleBlockModel = WPArticleBlock & {
    id: string
    textLength: number
}

export type ArticleModel = {
    version: 1
    blocks: ArticleBlockModel[]
    headings: Array<{ id: string; text: string; level: 2 | 3 }>
    adBreakAfter: Set<string>
    /** Guia de compra (tem bloco de produto): a página tira os anúncios de antes do texto e do fim. */
    guiaDeProduto: boolean
    /**
     * Celular: bloco depois do qual entra o anúncio do topo (o leaderboard), em vez de entre a capa e o
     * texto. Mesma regra do guia de produto (depois do 2º parágrafo). Só artigos que não são guia.
     */
    adAberturaCelular?: string
    /** HTML interno do parágrafo "Foto da capa: …", tirado do corpo para a página mostrá-lo como legenda sob a capa. */
    creditoCapaHtml?: string
}

function slug(value: string) {
    return stripHtml(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72)
}

const CREDITO_CAPA = /^\s*Foto da capa:/i

/** Blocos que ilustram o parágrafo anterior: nada (anúncio, vitrine) entra entre eles e o texto que os introduz. */
const ILUSTRA_O_ANTERIOR = new Set(['core/image', 'core/quote', 'core/table', 'core/embed', 'hallyuhub/highlight'])

/**
 * Ponto de inserção de módulos (loja, sugestão) em um limite de seção: o primeiro bloco, a partir de `desejado`
 * (até 6 à frente), cujo próximo bloco é um título ou o fim. Sem limite à vista, mantém `desejado`, para não
 * perder o módulo. Evita que a faixa de loja caia entre um parágrafo e a foto ou o destaque dele.
 */
export function indiceEmLimiteDeSecao(
    blocks: Array<{ name: string; html?: string }>,
    desejado: number,
    janela = 6,
    /** Título de seção que não deve vir logo depois do módulo (ex.: Referências, que já antecede a loja do fim). */
    evitarAntesDe?: RegExp,
): number {
    const texto = (b?: { html?: string }) => (b?.html ?? '').replace(/<[^>]+>/g, '').trim()
    const serve = (i: number) => {
        const proximo = blocks[i + 1]
        if (!proximo) return !evitarAntesDe
        if (proximo.name !== 'core/heading') return false
        return !evitarAntesDe?.test(texto(proximo))
    }
    const fim = Math.min(blocks.length - 1, desejado + janela)
    for (let i = desejado; i <= fim; i++) if (serve(i)) return i
    // Nada à frente serve: recua até o limite de seção anterior, sem passar do 3º bloco.
    if (evitarAntesDe) for (let i = desejado - 1; i >= 2; i--) if (serve(i)) return i
    return desejado
}

export function buildArticleModel(todos: WPArticleBlock[]): ArticleModel {
    const indiceCredito = todos.findIndex(b => b.name === 'core/paragraph' && CREDITO_CAPA.test(stripHtml(b.html)))
    const creditoCapaHtml = indiceCredito >= 0 ? todos[indiceCredito].html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]?.trim() : undefined
    const source = creditoCapaHtml ? todos.filter((_, i) => i !== indiceCredito) : todos
    const used = new Map<string, number>()
    const headings: ArticleModel['headings'] = []
    const blocks = source.map((block, index) => {
        if (!isArticleBlockSupported(block.name)) throw new Error(`Bloco editorial não suportado: ${block.name}`)
        const text = stripHtml(block.html)
        const requestedId = typeof block.attrs.anchor === 'string' ? block.attrs.anchor : ''
        const baseId = requestedId || (block.name === 'core/heading' ? slug(text) : `block-${index + 1}`)
        const seen = used.get(baseId) ?? 0
        used.set(baseId, seen + 1)
        const id = seen ? `${baseId}-${seen + 1}` : baseId
        const level = block.name === 'core/heading' ? Number(block.attrs.level ?? 2) : 0
        if (level === 2 || level === 3) headings.push({ id, text, level })
        return { ...block, id, textLength: text.length }
    })

    const total = blocks.reduce((sum, block) => sum + block.textLength, 0)
    const adBreakAfter = new Set<string>()
    // Guia de produto: os cartões de produto já ocupam a tela entre os trechos de texto, então a mesma
    // distância em caracteres vira pouca distância na rolagem. Menos quebras e mais espaço entre elas
    // (pedido do dono em 2026-11-01: anúncio demais atrapalha a leitura do guia).
    const guiaDeProduto = blocks.some(block => block.name.endsWith('/product'))
    const maxQuebras = 3
    const minTexto = guiaDeProduto ? 2000 : 1200
    let consumed = 0
    let sinceLast = 0
    let paragrafos = 0
    let adAberturaCelular: string | undefined
    for (let index = 0; index < blocks.length; index++) {
        const block = blocks[index]
        consumed += block.textLength
        sinceLast += block.textLength
        if (block.name === 'core/paragraph') paragrafos++
        // Guia de produto: o anúncio do topo (antes da primeira frase) saiu; o primeiro entra depois dos dois
        // primeiros parágrafos, quando a leitora já começou a ler (celular: o bloco reservado tinha ~410px
        // entre a capa e o texto). Pedido do dono em 2026-11-01.
        if (guiaDeProduto && adBreakAfter.size === 0 && paragrafos === 2 && block.name === 'core/paragraph' && blocks[index + 1]?.name !== 'core/heading') {
            adBreakAfter.add(block.id)
            sinceLast = 0
            continue
        }
        // Celular, artigo comum: o leaderboard do topo ficava entre a capa e a 1ª frase (419px em 839px de
        // tela, 2026-11-18) — quem rolava depois da capa caía num anúncio antes de ler. Ele passa para depois
        // do 2º parágrafo, como no guia de produto. A distância até o próximo anúncio do corpo conta daqui.
        if (!guiaDeProduto && !adAberturaCelular && paragrafos >= 2 && block.name === 'core/paragraph'
            && blocks[index + 1]?.name !== 'core/heading' && !ILUSTRA_O_ANTERIOR.has(blocks[index + 1]?.name ?? '')
            && total - consumed >= 600) {
            adAberturaCelular = block.id
            sinceLast = 0
            continue
        }
        // Até 3 quebras: `article_body` preenche ~51% e `article_post_suggestion`
        // ~80% em sessões do Brasil (Umami, 28 dias até 2026-09-17). Artigo longo
        // passava milhares de caracteres sem anúncio depois da segunda quebra.
        // O espaçamento mínimo de 1.200 caracteres continua valendo.
        if (adBreakAfter.size >= maxQuebras || index < 2 || !ARTICLE_BLOCKS.get(block.name)?.adBoundary) continue
        if (sinceLast < minTexto || total - consumed < 600 || blocks[index + 1]?.name === 'core/heading') continue
        // Foto, tabela, citação ou destaque que o parágrafo introduz ficam junto dele.
        if (ILUSTRA_O_ANTERIOR.has(blocks[index + 1]?.name ?? '')) continue
        adBreakAfter.add(block.id)
        sinceLast = 0
    }

    return { version: 1, blocks, headings, adBreakAfter, guiaDeProduto, creditoCapaHtml, adAberturaCelular }
}
