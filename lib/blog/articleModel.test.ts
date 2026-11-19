import { describe, expect, it } from 'vitest'
import { buildArticleModel, indiceEmLimiteDeSecao, type WPArticleBlock } from './articleModel'

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

    it('celular: o anúncio do topo vai para depois do 2º parágrafo, e o 1º do corpo conta a distância dali', () => {
        const paragrafos = Array.from({ length: 16 }, (_, index) => block('core/paragraph', `<p>${`detalhe ${index} `.repeat(120)}</p>`))
        const comum = buildArticleModel(paragrafos)
        expect(comum.adAberturaCelular).toBe(comum.blocks[1].id)
        expect(comum.adBreakAfter.has(comum.blocks[1].id)).toBe(false)
        const tamanhos = comum.blocks.map(b => b.textLength)
        const ateAbertura = tamanhos.slice(0, 2).reduce((x, y) => x + y, 0)
        const primeiroCorpo = comum.blocks.findIndex(b => comum.adBreakAfter.has(b.id))
        const ateCorpo = tamanhos.slice(0, primeiroCorpo + 1).reduce((x, y) => x + y, 0)
        expect(ateCorpo - ateAbertura).toBeGreaterThanOrEqual(1200)
        const guia = buildArticleModel([...paragrafos, block('hallyuhub/product', '<div class="oc-product"></div>', { productId: 1 })])
        expect(guia.adAberturaCelular).toBeUndefined()
    })

    it('celular: não abre o anúncio entre um parágrafo e o intertítulo seguinte', () => {
        const model = buildArticleModel([
            block('core/paragraph', `<p>${'abertura '.repeat(60)}</p>`),
            block('core/paragraph', `<p>${'contexto '.repeat(60)}</p>`),
            block('core/heading', '<h2>Seção</h2>'),
            ...Array.from({ length: 8 }, (_, index) => block('core/paragraph', `<p>${`detalhe ${index} `.repeat(150)}</p>`)),
        ])
        expect(model.adAberturaCelular).toBe(model.blocks[3].id)
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

describe('indiceEmLimiteDeSecao', () => {
    const b = (name: string) => ({ name })
    it('avança até o bloco que antecede um título', () => {
        const blocos = [b('core/paragraph'), b('core/paragraph'), b('core/image'), b('hallyuhub/highlight'), b('core/paragraph'), b('core/heading')]
        expect(indiceEmLimiteDeSecao(blocos, 1)).toBe(4)
    })
    it('usa o fim do texto como limite', () => {
        expect(indiceEmLimiteDeSecao([b('core/paragraph'), b('core/paragraph')], 0)).toBe(1)
    })
    it('mantém o ponto desejado quando não há limite na janela', () => {
        const blocos = Array.from({ length: 12 }, () => b('core/paragraph'))
        expect(indiceEmLimiteDeSecao(blocos, 2)).toBe(2)
    })
})

describe('quebra de anúncio com ilustração', () => {
    it('não separa o parágrafo da foto que o acompanha', () => {
        const longo = (t: string) => block('core/paragraph', `<p>${t.repeat(260)}</p>`)
        const source = [longo('abertura '), longo('contexto '), longo('detalhe '), block('core/image', '<figure><img src="x" alt="a"/></figure>'), longo('mais '), longo('fim ')]
        const model = buildArticleModel(source)
        const idFoto = model.blocks[3].id
        const idAntes = model.blocks[2].id
        expect(model.adBreakAfter.has(idAntes)).toBe(false)
        expect(model.adBreakAfter.has(idFoto)).toBe(false)
    })
})

describe('indiceEmLimiteDeSecao com seção a evitar', () => {
    const h = (t: string) => ({ name: 'core/heading', html: `<h2>${t}</h2>` })
    const p = () => ({ name: 'core/paragraph', html: '<p>x</p>' })
    it('não deixa a loja logo antes de Referências', () => {
        const blocos = [p(), p(), h('Uma seção'), p(), p(), h('Outra'), p(), p(), h('Referências')]
        // desejado 6 → o limite à frente é antes de Referências (índice 7); recua para antes de "Outra" (índice 4)
        expect(indiceEmLimiteDeSecao(blocos, 6, 6, /^Referências$/i)).toBe(4)
    })
})
