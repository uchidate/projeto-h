import { describe, expect, it } from 'vitest'
import type { StoreProduct } from '@/lib/wordpress/store'
import { semProdutoRepetido } from './produtos-unicos'

const p = (id: number) => ({ id }) as unknown as StoreProduct
const ids = (listas: StoreProduct[][]) => listas.map(l => l.map(x => x.id))

describe('semProdutoRepetido', () => {
    it('quem vem antes fica com o produto e a lista seguinte usa os candidatos de sobra', () => {
        const r = semProdutoRepetido([
            { produtos: [p(1), p(2)], limite: 5 },
            { produtos: [p(1), p(3), p(4), p(5)], limite: 2 },
            { produtos: [p(1), p(3), p(4), p(5), p(6)], limite: 5 },
        ])
        expect(ids(r)).toEqual([[1, 2], [3, 4], [5, 6]])
    })
    it('sem candidato livre a lista fica vazia, sem repetir', () => {
        expect(ids(semProdutoRepetido([{ produtos: [p(1)], limite: 1 }, { produtos: [p(1)], limite: 2 }]))).toEqual([[1], []])
    })
})
