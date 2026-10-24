import { describe, expect, it } from 'vitest'
import type { StoreProduct } from '@/lib/wordpress/store'
import { maisVendidos, vendidos } from './mais-vendidos'

const p = (id: number, sold: string | null, extra: Partial<StoreProduct['acf']> = {}) => ({
    id, title: { rendered: String(id) }, date_gmt: '',
    acf: { price: 'R$ 10,00', image_url: 'x', affiliate_url: 'y', sold_count: sold, is_hidden: false, ...extra },
}) as unknown as StoreProduct

describe('maisVendidos', () => {
    it('ordena por vendas e descarta o que não dá para comprar', () => {
        const r = maisVendidos([p(1, '10'), p(2, '9.674'), p(3, '500', { is_hidden: true }), p(4, '800', { affiliate_url: null }), p(5, null)])
        expect(r.map(x => x.id)).toEqual([2, 1])
    })
    it('lê número com separador e ignora lixo', () => {
        expect(vendidos(p(1, '9.674'))).toBe(9674)
        expect(vendidos(p(1, 'abc'))).toBe(0)
    })
    it('sem nenhuma venda informada devolve vazio', () => {
        expect(maisVendidos([p(1, null), p(2, '0')])).toEqual([])
    })
})
