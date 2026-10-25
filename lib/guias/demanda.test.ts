import { describe, expect, it } from 'vitest'
import { porDemanda, resumoDoGuia } from './demanda'

describe('porDemanda', () => {
    it('põe o mais visitado primeiro e mantém a ordem de quem não tem leitura', () => {
        const r = porDemanda([{ slug: 'x1' }, { slug: 'doramas-acao-coreanos' }, { slug: 'x2' }, { slug: 'doramas-policiais-coreanos' }])
        expect(r.map(h => h.slug)).toEqual(['doramas-policiais-coreanos', 'doramas-acao-coreanos', 'x1', 'x2'])
    })
})

describe('resumoDoGuia', () => {
    it('descarta a descrição que só repete o título com a cauda padrão', () => {
        expect(resumoDoGuia('Doramas de terror', 'Os melhores doramas coreanos de terror e horror com sinopse, elenco, plataformas e avaliações em português.')).toBe('')
    })
    it('mantém a que traz informação nova', () => {
        expect(resumoDoGuia('Doramas tvN', 'Descubra os melhores doramas coreanos produzidos e exibidos pela tvN, o canal de cabo mais prestigioso da Coreia do Sul.')).toContain('canal de cabo')
    })
})
