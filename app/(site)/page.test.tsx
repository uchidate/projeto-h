import { describe, it, expect, vi, beforeEach } from 'vitest'

// A home degradada (WordPress fora do ar -> wpFetch devolve []) saía com HTTP 200
// e foi congelada dez minutos no cache de borda em 2026-08-06. A guarda precisa
// lançar para o ISR não guardar essa versão.
vi.mock('@/lib/wordpress/site-settings', () => ({
    getSiteSettings: async () => ({ home: { heroPostId: 0, highlightPostIds: [] } }),
}))
const vazio = { items: [], total: 0, totalPages: 0 }
vi.mock('@/lib/wordpress/posts', () => ({
    getPosts: async () => vazio,
    getCategories: async () => [],
}))
vi.mock('@/lib/wordpress/productions', () => ({ getProductions: async () => vazio, getStreamingTopShows: async () => ({}) }))
vi.mock('@/lib/wordpress/artists', () => ({ getMostAccessedArtists: async () => [], getPopularArtists: async () => [], getStreamingArtists: async () => [] }))
vi.mock('@/lib/wordpress/groups', () => ({ getTrendingGroups: async () => [] }))
vi.mock('@/lib/wordpress/spotlight', () => ({ getFeaturedSpotlight: async () => null }))
// IS_BUILD falso: a guarda só vale em runtime, nunca durante o build estático.
vi.mock('@/lib/wordpress/config', async (orig) => ({ ...(await orig() as object), IS_BUILD: false }))

describe('HomePage — proteção contra cachear página degradada', () => {
    beforeEach(() => vi.clearAllMocks())

    it('lança quando não há nenhum post, em vez de renderizar home vazia', async () => {
        const { default: HomePage } = await import('./page')
        await expect(HomePage()).rejects.toThrow(/WordPress indisponível/)
    })
})
