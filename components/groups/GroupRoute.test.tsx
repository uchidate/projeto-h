import { describe, it, expect, vi, beforeEach } from 'vitest'

// Regra de SEO de buildGroupMetadata: grupo inexistente, Rank Math manual, descrição derivada
// e noindex quando não há tradução publicada no idioma pedido.
const getGroupBySlug = vi.fn()

vi.mock('@/lib/wordpress/groups', () => ({ getGroupBySlug: (...a: unknown[]) => getGroupBySlug(...a), getRelatedGroups: vi.fn() }))
vi.mock('next-intl/server', () => ({
    getTranslations: async () => (chave: string, valores?: { name?: string; hangul?: string }) => `${chave}:${valores?.name ?? ''}${valores?.hangul ? `:${valores.hangul}` : ''}`,
}))
vi.mock('next/navigation', () => ({ notFound: vi.fn() }))
vi.mock('@/lib/wordpress/artists', () => ({ getArtistsByIds: vi.fn() }))
vi.mock('@/lib/wordpress/posts', () => ({ getPosts: vi.fn() }))
vi.mock('@/lib/wordpress/agencies', () => ({ getAgencies: vi.fn() }))
vi.mock('@/lib/wordpress/music', () => ({ getMusicReleases: vi.fn() }))
vi.mock('@/lib/wordpress/store', () => ({ getStoreProductsByGroupId: vi.fn() }))
vi.mock('@/lib/wordpress/store-ranking', () => ({ ordenarPrateleira: vi.fn() }))
vi.mock('@/lib/wordpress/vitrine', () => ({ comDescobertas: vi.fn(), getVitrineGeral: vi.fn() }))
vi.mock('@/lib/wordpress/mentions', () => ({ getMencoesNoAcervo: vi.fn() }))
vi.mock('@/lib/agencies/preview', () => ({ applyAgencyDirectoryManifestPreview: vi.fn(), applyGroupManifestPreview: vi.fn() }))
vi.mock('@/lib/agencies/network', () => ({ resolveEntityOrganizationContext: vi.fn() }))
vi.mock('@/lib/blog/albumArticles', () => ({ getArtigosDeAlbum: vi.fn(), ligarArtigosAosAlbuns: vi.fn() }))
vi.mock('@/lib/guias/hub-lookup', () => ({ getHubsForGroup: vi.fn() }))
vi.mock('@/lib/i18n/language-links', () => ({ buildLanguageLinks: vi.fn() }))
vi.mock('@/components/ui/WpEditContext', () => ({ WpEditSetter: () => null }))
vi.mock('@/components/groups/GroupDetailPage', () => ({ GroupDetailPage: () => null }))
vi.mock('@/components/groups/GroupDiscography', () => ({}))
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: () => null }))
vi.mock('@/components/i18n/LanguageSwitcher', () => ({ LanguageSwitcher: () => null }))
vi.mock('@/components/i18n/AvisoSemTraducao', () => ({ AvisoSemTraducao: () => null }))
vi.mock('@/components/analytics/RastreioDeRolagem', () => ({ RastreioDeRolagem: () => null }))

import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { buildGroupMetadata } from './GroupRoute'

const PT = DEFAULT_LOCALE
const TEXTO_LONGO = `<p>${'Grupo sul-coreano formado em 2020 com cinco integrantes. '.repeat(8)}</p>`

function grupo(extra: Record<string, unknown> = {}) {
    return {
        id: 7,
        slug: 'aespa',
        status: 'publish',
        title: { rendered: 'aespa' },
        content: { rendered: TEXTO_LONGO },
        featured_media: 0,
        meta: {},
        acf: {},
        ...extra,
    }
}

beforeEach(() => {
    getGroupBySlug.mockReset()
})

describe('buildGroupMetadata', () => {
    it('devolve metadata vazia quando o grupo não existe', async () => {
        getGroupBySlug.mockResolvedValue(null)
        expect(await buildGroupMetadata('nao-existe', PT)).toEqual({})
    })

    it('prefere título e descrição manuais do Rank Math e fica indexável', async () => {
        getGroupBySlug.mockResolvedValue(grupo({ meta: { rank_math_title: 'aespa: integrantes e músicas', rank_math_description: 'SEO manual.' } }))
        const m = await buildGroupMetadata('aespa', PT)
        expect(m.title).toBe('aespa: integrantes e músicas')
        expect(m.description).toBe('SEO manual.')
        expect(m.robots).toBeUndefined()
    })

    it('sem Rank Math usa o título do idioma e deriva a descrição do conteúdo', async () => {
        getGroupBySlug.mockResolvedValue(grupo())
        const m = await buildGroupMetadata('aespa', PT)
        expect(m.title).toBe('group.metaTitle:aespa')
        expect(String(m.description)).toContain('Grupo sul-coreano')
    })

    it('sem conteúdo usa a descrição com hangul quando há nome em hangul', async () => {
        getGroupBySlug.mockResolvedValue(grupo({ content: { rendered: '' }, acf: { name_hangul: '에스파' } }))
        const m = await buildGroupMetadata('aespa', PT)
        expect(m.description).toBe('group.metaDescriptionHangul:aespa:에스파')
    })

    it('sem conteúdo nem hangul usa a descrição padrão', async () => {
        getGroupBySlug.mockResolvedValue(grupo({ content: { rendered: '' } }))
        const m = await buildGroupMetadata('aespa', PT)
        expect(m.description).toBe('group.metaDescription:aespa')
    })

    it('em inglês sem tradução publicada serve a ficha em português fora do índice', async () => {
        getGroupBySlug.mockResolvedValue(grupo({ translations: null }))
        const m = await buildGroupMetadata('aespa', 'en')
        expect(m.robots).toEqual({ index: false, follow: true })
        expect(m.title).toBe('group.metaTitle:aespa')
    })

    it('em inglês com tradução publicada não aplica noindex', async () => {
        getGroupBySlug.mockResolvedValue(grupo({ translations: { en: { title: 'aespa', content: '<p>South Korean girl group.</p>' } } }))
        const m = await buildGroupMetadata('aespa', 'en')
        expect(m.robots).toBeUndefined()
    })
})
