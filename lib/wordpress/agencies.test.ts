import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getAgencyById, getAgencyBySlug } from './agencies'

describe('getAgencyById', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('retorna null sem fetch quando id é 0/falsy', async () => {
        expect(await getAgencyById(0)).toBeNull()
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('retorna o objeto da agência quando a API responde ok', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 55, slug: 'sm-entertainment' }) })
        expect(await getAgencyById(55)).toEqual({ id: 55, slug: 'sm-entertainment' })
    })

    it('retorna null (não lança) quando o fetch rejeita', async () => {
        fetchMock.mockRejectedValue(new Error('network error'))
        expect(await getAgencyById(55)).toBeNull()
    })

    // Regressão: wpFetch (client.ts) devolve [] — não null — quando a API
    // erra ou dá timeout, porque seu sentinel de erro genérico é sempre
    // array. Pra um endpoint de item único (agency/{id}), isso significa
    // getAgencyById podia retornar [] (truthy em JS) em vez de null, e
    // `agency.title.rendered` em ArtistDetailPage.tsx quebrava a renderização
    // inteira da página em qualquer soluço do WP. Corrigido detectando array.
    it('retorna null (não um array truthy) quando a API responde erro HTTP', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500, statusText: 'Error' })
        const result = await getAgencyById(55)
        expect(result).toBeNull()
        expect(Array.isArray(result)).toBe(false)
    })
})

describe('getAgencyBySlug', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('retorna o primeiro item quando encontrado', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [{ id: 55, slug: 'sm-entertainment' }] })
        expect(await getAgencyBySlug('sm-entertainment')).toEqual({ id: 55, slug: 'sm-entertainment' })
    })

    it('retorna null quando o slug não existe', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
        expect(await getAgencyBySlug('slug-inexistente')).toBeNull()
    })
})
