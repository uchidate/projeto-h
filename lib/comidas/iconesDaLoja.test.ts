import { describe, it, expect } from 'vitest'
import { produtosIcones } from './iconesDaLoja'
import type { StoreProduct } from '@/lib/wordpress/store'

const p = (id: number, titulo: string, extra: Record<string, unknown> = {}) =>
    ({ id, title: { rendered: titulo }, acf: { affiliate_url: 'https://x', price: 'R$ 10', ...extra } }) as unknown as StoreProduct

describe('produtosIcones', () => {
    it('devolve um produto por ícone, na ordem curada', () => {
        const r = produtosIcones([p(1, 'Pepero Lotte 39g'), p(2, 'Alfajor Lotte Choco Pie 12 un'), p(3, 'Pepero chocolate branco')])
        expect(r.map(x => x.id)).toEqual([2, 1])
    })
    it('ignora produto oculto ou sem preço e ícone sem produto', () => {
        const r = produtosIcones([p(1, 'Sorvete Melona', { is_hidden: true }), p(2, 'Melona morango', { price: '' }), p(3, 'Lamen Buldak')])
        expect(r.map(x => x.id)).toEqual([3])
    })
    it('casa sem acento e respeita o limite', () => {
        const r = produtosIcones([p(1, 'Choco Pie'), p(2, 'Pepero'), p(3, 'Buldak')], 2)
        expect(r).toHaveLength(2)
    })
})
