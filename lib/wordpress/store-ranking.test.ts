import { describe, expect, it } from 'vitest'
import { ordenarCategorias, ordenarPrateleira } from './store-ranking'
import type { StoreProduct } from './store'

const produto = (id: number): StoreProduct => ({
    id, title: { rendered: `P${id}` }, date_gmt: '2026-10-01T00:00:00',
    acf: {
        price: 'R$ 10,00', original_price: null, image_url: 'https://x/y.jpg', affiliate_url: 'https://x/a', store: 'mercadolivre',
        category: null, badge: null, rating: null, sold_count: null, featured: false, is_hidden: false, position: 50,
        related_group: null, related_artist: null, price_history: null,
    },
})

describe('ordenarCategorias', () => {
    // IDs inexistentes no ranking: todos no neutro, então decide a quantidade e depois o nome.
    it('sem dado de cliques, mais produtos primeiro e depois ordem alfabética', () => {
        const ordem = ordenarCategorias({
            photocard: [produto(900001), produto(900002), produto(900003)],
            kbeauty: [produto(900004)],
            acessorios: [produto(900005)],
        })
        expect(ordem).toEqual(['photocard', 'acessorios', 'kbeauty'])
    })
})

describe('ordenarPrateleira', () => {
    const com = (id: number, extra: Partial<StoreProduct['acf']> = {}) => ({ ...produto(id), acf: { ...produto(id).acf, ...extra } })

    it('aderência ao conteúdo vem antes de destaque, desconto e comissão', () => {
        const aderente = com(900011)
        const destaqueCaro = com(900012, { featured: true, commission_rate: '30', original_price: 'R$ 20,00' })
        const ordem = ordenarPrateleira([destaqueCaro, aderente], 'x', new Map([[900011, 6], [900012, 0]]))
        expect(ordem.map(p => p.id)).toEqual([900011, 900012])
    })

    it('entre igualmente aderentes e sem dado de cliques, maior comissão sobe', () => {
        const baixa = com(900021, { commission_rate: '3', position: 1 })
        const alta = com(900022, { commission_rate: '14', position: 9 })
        const semDado = com(900023, { position: 2 })
        expect(ordenarPrateleira([semDado, baixa, alta], 'x').map(p => p.id)).toEqual([900022, 900021, 900023])
    })
})
