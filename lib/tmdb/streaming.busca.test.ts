import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { StreamingEntry } from './streaming'

vi.mock('@/lib/wordpress/config', () => ({ WP_API_URL: 'https://wp.test/wp-json' }))

const show = (id: number) => ({ id, name: `Série ${id}`, poster_path: null, original_language: 'ko' })

async function carregarModulo() {
    vi.resetModules()
    return import('./streaming')
}

beforeEach(() => vi.stubEnv('TMDB_API_KEY', 'chave-de-teste'))
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('getStreamingTopShows', () => {
    it('liga só séries à ficha e não encurta o cache da página', async () => {
        const buscar = vi.fn(async (url: string, _init?: { next?: { revalidate?: number }; signal?: AbortSignal }) => url.includes('wp.test')
            ? new Response(JSON.stringify([
                { slug: 'serie', title: { rendered: 'Nome &amp; Ficha' }, acf: { tmdb_id: 1, type: 'drama' } },
                { slug: 'filme-de-mesmo-numero', acf: { tmdb_id: 2, type: 'movie' } },
            ]))
            : new Response(JSON.stringify({ results: [show(1), show(2)] })))
        vi.stubGlobal('fetch', buscar)
        const { getStreamingTopShows } = await carregarModulo()
        const r = await getStreamingTopShows()
        expect(r.netflix_br.map(s => s.productionSlug)).toEqual(['serie'])
        expect(r.netflix_br[0].title).toBe('Nome & Ficha')
        expect(buscar.mock.calls[0][0]).toContain('without_genres=16%2C10762')
        for (const [, init] of buscar.mock.calls) {
            expect(init?.next?.revalidate).toBe(21600)
            expect(init?.signal).toBeInstanceOf(AbortSignal)
        }
    })
})

describe('emAltaPara', () => {
    const obra = (slug: string | null): StreamingEntry =>
        ({ rank: 1, tmdbId: String(slug), title: String(slug), posterUrl: null, year: null, rating: null, isKorean: true, productionSlug: slug })

    it('tira a própria obra, o que a página já recomenda e o que não tem ficha', async () => {
        const { emAltaPara } = await carregarModulo()
        const r = emAltaPara({ netflix_br: ['atual', 'ja', null, 'a', 'b', 'c'].map(obra) }, ['atual', 'ja'])
        expect(r.netflix_br.map(s => s.productionSlug)).toEqual(['a', 'b', 'c'])
    })

    it('descarta a plataforma com menos de três e limita a dez', async () => {
        const { emAltaPara } = await carregarModulo()
        const doze = Array.from({ length: 12 }, (_, i) => obra(`o${i}`))
        const r = emAltaPara({ netflix_br: doze, apple_br: [obra('x'), obra('y')] }, [])
        expect(r.netflix_br).toHaveLength(10)
        expect(r.apple_br).toBeUndefined()
    })
})
