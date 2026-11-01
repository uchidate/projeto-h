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
}

function slug(value: string) {
    return stripHtml(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72)
}

export function buildArticleModel(source: WPArticleBlock[]): ArticleModel {
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
        // Até 3 quebras: `article_body` preenche ~51% e `article_post_suggestion`
        // ~80% em sessões do Brasil (Umami, 28 dias até 2026-09-17). Artigo longo
        // passava milhares de caracteres sem anúncio depois da segunda quebra.
        // O espaçamento mínimo de 1.200 caracteres continua valendo.
        if (adBreakAfter.size >= maxQuebras || index < 2 || !ARTICLE_BLOCKS.get(block.name)?.adBoundary) continue
        if (sinceLast < minTexto || total - consumed < 600 || blocks[index + 1]?.name === 'core/heading') continue
        adBreakAfter.add(block.id)
        sinceLast = 0
    }

    return { version: 1, blocks, headings, adBreakAfter, guiaDeProduto }
}
