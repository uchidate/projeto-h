import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getProductions, getProductionBySlug, getProductionsByIds } from './productions'

function production(id: number, slug: string) {
    return { id, slug, title: { rendered: slug } }
}

function term(id: number, slug: string) {
    return { id, slug, name: slug }
}

describe('getProductions', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('resolve o slug do gênero pro ID correto antes de filtrar produções', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('/production_genre')) {
                return { ok: true, json: async () => [term(5, 'romance')] }
            }
            return {
                ok: true, json: async () => [production(1, 'x')],
                headers: new Map([['X-WP-Total', '1'], ['X-WP-TotalPages', '1']]),
            }
        })
        await getProductions({ genre: 'romance' })
        const productionsCall = fetchMock.mock.calls.find(([url]) => url.includes('/wp/v2/production?'))
        expect(productionsCall?.[0]).toContain('production_genre=5')
    })

    it('não quebra quando a resolução do gênero falha (segue sem o filtro)', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('/production_genre')) throw new Error('falhou')
            return {
                ok: true, json: async () => [],
                headers: new Map([['X-WP-Total', '0'], ['X-WP-TotalPages', '0']]),
            }
        })
        const result = await getProductions({ genre: 'romance' })
        expect(result.items).toEqual([])
    })

    it('usa orderby=date + oc_orderby=trending_score quando orderby é "trending_score" (custom order)', async () => {
        fetchMock.mockResolvedValue({
            ok: true, json: async () => [],
            headers: new Map([['X-WP-Total', '0'], ['X-WP-TotalPages', '0']]),
        })
        await getProductions({ orderby: 'trending_score' })
        const url = fetchMock.mock.calls[0][0] as string
        expect(url).toContain('orderby=date')
        expect(url).toContain('oc_orderby=trending_score')
    })
})

describe('getProductionBySlug', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('retorna a produção quando encontrada', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [production(1, 'the-heirs')] })
        expect(await getProductionBySlug('the-heirs')).toEqual(production(1, 'the-heirs'))
    })

    it('retorna null quando não encontrada', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
        expect(await getProductionBySlug('inexistente')).toBeNull()
    })
})

describe('getProductionsByIds', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('retorna array vazio sem fetch quando ids é vazio', async () => {
        expect(await getProductionsByIds([])).toEqual([])
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('retorna array vazio quando a API falha (erro tratado)', async () => {
        fetchMock.mockRejectedValue(new Error('network error'))
        expect(await getProductionsByIds([1, 2])).toEqual([])
    })
})
