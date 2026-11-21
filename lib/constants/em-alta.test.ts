import { describe, expect, it } from 'vitest'
import { estaEmAlta, maisNoticiadas } from './em-alta'

const g = (id: number, n?: number) => ({ id, acf: n === undefined ? {} : { noticias_14d: n } })

describe('em alta', () => {
    it('selo a partir de 5 matérias em 14 dias', () => {
        expect(estaEmAlta(4)).toBe(false)
        expect(estaEmAlta(5)).toBe(true)
        expect(estaEmAlta(undefined)).toBe(false)
    })

    it('faixa: mais noticiadas primeiro, só acima do mínimo, com limite', () => {
        const r = maisNoticiadas([g(1, 6), g(2), g(3, 40), g(4, 4), g(5, 12)], 2)
        expect(r.map(x => x.id)).toEqual([3, 5])
    })

    it('sem ninguém acima do mínimo, faixa vazia', () => {
        expect(maisNoticiadas([g(1, 2), g(2)], 6)).toEqual([])
    })
})
