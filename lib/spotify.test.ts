import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('next/cache', () => ({
    unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}))

describe('extractSpotifyArtistId', () => {
    it('extrai o ID de uma URL válida do Spotify', async () => {
        const { extractSpotifyArtistId } = await import('./spotify')
        expect(extractSpotifyArtistId('https://open.spotify.com/artist/3Nrfpe0tUJi4K4DXYWgMUX')).toBe('3Nrfpe0tUJi4K4DXYWgMUX')
    })

    it('ignora query params/hash na URL', async () => {
        const { extractSpotifyArtistId } = await import('./spotify')
        expect(extractSpotifyArtistId('https://open.spotify.com/artist/3Nrfpe0tUJi4K4DXYWgMUX?si=abc123')).toBe('3Nrfpe0tUJi4K4DXYWgMUX')
    })

    it('retorna null pra domínio diferente de open.spotify.com', async () => {
        const { extractSpotifyArtistId } = await import('./spotify')
        expect(extractSpotifyArtistId('https://spotify.com/artist/3Nrfpe0tUJi4K4DXYWgMUX')).toBeNull()
    })

    it('retorna null pra URL do Spotify que não é de artista (ex: álbum)', async () => {
        const { extractSpotifyArtistId } = await import('./spotify')
        expect(extractSpotifyArtistId('https://open.spotify.com/album/abc123')).toBeNull()
    })

    it('retorna null pra URL inválida', async () => {
        const { extractSpotifyArtistId } = await import('./spotify')
        expect(extractSpotifyArtistId('não-é-uma-url')).toBeNull()
    })
})

describe('getArtistAlbums', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        vi.resetModules()
        process.env.SPOTIFY_CLIENT_ID = 'test-client'
        process.env.SPOTIFY_CLIENT_SECRET = 'test-secret'
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    function tokenResponse() {
        return { ok: true, json: async () => ({ access_token: 'tok' }) }
    }

    it('pagina até "next" ficar null e junta todos os álbuns', async () => {
        // sem cache real (mock de unstable_cache é passthrough), cada página
        // busca o token de novo — por isso token/página intercalados
        fetchMock
            .mockResolvedValueOnce(tokenResponse())
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    items: [{ id: '1', name: 'Album A' }],
                    next: 'https://api.spotify.com/v1/artists/x/albums?offset=50',
                }),
            })
            .mockResolvedValueOnce(tokenResponse())
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ items: [{ id: '2', name: 'Album B' }], next: null }),
            })

        const { getArtistAlbums } = await import('./spotify')
        const result = await getArtistAlbums('artist-id')
        expect(result.map(a => a.id)).toEqual(['1', '2'])
    })

    it('deduplica álbuns com o mesmo nome normalizado (ex: "Album (Deluxe)" vs "Album")', async () => {
        fetchMock
            .mockResolvedValueOnce(tokenResponse())
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    items: [
                        { id: '1', name: 'Face-off' },
                        { id: '2', name: 'Face-off (Deluxe Edition)' },
                    ],
                    next: null,
                }),
            })

        const { getArtistAlbums } = await import('./spotify')
        const result = await getArtistAlbums('artist-id')
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('1') // mantém a primeira ocorrência (mais recente)
    })

    it('lança erro quando o token não pode ser obtido (credenciais ausentes)', async () => {
        delete process.env.SPOTIFY_CLIENT_ID
        const { getArtistAlbums } = await import('./spotify')
        await expect(getArtistAlbums('artist-id')).rejects.toThrow(/SPOTIFY_CLIENT_ID/)
    })

    it('lança erro quando a API do Spotify responde com erro', async () => {
        fetchMock
            .mockResolvedValueOnce(tokenResponse())
            .mockResolvedValueOnce({ ok: false, status: 500 })

        const { getArtistAlbums } = await import('./spotify')
        await expect(getArtistAlbums('artist-id')).rejects.toThrow(/Spotify API error 500/)
    })
})
