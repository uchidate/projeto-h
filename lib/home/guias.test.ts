import { describe, expect, it } from 'vitest'
import { escolherCapas } from './guias'

describe('escolherCapas', () => {
    it('não repete capa entre guias enquanto houver outra', () => {
        const r = escolherCapas([
            { slug: 'a', capas: ['1', '2', '3', '4'] },
            { slug: 'b', capas: ['1', '2', '5', '6'] },
        ])
        expect(r.a).toEqual(['1', '2', '3'])
        expect(r.b).toEqual(['5', '6', '1'])
    })
    it('completa com repetidas quando faltam capas novas', () => {
        const r = escolherCapas([{ slug: 'a', capas: ['1', '2'] }, { slug: 'b', capas: ['1', '2'] }])
        expect(r.b).toEqual(['1', '2'])
    })
})
