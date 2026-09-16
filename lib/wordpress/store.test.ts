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
        fetchMock.mockResolvedValue({ ok: true, json: async () => products })
        expect(await getStoreProducts()).toEqual(products)
    })

    it('retorna array vazio quando a API não responde um array (defesa contra resposta malformada do WP)', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ error: 'algo deu errado' }) })
        expect(await getStoreProducts()).toEqual([])
    })

    it('retorna array vazio quando a API responde erro HTTP', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500, statusText: 'Error' })
        expect(await getStoreProducts()).toEqual([])
    })
})
