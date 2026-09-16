import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getRelatedArtists, getStreamingArtists, getTrendingArtists } from './artists'

function artist(id: number, slug: string, acf: Record<string, unknown> = {}) {
    return { id, slug, title: { rendered: slug }, acf }
}

describe('getRelatedArtists', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('com agencyId e >=3 resultados da mesma agência, usa só esses (não cai pro fallback de role)', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('oc_agency=')) return { ok: true, json: async () => [artist(1, 'a'), artist(2, 'b'), artist(3, 'c')] }
            return { ok: true, json: async () => [artist(99, 'nao-deveria-aparecer')] }
        })
        const result = await getRelatedArtists(0, 42)
        expect(result.map(a => a.id)).toEqual([1, 2, 3])
    })

    it('com agencyId mas menos de 3 resultados, cai pro fallback de role', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('oc_agency=')) return { ok: true, json: async () => [artist(1, 'a'), artist(2, 'b')] }
            return { ok: true, json: async () => [artist(10, 'fallback')] }
        })
        const result = await getRelatedArtists(0, 42)
        expect(result.map(a => a.id)).toEqual([10])
    })

    it('sem agencyId, vai direto pro fallback de role/pool geral', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [artist(1, 'a')] })
        const result = await getRelatedArtists(0)
        expect(fetchMock.mock.calls.some(([url]) => url.includes('oc_agency='))).toBe(false)
        expect(result.map(a => a.id)).toEqual([1])
    })

    it('retorna array vazio (não lança) em caso de erro de rede', async () => {
        fetchMock.mockRejectedValue(new Error('network error'))
        expect(await getRelatedArtists(0, 42)).toEqual([])
    })

    it('rotaciona o pool do fallback de forma determinística (mesmo excludeId → mesma ordem)', async () => {
        const pool = Array.from({ length: 5 }, (_, i) => artist(i, `a${i}`))
        fetchMock.mockResolvedValue({ ok: true, json: async () => pool })
        const r1 = await getRelatedArtists(7, undefined, undefined, 5)
        const r2 = await getRelatedArtists(7, undefined, undefined, 5)
        expect(r1.map(a => a.id)).toEqual(r2.map(a => a.id))
    })
})

describe('getStreamingArtists', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('filtra artistas sem streaming_score (ou score 0)', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => [artist(1, 'sem-score'), artist(2, 'com-score', { streaming_score: 10 })],
        })
        const result = await getStreamingArtists()
        expect(result.map(a => a.id)).toEqual([2])
    })

    it('ordena por streaming_score desc', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => [
                artist(1, 'baixo', { streaming_score: 5 }),
                artist(2, 'alto', { streaming_score: 20 }),
            ],
        })
        const result = await getStreamingArtists()
        expect(result.map(a => a.id)).toEqual([2, 1])
    })

    it('desempata por trending_score quando streaming_score é igual', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => [
                artist(1, 'menos-trending', { streaming_score: 10, trending_score: 5 }),
                artist(2, 'mais-trending', { streaming_score: 10, trending_score: 20 }),
            ],
        })
        const result = await getStreamingArtists()
        expect(result.map(a => a.id)).toEqual([2, 1])
    })

    it('respeita o limit', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => Array.from({ length: 20 }, (_, i) => artist(i, `a${i}`, { streaming_score: i + 1 })),
        })
        const result = await getStreamingArtists(5)
        expect(result).toHaveLength(5)
    })
})

describe('getTrendingArtists', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('ordena por trending_score desc (sem filtrar score 0, diferente de getStreamingArtists)', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => [
                artist(1, 'zero', { trending_score: 0 }),
                artist(2, 'alto', { trending_score: 50 }),
            ],
        })
        const result = await getTrendingArtists()
        expect(result.map(a => a.id)).toEqual([2, 1])
        expect(result).toHaveLength(2) // não filtra o de score 0
    })

    it('respeita o limit default de 10', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => Array.from({ length: 20 }, (_, i) => artist(i, `a${i}`, { trending_score: i })),
        })
        const result = await getTrendingArtists()
        expect(result).toHaveLength(10)
    })
})
