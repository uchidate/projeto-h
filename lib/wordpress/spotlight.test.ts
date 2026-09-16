import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./artists', () => ({
    getArtistBySlug: vi.fn(),
}))

import { getArtistBySlug } from './artists'
import { getFeaturedSpotlight } from './spotlight'

describe('getFeaturedSpotlight', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        vi.mocked(getArtistBySlug).mockReset()
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    it('retorna null quando não há nenhum post de spotlight publicado', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
        expect(await getFeaturedSpotlight()).toBeNull()
        expect(getArtistBySlug).not.toHaveBeenCalled()
    })

    it('retorna null quando o post não tem spotlight_slug no meta', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => [{ id: 1, title: { rendered: 'X' }, date: '2026-01-01', meta: {} }],
        })
        expect(await getFeaturedSpotlight()).toBeNull()
    })

    it('resolve o artista pelo slug do meta e monta o FeaturedSpotlight', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => [{
                id: 1, title: { rendered: 'Destaque' }, date: '2026-01-15',
                meta: { spotlight_slug: 'jimin', spotlight_type: 'artist', spotlight_note: 'Voltou com álbum solo' },
            }],
        })
        const mockArtist = { id: 99, slug: 'jimin' }
        vi.mocked(getArtistBySlug).mockResolvedValue(mockArtist as never)

        const result = await getFeaturedSpotlight()
        expect(getArtistBySlug).toHaveBeenCalledWith('jimin')
        expect(result).toEqual({
            artist: mockArtist, note: 'Voltou com álbum solo', type: 'artist', publishedAt: '2026-01-15',
        })
    })

    it('usa string vazia quando spotlight_note está ausente', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => [{ id: 1, title: { rendered: 'X' }, date: '2026-01-01', meta: { spotlight_slug: 'jimin' } }],
        })
        vi.mocked(getArtistBySlug).mockResolvedValue(null)
        const result = await getFeaturedSpotlight()
        expect(result?.note).toBe('')
    })

    it('usa "artist" como type default quando spotlight_type está ausente', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => [{ id: 1, title: { rendered: 'X' }, date: '2026-01-01', meta: { spotlight_slug: 'bts' } }],
        })
        vi.mocked(getArtistBySlug).mockResolvedValue(null)
        const result = await getFeaturedSpotlight()
        expect(result?.type).toBe('artist')
    })

    it('artist fica null quando getArtistBySlug não encontra o artista (slug quebrado/mesclado)', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => [{ id: 1, title: { rendered: 'X' }, date: '2026-01-01', meta: { spotlight_slug: 'artista-deletado' } }],
        })
        vi.mocked(getArtistBySlug).mockResolvedValue(null)
        const result = await getFeaturedSpotlight()
        expect(result?.artist).toBeNull()
    })

    it('retorna null (não lança) quando o WP responde erro HTTP', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' })
        expect(await getFeaturedSpotlight()).toBeNull()
    })

    it('retorna null (não lança) quando o fetch rejeita', async () => {
        fetchMock.mockRejectedValue(new Error('network error'))
        expect(await getFeaturedSpotlight()).toBeNull()
    })

    it('retorna null (não lança) quando getArtistBySlug rejeita', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => [{ id: 1, title: { rendered: 'X' }, date: '2026-01-01', meta: { spotlight_slug: 'jimin' } }],
        })
        vi.mocked(getArtistBySlug).mockRejectedValue(new Error('falhou'))
        expect(await getFeaturedSpotlight()).toBeNull()
    })
})
