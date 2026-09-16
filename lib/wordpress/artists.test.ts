import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getArtists, getArtistBySlug, getArtistsByIds, getMostAccessedArtists, getPopularArtists } from './artists'

function artist(id: number, slug: string) {
    return { id, slug, title: { rendered: slug } }
}

describe('getArtists', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('usa orderby=date + oc_orderby=trending_score quando orderby é "trending_score"', async () => {
        fetchMock.mockResolvedValue({
            ok: true, json: async () => [],
            headers: new Map([['X-WP-Total', '0'], ['X-WP-TotalPages', '0']]),
        })
        await getArtists({ orderby: 'trending_score' })
        const url = fetchMock.mock.calls[0][0] as string
        expect(url).toContain('orderby=date')
        expect(url).toContain('oc_orderby=trending_score')
    })

    it('usa orderby=date + oc_orderby=popularity quando orderby é "popularity"', async () => {
        fetchMock.mockResolvedValue({
            ok: true, json: async () => [],
            headers: new Map([['X-WP-Total', '0'], ['X-WP-TotalPages', '0']]),
        })
        await getArtists({ orderby: 'popularity' })
        const url = fetchMock.mock.calls[0][0] as string
        expect(url).toContain('orderby=date')
        expect(url).toContain('oc_orderby=popularity')
    })

    it('usa o orderby literal quando não é uma ordenação por meta', async () => {
        fetchMock.mockResolvedValue({
            ok: true, json: async () => [],
            headers: new Map([['X-WP-Total', '0'], ['X-WP-TotalPages', '0']]),
        })
        await getArtists({ orderby: 'title' })
        const url = fetchMock.mock.calls[0][0] as string
        expect(url).toContain('orderby=title')
        expect(url).not.toContain('oc_orderby')
    })

    it('inclui os filtros de role/gender/letter/agency quando fornecidos', async () => {
        fetchMock.mockResolvedValue({
            ok: true, json: async () => [],
            headers: new Map([['X-WP-Total', '0'], ['X-WP-TotalPages', '0']]),
        })
        await getArtists({ role: 'singer', gender: 'female', letter: 'K', agency: 7 })
        const url = fetchMock.mock.calls[0][0] as string
        expect(url).toContain('oc_role=singer')
        expect(url).toContain('oc_gender=female')
        expect(url).toContain('oc_letter=K')
        expect(url).toContain('oc_agency=7')
    })

    it('consulta várias organizações em uma única chamada', async () => {
        fetchMock.mockResolvedValue({
            ok: true, json: async () => [],
            headers: new Map([['X-WP-Total', '0'], ['X-WP-TotalPages', '0']]),
        })
        await getArtists({ agencies: [7, 8, 9] })
        expect(fetchMock.mock.calls[0][0] as string).toContain('oc_agencies=7%2C8%2C9')
    })
})

describe('getArtistBySlug', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('retorna o artista quando encontrado', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [artist(1, 'jimin')] })
        expect(await getArtistBySlug('jimin')).toEqual(artist(1, 'jimin'))
    })

    it('retorna null quando não encontrado', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
        expect(await getArtistBySlug('inexistente')).toBeNull()
    })
})

describe('getPopularArtists', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('usa popularidade quando já existem scores preenchidos', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [{ ...artist(1, 'jisoo'), acf: { popularity_score: 100 } }],
        })
        vi.stubGlobal('fetch', fetchMock)
        const result = await getPopularArtists(8)
        expect(result[0].slug).toBe('jisoo')
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(fetchMock.mock.calls[0][0] as string).toContain('oc_orderby=popularity')
    })

    it('cai para tendência enquanto o backfill de popularidade não foi executado', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => [{ ...artist(1, 'sem-score'), acf: {} }] })
            .mockResolvedValueOnce({ ok: true, json: async () => [{ ...artist(2, 'em-alta'), acf: { trending_score: 90 } }] })
        vi.stubGlobal('fetch', fetchMock)
        const result = await getPopularArtists(8)
        expect(result[0].slug).toBe('em-alta')
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(fetchMock.mock.calls[1][0] as string).toContain('oc_orderby=trending_score')
    })
})

describe('getArtistsByIds', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('retorna array vazio sem fetch quando ids é vazio', async () => {
        expect(await getArtistsByIds([])).toEqual([])
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('retorna array vazio quando a API falha', async () => {
        fetchMock.mockRejectedValue(new Error('network error'))
        expect(await getArtistsByIds([1, 2])).toEqual([])
    })

    it('retorna os artistas quando a API responde ok', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [artist(1, 'a'), artist(2, 'b')] })
        expect(await getArtistsByIds([1, 2])).toEqual([artist(1, 'a'), artist(2, 'b')])
    })
})

describe('getMostAccessedArtists', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('ordena por acesso real quando access_score já existe', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [
                { ...artist(1, 'jisoo'), acf: { access_score: 42 } },
                { ...artist(2, 'lee-ji-eun'), acf: { access_score: 100 } },
            ],
        })
        vi.stubGlobal('fetch', fetchMock)
        const result = await getMostAccessedArtists(8)
        expect(result[0].slug).toBe('lee-ji-eun')
        expect(fetchMock.mock.calls[0][0] as string).toContain('oc_orderby=access')
    })

    it('cai para popularidade enquanto o script de acesso não rodou', async () => {
        // access_score só existe depois de update-artist-access.mjs; sem o
        // recuo a home ficaria sem o bloco até a primeira execução.
        const fetchMock = vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => [{ ...artist(1, 'jisoo'), acf: {} }] })
            .mockResolvedValueOnce({ ok: true, json: async () => [{ ...artist(2, 'rm'), acf: { popularity_score: 90 } }] })
        vi.stubGlobal('fetch', fetchMock)
        const result = await getMostAccessedArtists(8)
        expect(result[0].slug).toBe('rm')
        expect(fetchMock.mock.calls[1][0] as string).toContain('oc_orderby=popularity')
    })
})
