import { describe, expect, it } from 'vitest'
import { ordenarCategorias } from './store-ranking'
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
