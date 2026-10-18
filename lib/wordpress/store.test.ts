import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatCategory, getStoreProducts } from './store'

describe('formatCategory', () => {
    it('retorna o label conhecido pra uma categoria mapeada', () => {
        expect(formatCategory('kpop_album')).toBe('Álbuns K-Pop')
        expect(formatCategory('lightstick')).toBe('Lightsticks')
    })

    it('pra categoria desconhecida, troca underscore por espaço', () => {
        expect(formatCategory('categoria_nova_desconhecida')).toBe('categoria nova desconhecida')
    })

    it('categoria desconhecida sem underscore fica como está', () => {
        expect(formatCategory('novacategoria')).toBe('novacategoria')
    })
})

describe('getStoreProducts', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('retorna os produtos quando a API responde um array', async () => {
        const products = [{ id: 1, title: { rendered: 'Album' }, acf: {} }]
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => products,
            headers: new Headers({ 'X-WP-Total': '1', 'X-WP-TotalPages': '1' }),
        })
        expect(await getStoreProducts()).toEqual(products)
    })

    it('retorna array vazio quando a API não responde um array (defesa contra resposta malformada do WP)', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ error: 'algo deu errado' }),
            headers: new Headers({ 'X-WP-Total': '0', 'X-WP-TotalPages': '0' }),
        })
        expect(await getStoreProducts()).toEqual([])
    })

    it('retorna array vazio quando a API responde erro HTTP', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500, statusText: 'Error' })
        expect(await getStoreProducts()).toEqual([])
    })
})

describe('getFeaturedStoreProducts', () => {
    const prod = (id: number, categoria: string, extra: Partial<import('./store').StoreProduct['acf']> = {}) => ({
        id, title: { rendered: `p${id}` }, date_gmt: '2026-01-01T00:00:00',
        acf: { price: 'R$ 10,00', original_price: null, image_url: 'x', affiliate_url: 'https://x', store: 'shopee', category: categoria, badge: null, rating: null, sold_count: null, featured: false, is_hidden: false, position: id, related_group: null, related_artist: null, price_history: null, ...extra },
    })
    beforeEach(() => { vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'x-wp-totalpages': '1', 'x-wp-total': '6' }), json: async () => [
        prod(1, 'alimenta'), prod(2, 'alimenta'), prod(3, 'alimenta'),
        prod(4, 'photocard'), prod(5, 'lightstick'), prod(6, 'kpop_album'),
        prod(7, 'photocard', { price: null, featured: true }),
    ] })) })
    afterEach(() => { vi.unstubAllGlobals() })

    it('nunca devolve produto sem preço', async () => {
        const { getFeaturedStoreProducts } = await import('./store')
        const ids = (await getFeaturedStoreProducts(10)).map(p => p.id)
        expect(ids).not.toContain(7)
    })

    it('filtra pelo tipo da página', async () => {
        const { getFeaturedStoreProducts } = await import('./store')
        expect((await getFeaturedStoreProducts(10, 'kpop')).map(p => p.acf.category)).toEqual(['photocard', 'lightstick', 'kpop_album'])
        expect((await getFeaturedStoreProducts(10, 'drama')).map(p => p.acf.category)).toEqual(['alimenta', 'alimenta', 'alimenta'])
    })
})
