import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getMusicReleases, spotifyEmbedUrl, dedupeReleaseEditions, type MusicRelease } from './music'

function release(id: number, title: string, type: MusicRelease['release_type'] = 'single'): MusicRelease {
    return {
        id, title, slug: String(id), release_type: type, release_date: '2025-01-01',
        cover_url: null, spotify_url: null, spotify_id: null, total_tracks: 1,
        artist_id: 1, group_id: 0,
    }
}

describe('getMusicReleases', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('retorna array vazio sem fazer fetch quando nem artistId nem groupId são passados', async () => {
        const result = await getMusicReleases({})
        expect(result).toEqual([])
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('monta a query com artist_id quando artistId é passado', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
        await getMusicReleases({ artistId: 42 })
        const [url] = fetchMock.mock.calls[0]
        expect(url).toContain('artist_id=42')
        expect(url).not.toContain('group_id')
    })

    it('monta a query com group_id quando groupId é passado', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
        await getMusicReleases({ groupId: 7 })
        const [url] = fetchMock.mock.calls[0]
        expect(url).toContain('group_id=7')
    })

    it('inclui o filtro type quando passado', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
        await getMusicReleases({ artistId: 1, type: 'album' })
        const [url] = fetchMock.mock.calls[0]
        expect(url).toContain('type=album')
    })

    it('usa per_page=50 como default', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
        await getMusicReleases({ artistId: 1 })
        const [url] = fetchMock.mock.calls[0]
        expect(url).toContain('per_page=50')
    })

    it('respeita o perPage customizado', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
        await getMusicReleases({ artistId: 1, perPage: 10 })
        const [url] = fetchMock.mock.calls[0]
        expect(url).toContain('per_page=10')
    })

    it('retorna os releases quando a resposta é ok', async () => {
        const releases = [{ id: 1, title: 'Album X' }]
        fetchMock.mockResolvedValue({ ok: true, json: async () => releases })
        expect(await getMusicReleases({ artistId: 1 })).toEqual(releases)
    })

    it('retorna array vazio quando a resposta não é ok', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500 })
        expect(await getMusicReleases({ artistId: 1 })).toEqual([])
    })

    it('retorna array vazio quando o fetch rejeita', async () => {
        fetchMock.mockRejectedValue(new Error('network error'))
        expect(await getMusicReleases({ artistId: 1 })).toEqual([])
    })
})

describe('dedupeReleaseEditions', () => {
    it('colapsa edições do mesmo lançamento na de título mais curto', () => {
        const out = dedupeReleaseEditions([
            release(1, 'EYES CLOSED (with ZAYN) [Bare/Unveiled]'),
            release(2, 'EYES CLOSED (with ZAYN) (2x)'),
            release(3, 'EYES CLOSED (with ZAYN)'),
        ])
        expect(out).toHaveLength(1)
        expect(out[0].title).toBe('EYES CLOSED (with ZAYN)')
    })

    it('preserva lançamentos genuinamente distintos', () => {
        const out = dedupeReleaseEditions([
            release(1, 'AMORTAGE'), release(2, 'earthquake'), release(3, 'ME'),
        ])
        expect(out.map(r => r.title)).toEqual(['AMORTAGE', 'earthquake', 'ME'])
    })

    it('não funde título igual com tipos de lançamento diferentes', () => {
        expect(dedupeReleaseEditions([
            release(1, 'Flower', 'single'), release(2, 'Flower', 'album'),
        ])).toHaveLength(2)
    })

    it('mantém a ordem em que a API devolveu', () => {
        const out = dedupeReleaseEditions([
            release(1, 'ME'), release(2, 'AMORTAGE (deluxe)'), release(3, 'AMORTAGE'),
        ])
        expect(out.map(r => r.title)).toEqual(['ME', 'AMORTAGE'])
    })

    it('não descarta título composto só de qualificador', () => {
        expect(dedupeReleaseEditions([release(1, '(Untitled)')])).toHaveLength(1)
    })
})

describe('spotifyEmbedUrl', () => {
    it('converte a URL pública do Spotify pro formato embed', () => {
        expect(spotifyEmbedUrl('https://open.spotify.com/album/abc123')).toBe('https://open.spotify.com/embed/album/abc123')
    })

    it('retorna a URL como está quando já não começa com o prefixo esperado', () => {
        expect(spotifyEmbedUrl('https://outra-url.com/album/abc123')).toBe('https://outra-url.com/album/abc123')
    })
})
