import { describe, expect, it } from 'vitest'
import { garantirLoja } from './garantir-loja'
import type { StoreProduct } from './store'

const p = (id: number, store: string, descoberta = false) => ({ id, descoberta, acf: { store } }) as unknown as StoreProduct
const ids = (l: StoreProduct[]) => l.map(x => x.id)

describe('garantirLoja', () => {
    const ml = [p(1, 'mercadolivre'), p(2, 'mercadolivre'), p(3, 'mercadolivre')]
    it('troca o último visível pelo primeiro Shopee de fora', () => {
        const todos = [...ml, p(4, 'mercadolivre'), p(5, 'shopee')]
        expect(ids(garantirLoja(ml, todos, 'shopee'))).toEqual([1, 2, 5])
    })
    it('não mexe quando já há Shopee à vista ou não há Shopee nenhum', () => {
        const comShopee = [p(1, 'mercadolivre'), p(2, 'shopee')]
        expect(garantirLoja(comShopee, comShopee, 'shopee')).toBe(comShopee)
        expect(garantirLoja(ml, ml, 'shopee')).toBe(ml)
    })
    it('preserva o slot de descoberta', () => {
        const sel = [p(1, 'mercadolivre'), p(2, 'mercadolivre'), p(9, 'mercadolivre', true)]
        expect(ids(garantirLoja(sel, [...sel, p(5, 'shopee')], 'shopee'))).toEqual([1, 5, 9])
    })
})

describe('garantirLoja com posição', () => {
    it('sobe o Shopee já presente para a posição pedida', () => {
        const sel = [p(1, 'mercadolivre'), p(2, 'mercadolivre'), p(3, 'mercadolivre'), p(4, 'shopee')]
        expect(ids(garantirLoja(sel, sel, 'shopee', 1))).toEqual([1, 4, 2, 3])
    })
    it('sem Shopee na seleção, troca o cartão da posição por um de fora', () => {
        const sel = [p(1, 'mercadolivre'), p(2, 'mercadolivre'), p(3, 'mercadolivre')]
        expect(ids(garantirLoja(sel, [...sel, p(5, 'shopee')], 'shopee', 1))).toEqual([1, 5, 3])
    })
    it('Shopee já nos primeiros: não mexe', () => {
        const sel = [p(1, 'shopee'), p(2, 'mercadolivre'), p(3, 'mercadolivre')]
        expect(garantirLoja(sel, sel, 'shopee', 1)).toBe(sel)
    })
})
