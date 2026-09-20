import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Confere o host de verdade. `url.includes('api.themoviedb.org')` casaria
 * também com `https://atacante.com/?x=api.themoviedb.org`
 * (js/incomplete-url-substring-sanitization).
 */
const ehTmdb = (url: string) => new URL(url).hostname === 'api.themoviedb.org'

function tmdbShow(overrides: Partial<{
    id: number; name: string; poster_path: string | null
    first_air_date: string; vote_average: number; original_language: string
}> = {}) {
    return {
        id: 1, name: 'Show', poster_path: '/poster.jpg',
        first_air_date: '2024-05-01', vote_average: 8.5, original_language: 'ko',
        ...overrides,
    }
}

describe('getStreamingTopShows', () => {
    const originalEnv = { ...process.env }
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        vi.resetModules()
        process.env = { ...originalEnv, TMDB_API_KEY: 'test-key', WORDPRESS_API_URL: 'https://wp.test/wp-json' }
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        process.env = originalEnv
        vi.unstubAllGlobals()
    })

    it('retorna objeto vazio sem fazer fetch quando TMDB_API_KEY não está configurada', async () => {
        process.env.TMDB_API_KEY = ''
        const { getStreamingTopShows } = await import('./streaming')
        const result = await getStreamingTopShows()
        expect(result).toEqual({})
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('filtra pra manter só shows em coreano, mesmo pedindo with_original_language=ko à API', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (ehTmdb(url)) {
                return {
                    ok: true,
                    json: async () => ({
                        results: [
                            tmdbShow({ id: 1, name: 'Show Coreano', original_language: 'ko' }),
                            tmdbShow({ id: 2, name: 'Show Japonês (vazou no filtro da API)', original_language: 'ja' }),
                        ],
                    }),
                }
            }
            return { ok: true, json: async () => [] } // WP slug lookup
        })

        const { getStreamingTopShows } = await import('./streaming')
        const result = await getStreamingTopShows()
        const netflixShows = result.netflix_br ?? []
        expect(netflixShows.every(s => s.isKorean)).toBe(true)
        expect(netflixShows.map(s => s.title)).toEqual(['Show Coreano'])
    })

    it('limita a 10 resultados por plataforma mesmo se a API retornar mais', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (ehTmdb(url)) {
                return {
                    ok: true,
                    json: async () => ({ results: Array.from({ length: 20 }, (_, i) => tmdbShow({ id: i, name: `Show ${i}` })) }),
                }
            }
            return { ok: true, json: async () => [] }
        })
        const { getStreamingTopShows } = await import('./streaming')
        const result = await getStreamingTopShows()
        expect(result.netflix_br).toHaveLength(10)
    })

    it('numera o rank sequencialmente a partir de 1', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (ehTmdb(url)) {
                return { ok: true, json: async () => ({ results: [tmdbShow({ id: 1 }), tmdbShow({ id: 2 })] }) }
            }
            return { ok: true, json: async () => [] }
        })
        const { getStreamingTopShows } = await import('./streaming')
        const result = await getStreamingTopShows()
        expect(result.netflix_br?.map(s => s.rank)).toEqual([1, 2])
    })

    it('não quebra a busca inteira se uma plataforma falhar (Promise.allSettled)', async () => {
        let call = 0
        fetchMock.mockImplementation(async (url: string) => {
            if (ehTmdb(url)) {
                call++
                if (call === 1) throw new Error('TMDB fora do ar pra essa plataforma')
                return { ok: true, json: async () => ({ results: [tmdbShow({ id: 1 })] }) }
            }
            return { ok: true, json: async () => [] }
        })
        const { getStreamingTopShows } = await import('./streaming')
        const result = await getStreamingTopShows()
        // netflix_br é a primeira da PLATFORM_ORDER e falha; as outras seguem normalmente
        expect(result.netflix_br).toBeUndefined()
        expect(result.disney_br).toBeDefined()
    })

    it('omite a chave de plataformas sem nenhum show (evita objeto vazio poluindo o resultado)', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (ehTmdb(url)) return { ok: true, json: async () => ({ results: [] }) }
            return { ok: true, json: async () => [] }
        })
        const { getStreamingTopShows } = await import('./streaming')
        const result = await getStreamingTopShows()
        expect(result).toEqual({})
    })

    it('enriquece os shows com o slug da produção no WP quando o tmdb_id bate', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (ehTmdb(url)) {
                return { ok: true, json: async () => ({ results: [tmdbShow({ id: 42, name: 'Stars Falling From the Sky' })] }) }
            }
            if (url.includes('wp/v2/production')) {
                return { ok: true, json: async () => [{ slug: 'stars-falling-from-the-sky', acf: { tmdb_id: 42 } }] }
            }
            return { ok: true, json: async () => [] }
        })
        const { getStreamingTopShows } = await import('./streaming')
        const result = await getStreamingTopShows()
        expect(result.netflix_br?.[0].productionSlug).toBe('stars-falling-from-the-sky')
    })

    it('productionSlug fica null quando não há produção correspondente no WP', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (ehTmdb(url)) return { ok: true, json: async () => ({ results: [tmdbShow({ id: 999 })] }) }
            if (url.includes('wp/v2/production')) return { ok: true, json: async () => [] }
            return { ok: true, json: async () => [] }
        })
        const { getStreamingTopShows } = await import('./streaming')
        const result = await getStreamingTopShows()
        expect(result.netflix_br?.[0].productionSlug).toBeNull()
    })

    it('year fica null quando first_air_date está ausente ou é inválida', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (ehTmdb(url)) {
                return { ok: true, json: async () => ({ results: [tmdbShow({ id: 1, first_air_date: undefined })] }) }
            }
            return { ok: true, json: async () => [] }
        })
        const { getStreamingTopShows } = await import('./streaming')
        const result = await getStreamingTopShows()
        expect(result.netflix_br?.[0].year).toBeNull()
    })

    it('posterUrl fica null quando poster_path é null', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (ehTmdb(url)) {
                return { ok: true, json: async () => ({ results: [tmdbShow({ id: 1, poster_path: null })] }) }
            }
            return { ok: true, json: async () => [] }
        })
        const { getStreamingTopShows } = await import('./streaming')
        const result = await getStreamingTopShows()
        expect(result.netflix_br?.[0].posterUrl).toBeNull()
    })
})
