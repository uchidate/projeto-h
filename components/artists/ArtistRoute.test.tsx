import { describe, it, expect, vi, beforeEach } from 'vitest'

// A rota só resolve slug e idioma; o que importa testar aqui é a regra de SEO de buildArtistMetadata:
// ficha inexistente, título/descrição do Rank Math, e o que vai para fora do índice (noindex).
const getArtistBySlug = vi.fn()

vi.mock('@/lib/wordpress/artists', () => ({
    getArtistBySlug: (...a: unknown[]) => getArtistBySlug(...a),
    getArtistsByIds: vi.fn(),
    getRelatedArtists: vi.fn(),
}))
vi.mock('next-intl/server', () => ({
    getTranslations: async () => (chave: string, valores?: { name?: string }) => `${chave}:${valores?.name ?? ''}`,
}))
vi.mock('next/navigation', () => ({ notFound: vi.fn() }))
vi.mock('@/lib/wordpress/productions', () => ({ getProductionsByArtist: vi.fn() }))
vi.mock('@/lib/wordpress/groups', () => ({ getGroupsByIds: vi.fn(), getGroupsByMemberId: vi.fn() }))
vi.mock('@/lib/wordpress/posts', () => ({ getPosts: vi.fn(), getCategories: vi.fn() }))
vi.mock('@/lib/wordpress/agencies', () => ({ getAgencyById: vi.fn() }))
vi.mock('@/lib/wordpress/store', () => ({ getStoreProductsByArtistId: vi.fn(), getStoreProductsByGroupId: vi.fn() }))
vi.mock('@/lib/wordpress/store-ranking', () => ({ ordenarPrateleira: vi.fn() }))
vi.mock('@/lib/wordpress/vitrine', () => ({ comDescobertas: vi.fn(), getVitrineGeral: vi.fn() }))
vi.mock('@/lib/wordpress/music', () => ({ getMusicReleases: vi.fn() }))
vi.mock('@/lib/wordpress/mentions', () => ({ getMencoesNoAcervo: vi.fn() }))
vi.mock('@/lib/blog/albumArticles', () => ({ getArtigosDeAlbum: vi.fn(), ligarArtigosAosAlbuns: vi.fn() }))
vi.mock('@/lib/agencies/preview', () => ({ applyArtistManifestPreview: vi.fn(), applyArtistProductionsPreview: vi.fn() }))
vi.mock('@/lib/guias/hub-lookup', () => ({ getHubsForArtist: vi.fn() }))
vi.mock('@/lib/i18n/language-links', () => ({ buildLanguageLinks: vi.fn() }))
vi.mock('@/components/ui/WpEditContext', () => ({ WpEditSetter: () => null }))
vi.mock('@/components/artists/ArtistDetailPage', () => ({ ArtistDetailPage: () => null }))
vi.mock('@/components/i18n/AvisoSemTraducao', () => ({ AvisoSemTraducao: () => null }))
vi.mock('@/components/analytics/RastreioDeRolagem', () => ({ RastreioDeRolagem: () => null }))
vi.mock('@/components/groups/GroupDiscography', () => ({}))

import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { buildArtistMetadata } from './ArtistRoute'

const PT = DEFAULT_LOCALE

const TEXTO_LONGO = `<p>${'Cantora e atriz sul-coreana com carreira solo consolidada. '.repeat(8)}</p>`

function ficha(extra: Record<string, unknown> = {}) {
    return {
        id: 1,
        slug: 'iu',
        status: 'publish',
        title: { rendered: 'IU' },
        content: { rendered: TEXTO_LONGO },
        featured_media: 0,
        meta: {},
        ...extra,
    }
}

beforeEach(() => {
    getArtistBySlug.mockReset()
})

describe('buildArtistMetadata', () => {
    it('devolve metadata vazia quando a ficha não existe', async () => {
        getArtistBySlug.mockResolvedValue(null)
        expect(await buildArtistMetadata('nao-existe', PT)).toEqual({})
    })

    it('prefere título e descrição manuais do Rank Math', async () => {
        getArtistBySlug.mockResolvedValue(ficha({ meta: { rank_math_title: 'IU: carreira e discografia', rank_math_description: 'Descrição manual do SEO.' } }))
        const m = await buildArtistMetadata('iu', PT)
        expect(m.title).toBe('IU: carreira e discografia')
        expect(m.description).toBe('Descrição manual do SEO.')
        expect(m.robots).toBeUndefined()
    })

    it('sem Rank Math usa o título do idioma e deriva a descrição do conteúdo', async () => {
        getArtistBySlug.mockResolvedValue(ficha())
        const m = await buildArtistMetadata('iu', PT)
        expect(m.title).toBe('artist.metaTitle:IU')
        expect(String(m.description)).toContain('Cantora e atriz sul-coreana')
    })

    it('sem conteúdo usa a descrição padrão do idioma', async () => {
        getArtistBySlug.mockResolvedValue(ficha({ content: { rendered: '' } }))
        const m = await buildArtistMetadata('iu', PT)
        expect(m.description).toBe('artist.metaDescription:IU')
    })

    it('em inglês sem tradução publicada serve a ficha em português fora do índice', async () => {
        getArtistBySlug.mockResolvedValue(ficha({ translations: null }))
        const m = await buildArtistMetadata('iu', 'en')
        expect(m.robots).toEqual({ index: false, follow: true })
        expect(m.title).toBe('artist.metaTitle:IU')
    })

    it('em inglês com tradução de uma frase só (ficha fina) fica noindex, follow', async () => {
        getArtistBySlug.mockResolvedValue(ficha({
            translations: { en: { title: 'IU', content: '<p>Singer.</p>' } },
        }))
        const m = await buildArtistMetadata('iu', 'en')
        expect(m.robots).toEqual({ index: false, follow: true })
    })

    it('em inglês com tradução completa entra no índice', async () => {
        getArtistBySlug.mockResolvedValue(ficha({
            translations: { en: { title: 'IU', content: `<p>${'South Korean singer and actress with a long solo career. '.repeat(8)}</p>` } },
        }))
        const m = await buildArtistMetadata('iu', 'en')
        expect(m.robots).toBeUndefined()
    })
})
