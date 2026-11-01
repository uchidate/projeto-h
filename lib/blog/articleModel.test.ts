import { describe, expect, it } from 'vitest'
import { buildArticleModel, type WPArticleBlock } from './articleModel'

const block = (name: string, html: string, attrs = {}): WPArticleBlock => ({ name, html, attrs, innerBlocks: [] })

describe('buildArticleModel', () => {
    it('normaliza IDs, headings e plano de monetização', () => {
        const source = [
            block('core/paragraph', `<p>${'abertura '.repeat(180)}</p>`),
            block('core/paragraph', `<p>${'contexto '.repeat(180)}</p>`),
            block('core/heading', '<h2>Datas confirmadas</h2>'),
            ...Array.from({ length: 8 }, (_, index) => block('core/paragraph', `<p>${`detalhe ${index} `.repeat(150)}</p>`)),
        ]
        const model = buildArticleModel(source)
        expect(model.headings).toEqual([{ id: 'datas-confirmadas', text: 'Datas confirmadas', level: 2 }])
        expect(model.adBreakAfter.size).toBeLessThanOrEqual(3)
        expect(model.blocks[0].id).toBe('block-1')
    })

    it('guia de produto abre a primeira quebra depois do 2º parágrafo e espaça as demais', () => {
        const paragrafos = Array.from({ length: 16 }, (_, index) => block('core/paragraph', `<p>${`detalhe ${index} `.repeat(120)}</p>`))
        const comum = buildArticleModel(paragrafos)
        const guia = buildArticleModel([...paragrafos, block('hallyuhub/product', '<div class="oc-product"></div>', { productId: 1 })])
        expect(comum.guiaDeProduto).toBe(false)
        expect(guia.guiaDeProduto).toBe(true)
        expect(guia.adBreakAfter.has(guia.blocks[1].id)).toBe(true)
        expect(guia.adBreakAfter.size).toBeLessThanOrEqual(3)
        expect(comum.adBreakAfter.has(comum.blocks[1].id)).toBe(false)
    })

    it('falha explicitamente para bloco fora do contrato', () => {
        expect(() => buildArticleModel([block('plugin/desconhecido', '<div />')])).toThrow(/não suportado/)
    })
})

describe('crédito da capa', () => {
    it('tira o parágrafo "Foto da capa" do corpo e o expõe à parte', () => {
        const model = buildArticleModel([
            block('core/paragraph', '<p>Abertura do guia.</p>'),
            block('core/paragraph', '<p>Foto da capa: mulher aplicando creme (CC0, Wikimedia Commons).</p>'),
        ])
        expect(model.blocks).toHaveLength(1)
        expect(model.creditoCapaHtml).toBe('Foto da capa: mulher aplicando creme (CC0, Wikimedia Commons).')
    })
    it('sem crédito, nada muda', () => {
        const model = buildArticleModel([block('core/paragraph', '<p>Só texto.</p>')])
        expect(model.creditoCapaHtml).toBeUndefined()
        expect(model.blocks).toHaveLength(1)
    })
})
