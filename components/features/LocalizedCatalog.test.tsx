import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/lib/i18n/config', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/i18n/config')>()
    const ACTIVE_LOCALES = ['pt', 'en'] as const
    return { ...actual, ACTIVE_LOCALES, isActiveLocale: (v: string) => (ACTIVE_LOCALES as readonly string[]).includes(v) }
})
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
const getArtists = vi.fn()
vi.mock('@/lib/wordpress/artists', () => ({ getArtists: (...args: unknown[]) => getArtists(...args) }))
vi.mock('@/lib/wordpress/groups', () => ({ getGroups: vi.fn() }))
vi.mock('@/lib/wordpress/productions', () => ({ getProductions: vi.fn() }))

const { buildCatalogMetadata, defaultCatalogLanguages } = await import('./LocalizedCatalog')

const artist = (slug: string, translated: boolean) => ({
    id: slug.length, slug, title: { rendered: slug }, content: { rendered: '' }, acf: {},
    translations: translated ? { en: { content: '<p>EN</p>' } } : null,
})

describe('LocalizedCatalog', () => {
    beforeEach(() => getArtists.mockReset())

    it('pede ao WordPress só itens traduzidos', async () => {
        getArtists.mockResolvedValue({ items: [artist('yoona', true)], total: 1, totalPages: 1 })
        await buildCatalogMetadata('artists', 'en')
        expect(getArtists).toHaveBeenCalledWith(expect.objectContaining({ locale: 'en' }))
    })

    it('não indexa listagem vazia e não aponta hreflang para ela', async () => {
        getArtists.mockResolvedValue({ items: [], total: 0, totalPages: 0 })
        const metadata = await buildCatalogMetadata('artists', 'en')
        expect(metadata.robots).toEqual({ index: false, follow: true })
        expect(metadata.alternates?.languages).toBeUndefined()
        expect(await defaultCatalogLanguages('artists')).toBeUndefined()
    })

    it('descarta o catálogo em português quando o filtro oc_locale não existe no WordPress', async () => {
        getArtists.mockResolvedValue({ items: [artist('yoona', true), artist('iu', false), artist('bona', false)], total: 3000, totalPages: 63 })
        const metadata = await buildCatalogMetadata('artists', 'en')
        expect(metadata.robots).toBeUndefined()
        expect(await defaultCatalogLanguages('artists')).toEqual({
            'pt-BR': 'https://www.example.com/artists',
            en: 'https://www.example.com/en/artists',
            'x-default': 'https://www.example.com/artists',
        })
    })
})
