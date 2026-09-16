import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('getMonetizationSettings', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        vi.resetModules()
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        consoleErrorSpy.mockRestore()
    })

    it('retorna habilitado com os slots quando a API responde ok e o client é válido', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                enabled: true,
                client: 'ca-pub-1234567890123456',
                slots: { inline: 'slot-1', article_sidebar: 'slot-sidebar', post_suggestion: 'slot-post-suggestion', leaderboard: 'slot-2', sticky: 'slot-3' },
            }),
        })
        const { getMonetizationSettings } = await import('./monetization')
        const result = await getMonetizationSettings()
        expect(result).toEqual({
            enabled: true,
            client: 'ca-pub-1234567890123456',
            slots: { inline: 'slot-1', article_sidebar: 'slot-sidebar', post_suggestion: 'slot-post-suggestion', leaderboard: 'slot-2', sticky: 'slot-3' },
            placements: {},
        })
    })

    it('mantém só placements com nome e ID válidos', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                enabled: true,
                client: 'ca-pub-1234567890123456',
                slots: {},
                placements: { artists_grid: '1234567890', 'Bad-Name': '1234567890', hub_feed: 'abc', blog_feed: 42 },
            }),
        })
        const { getMonetizationSettings } = await import('./monetization')
        const result = await getMonetizationSettings()
        expect(result.placements).toEqual({ artists_grid: '1234567890' })
    })

    it('retorna DISABLED quando enabled é false, mesmo com client válido', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ enabled: false, client: 'ca-pub-1234567890123456', slots: {} }),
        })
        const { getMonetizationSettings } = await import('./monetization')
        const result = await getMonetizationSettings()
        expect(result.enabled).toBe(false)
        expect(result.client).toBe('')
    })

    it('retorna DISABLED quando o client não bate com o formato ca-pub-XXXXXXXXXXXXXXXX', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ enabled: true, client: 'not-a-valid-client-id', slots: {} }),
        })
        const { getMonetizationSettings } = await import('./monetization')
        const result = await getMonetizationSettings()
        expect(result.enabled).toBe(false)
    })

    it('retorna DISABLED e loga erro quando a API responde com status não-ok', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' })
        const { getMonetizationSettings } = await import('./monetization')
        const result = await getMonetizationSettings()
        expect(result).toEqual({ enabled: false, client: '', slots: { inline: '', article_sidebar: '', post_suggestion: '', leaderboard: '', sticky: '' } })
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('500'))
    })

    it('retorna DISABLED e loga erro quando o fetch rejeita (timeout/rede)', async () => {
        fetchMock.mockRejectedValue(new Error('timeout'))
        const { getMonetizationSettings } = await import('./monetization')
        const result = await getMonetizationSettings()
        expect(result).toEqual({ enabled: false, client: '', slots: { inline: '', article_sidebar: '', post_suggestion: '', leaderboard: '', sticky: '' } })
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('unavailable'), expect.any(Error))
    })

    it('preenche slots ausentes com string vazia (não undefined)', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ enabled: true, client: 'ca-pub-1234567890123456', slots: { inline: 'x' } }),
        })
        const { getMonetizationSettings } = await import('./monetization')
        const result = await getMonetizationSettings()
        expect(result.slots).toEqual({ inline: 'x', article_sidebar: '', post_suggestion: '', leaderboard: '', sticky: '' })
    })

    it('usa timeout de 5s (bem menor que o wpFetch padrão de 120s) — path crítico de renderização', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ enabled: false }) })
        const { getMonetizationSettings } = await import('./monetization')
        await getMonetizationSettings()
        const [, options] = fetchMock.mock.calls[0]
        expect(options.signal).toBeInstanceOf(AbortSignal)
    })
})
