import { describe, it, expect, vi, beforeEach } from 'vitest'

// Regra de SEO de buildProductionMetadata: produção inexistente, Rank Math manual, tipo no título
// e o que vai para fora do índice (sem tradução, ou tradução de uma frase só).
const getProductionBySlug = vi.fn()

vi.mock('@/lib/wordpress/productions', () => ({
    getProductionBySlug: (...a: unknown[]) => getProductionBySlug(...a),
    getSmartRelatedProductions: vi.fn(),
    getProductionGenres: vi.fn(),
}))
vi.mock('next-intl/server', () => ({
    getTranslations: async () => (chave: string, valores?: { title?: string; type?: string }) => `${chave}:${valores?.title ?? ''}:${valores?.type ?? ''}`,
}))
vi.mock('next/navigation', () => ({ notFound: vi.fn() }))
vi.mock('@/lib/wordpress/foods', () => ({ getFoodsFeaturedInProduction: vi.fn() }))
vi.mock('@/lib/wordpress/artists', () => ({ getArtists: vi.fn() }))
vi.mock('@/lib/wordpress/vitrine', () => ({ getPrateleiraDaObra: vi.fn() }))
vi.mock('@/lib/wordpress/posts', () => ({ getPosts: vi.fn(), getCategories: vi.fn() }))
vi.mock('@/lib/guias/hub-lookup', () => ({ getHubsForProduction: vi.fn() }))
vi.mock('@/lib/tmdb/imagens', () => ({ getCenas: vi.fn() }))
vi.mock('@/lib/tmdb/episodios', () => ({ getEpisodios: vi.fn() }))
vi.mock('@/lib/tmdb/avaliacao', () => ({ getAvaliacao: vi.fn() }))
vi.mock('@/lib/tmdb/watchProviders', () => ({ getDisponibilidade: vi.fn() }))
vi.mock('@/lib/i18n/language-links', () => ({ buildLanguageLinks: vi.fn() }))
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: () => null }))
vi.mock('@/components/ui/WpEditContext', () => ({ WpEditSetter: () => null }))
vi.mock('@/components/productions/ProductionDetailPage', () => ({ ProductionDetailPage: () => null }))
vi.mock('@/components/i18n/LanguageSwitcher', () => ({ LanguageSwitcher: () => null }))
vi.mock('@/components/i18n/AvisoSemTraducao', () => ({ AvisoSemTraducao: () => null }))
vi.mock('@/components/analytics/RastreioDeRolagem', () => ({ RastreioDeRolagem: () => null }))

import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { buildProductionMetadata } from './ProductionRoute'

const PT = DEFAULT_LOCALE
const TEXTO_LONGO = `<p>${'Drama sul-coreano de dezesseis episódios sobre uma família. '.repeat(8)}</p>`

function obra(extra: Record<string, unknown> = {}) {
    return {
        id: 9,
        slug: 'crash-landing-on-you',
        status: 'publish',
        title: { rendered: 'Pousando no Amor' },
        content: { rendered: TEXTO_LONGO },
        excerpt: { rendered: '<p>Uma herdeira sul-coreana cai na Coreia do Norte.</p>' },
        featured_media: 0,
        meta: {},
        acf: { type: 'drama' },
        ...extra,
    }
}

beforeEach(() => {
    getProductionBySlug.mockReset()
})

describe('buildProductionMetadata', () => {
    it('devolve metadata vazia quando a produção não existe', async () => {
        getProductionBySlug.mockResolvedValue(null)
        expect(await buildProductionMetadata('nao-existe', PT)).toEqual({})
    })

    it('prefere título e descrição manuais do Rank Math e fica indexável', async () => {
        getProductionBySlug.mockResolvedValue(obra({ meta: { rank_math_title: 'Pousando no Amor: elenco', rank_math_description: 'SEO manual.' } }))
        const m = await buildProductionMetadata('crash-landing-on-you', PT)
        expect(m.title).toBe('Pousando no Amor: elenco')
        expect(m.description).toBe('SEO manual.')
        expect(m.robots).toBeUndefined()
    })

    it('sem Rank Math monta o título com o tipo da obra e usa o resumo como descrição', async () => {
        getProductionBySlug.mockResolvedValue(obra({ acf: { type: 'movie' } }))
        const m = await buildProductionMetadata('crash-landing-on-you', PT)
        expect(m.title).toBe('production.metaTitle:Pousando no Amor:production.type.movie::')
        expect(String(m.description)).toContain('herdeira sul-coreana')
    })

    it('tipo desconhecido cai em drama', async () => {
        getProductionBySlug.mockResolvedValue(obra({ acf: {} }))
        const m = await buildProductionMetadata('crash-landing-on-you', PT)
        expect(String(m.title)).toContain('production.type.drama')
    })

    it('em inglês sem tradução publicada serve a ficha em português fora do índice', async () => {
        getProductionBySlug.mockResolvedValue(obra({ translations: null }))
        const m = await buildProductionMetadata('crash-landing-on-you', 'en')
        expect(m.robots).toEqual({ index: false, follow: true })
    })

    it('em inglês com tradução de uma frase só (ficha fina) fica noindex, follow', async () => {
        getProductionBySlug.mockResolvedValue(obra({ translations: { en: { title: 'Crash Landing on You', content: '<p>A drama.</p>' } } }))
        const m = await buildProductionMetadata('crash-landing-on-you', 'en')
        expect(m.robots).toEqual({ index: false, follow: true })
    })

    it('em inglês com tradução completa entra no índice', async () => {
        getProductionBySlug.mockResolvedValue(obra({
            translations: { en: { title: 'Crash Landing on You', content: `<p>${'A South Korean drama of sixteen episodes about a family. '.repeat(8)}</p>` } },
        }))
        const m = await buildProductionMetadata('crash-landing-on-you', 'en')
        expect(m.robots).toBeUndefined()
    })
})
