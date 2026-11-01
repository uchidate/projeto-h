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

    it('guia de produto tem no máximo 2 quebras de anúncio e mais espaço entre elas', () => {
        const paragrafos = Array.from({ length: 16 }, (_, index) => block('core/paragraph', `<p>${`detalhe ${index} `.repeat(120)}</p>`))
        const comum = buildArticleModel(paragrafos)
        const guia = buildArticleModel([...paragrafos, block('hallyuhub/product', '<div class="oc-product"></div>', { productId: 1 })])
        expect(comum.adBreakAfter.size).toBe(3)
        expect(guia.adBreakAfter.size).toBeLessThanOrEqual(2)
        expect(guia.adBreakAfter.size).toBeLessThan(comum.adBreakAfter.size)
    })

    it('falha explicitamente para bloco fora do contrato', () => {
        expect(() => buildArticleModel([block('plugin/desconhecido', '<div />')])).toThrow(/não suportado/)
    })
})
