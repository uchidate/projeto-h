import { stripHtml } from '@/lib/utils'
import { ARTICLE_BLOCKS, isArticleBlockSupported } from './articleBlockCatalog'

export type WPArticleBlock = {
    name: string
    attrs: Record<string, unknown>
    html: string
    innerBlocks: WPArticleBlock[]
}

export type ArticleBlockModel = WPArticleBlock & {
    id: string
    textLength: number
}

export type ArticleModel = {
    version: 1
    blocks: ArticleBlockModel[]
    headings: Array<{ id: string; text: string; level: 2 | 3 }>
    adBreakAfter: Set<string>
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
    let consumed = 0
    let sinceLast = 0
    for (let index = 0; index < blocks.length; index++) {
        const block = blocks[index]
        consumed += block.textLength
        sinceLast += block.textLength
        // Até 3 quebras: `article_body` preenche ~51% e `article_post_suggestion`
        // ~80% em sessões do Brasil (Umami, 28 dias até 2026-09-17). Artigo longo
        // passava milhares de caracteres sem anúncio depois da segunda quebra.
        // O espaçamento mínimo de 1.200 caracteres continua valendo.
        if (adBreakAfter.size >= 3 || index < 2 || !ARTICLE_BLOCKS.get(block.name)?.adBoundary) continue
        if (sinceLast < 1200 || total - consumed < 600 || blocks[index + 1]?.name === 'core/heading') continue
        adBreakAfter.add(block.id)
        sinceLast = 0
    }

    return { version: 1, blocks, headings, adBreakAfter }
}
