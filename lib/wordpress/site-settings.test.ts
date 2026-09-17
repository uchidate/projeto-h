import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getSiteSettings, DEFAULT_SITE_SETTINGS, sanitizeMaisBuscados } from './site-settings'

describe('getSiteSettings', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('retorna DEFAULT_SITE_SETTINGS quando a API responde erro HTTP', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500 })
        expect(await getSiteSettings()).toEqual(DEFAULT_SITE_SETTINGS)
    })

    it('retorna DEFAULT_SITE_SETTINGS quando o fetch rejeita (timeout/rede)', async () => {
        fetchMock.mockRejectedValue(new Error('timeout'))
        expect(await getSiteSettings()).toEqual(DEFAULT_SITE_SETTINGS)
    })

    it('usa tagline/logoSubtitles/tickerEnabled do WP quando presentes', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ tagline: 'Tagline do WP', logoSubtitles: ['a', 'b'], tickerEnabled: false }),
        })
        const result = await getSiteSettings()
        expect(result.tagline).toBe('Tagline do WP')
        expect(result.logoSubtitles).toEqual(['a', 'b'])
        expect(result.tickerEnabled).toBe(false)
    })

    it('cai pros defaults quando o WP não define tagline/logoSubtitles', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
        const result = await getSiteSettings()
        expect(result.tagline).toBe(DEFAULT_SITE_SETTINGS.tagline)
        expect(result.logoSubtitles).toEqual(DEFAULT_SITE_SETTINGS.logoSubtitles)
    })

    describe('navegação', () => {
        // Migração /melhores-dramas → /guias já foi feita direto no default do
        // WP (oc_site_settings_defaults() em plugin de CPTs do WordPress,
        // 2026-07-06) — o patch de auto-cura em runtime que existia aqui era
        // temporário e foi removido depois de confirmado que a rota
        // /melhores-dramas já não existe mais em produção (404) e o conteúdo
        // foi todo incorporado aos guias.
        it('usa a navegação do WP quando presente', async () => {
            const wpNav = [{ label: 'Início', href: '/' }, { label: 'Guias', href: '/guias' }]
            fetchMock.mockResolvedValue({ ok: true, json: async () => ({ navigation: wpNav }) })
            const result = await getSiteSettings()
            expect(result.navigation).toEqual(wpNav)
        })

        it('usa a navegação default quando o WP não define nenhuma', async () => {
            fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
            const result = await getSiteSettings()
            expect(result.navigation).toEqual(expect.arrayContaining(DEFAULT_SITE_SETTINGS.navigation))
        })
    })

    describe('home settings', () => {
        it('usa hubs customizados do WP quando presentes', async () => {
            const customHubs = [{ label: 'X', href: '/x', hangul: 'x', detail: 'x', color: '#fff' }]
            fetchMock.mockResolvedValue({ ok: true, json: async () => ({ home: { hubs: customHubs } }) })
            const result = await getSiteSettings()
            expect(result.home.hubs).toEqual(customHubs)
        })

        it('cai pros hubs default quando o WP retorna array vazio', async () => {
            fetchMock.mockResolvedValue({ ok: true, json: async () => ({ home: { hubs: [] } }) })
            const result = await getSiteSettings()
            expect(result.home.hubs.length).toBeGreaterThan(0)
        })

        it('heroPostId/highlightPostIds/featuredGroupIds default pra 0/[]/[] quando ausentes', async () => {
            fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
            const result = await getSiteSettings()
            expect(result.home.heroPostId).toBe(0)
            expect(result.home.highlightPostIds).toEqual([])
            expect(result.home.featuredGroupIds).toEqual([])
        })
    })

    it('bestOfLists cai pro default quando o WP retorna array vazio', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ bestOfLists: [] }) })
        const result = await getSiteSettings()
        expect(result.bestOfLists).toEqual(DEFAULT_SITE_SETTINGS.bestOfLists)
    })

    it('googleTag fica null quando ausente (não undefined)', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
        const result = await getSiteSettings()
        expect(result.googleTag).toBeNull()
    })

    it('googleTag usa o valor do WP quando presente', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ googleTag: 'GT-XXXX' }) })
        const result = await getSiteSettings()
        expect(result.googleTag).toBe('GT-XXXX')
    })
})

describe('sanitizeMaisBuscados', () => {
    it('aceita só fichas internas com rótulo e limita a 12', () => {
        const validos = Array.from({ length: 15 }, (_, i) => ({ label: `Artista ${i}`, href: `/artists/a-${i}` }))
        const lista = sanitizeMaisBuscados([
            { label: 'Externo', href: 'https://exemplo.com/x' },
            { label: '', href: '/groups/ive' },
            { label: 'Blog', href: '/blog/post' },
            { label: 'Script', href: '/artists/x"onmouseover' },
            ...validos,
        ])
        expect(lista).toHaveLength(12)
        expect(lista[0]).toEqual({ label: 'Artista 0', href: '/artists/a-0' })
    })

    it('devolve lista vazia para valor que não é array', () => {
        expect(sanitizeMaisBuscados(undefined)).toEqual([])
        expect(sanitizeMaisBuscados({ label: 'x' })).toEqual([])
    })
})
