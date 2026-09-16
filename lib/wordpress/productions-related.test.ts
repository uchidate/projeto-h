import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getSmartRelatedProductions } from './productions'

function production(id: number, slug: string) {
    return { id, slug, title: { rendered: slug } }
}

describe('getSmartRelatedProductions', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('prioriza resultados por elenco em comum, depois gênero, depois trending como fallback', async () => {
        // atenção: _fields sempre lista "production_genre" como campo pedido,
        // então checar "production_genre" sem "=" bate em toda chamada — usar
        // "production_genre=" (query param) e "orderby=trending_score"
        // (não "trending_score" sozinho, que também aparece só no orderby)
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('artist_slug=')) return { ok: true, json: async () => [production(1, 'cast-match')] }
            if (url.includes('production_genre=')) return { ok: true, json: async () => [production(2, 'genre-match')] }
            if (url.includes('orderby=trending_score')) {
                return { ok: true, json: async () => [production(3, 'trending')], headers: new Map([['X-WP-Total', '1'], ['X-WP-TotalPages', '1']]) }
            }
            return { ok: true, json: async () => [] }
        })

        const result = await getSmartRelatedProductions({ excludeId: 999, genreId: 5, castSlugs: ['jimin'] })
        expect(result.map(p => p.id)).toEqual([1, 2, 3])
    })

    it('exclui o próprio item (excludeId) mesmo se aparecer em algum dos resultados', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('artist_slug=')) return { ok: true, json: async () => [production(42, 'self'), production(1, 'other')] }
            return { ok: true, json: async () => [] }
        })
        const result = await getSmartRelatedProductions({ excludeId: 42, castSlugs: ['jimin'] })
        expect(result.map(p => p.id)).not.toContain(42)
    })

    it('deduplica itens que aparecem em mais de uma fonte, mantendo a ocorrência de maior prioridade', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('artist_slug=')) return { ok: true, json: async () => [production(7, 'via-cast')] }
            if (url.includes('production_genre=')) return { ok: true, json: async () => [production(7, 'via-genre-duplicado')] }
            return { ok: true, json: async () => [] }
        })
        const result = await getSmartRelatedProductions({ excludeId: 1, genreId: 5, castSlugs: ['jimin'] })
        expect(result).toHaveLength(1)
        expect(result[0].slug).toBe('via-cast') // prioridade: cast > genre
    })

    it('respeita o perPage no resultado final', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('orderby=trending_score')) {
                return {
                    ok: true,
                    json: async () => Array.from({ length: 12 }, (_, i) => production(i, `p${i}`)),
                    headers: new Map([['X-WP-Total', '12'], ['X-WP-TotalPages', '1']]),
                }
            }
            return { ok: true, json: async () => [] }
        })
        const result = await getSmartRelatedProductions({ excludeId: 999, perPage: 3 })
        expect(result).toHaveLength(3)
    })

    it('sem genreId, não busca por gênero (evita query desnecessária)', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [], headers: new Map([['X-WP-Total', '0'], ['X-WP-TotalPages', '0']]) })
        await getSmartRelatedProductions({ excludeId: 1 })
        expect(fetchMock.mock.calls.some(([url]) => url.includes('production_genre='))).toBe(false)
    })

    it('só usa o primeiro castSlug (limita a 1 busca por elenco)', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
        await getSmartRelatedProductions({ excludeId: 1, castSlugs: ['ator-1', 'ator-2', 'ator-3'] })
        const castCalls = fetchMock.mock.calls.filter(([url]) => url.includes('artist_slug='))
        expect(castCalls).toHaveLength(1)
        expect(castCalls[0][0]).toContain('ator-1')
    })

    it('sem nenhuma fonte retornando resultados, retorna array vazio (não lança)', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [], headers: new Map([['X-WP-Total', '0'], ['X-WP-TotalPages', '0']]) })
        expect(await getSmartRelatedProductions({ excludeId: 1 })).toEqual([])
    })
})
