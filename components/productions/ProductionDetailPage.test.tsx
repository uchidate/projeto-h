// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import type { WPArtist, WPProduction } from '@/lib/wordpress/types'

const m = vi.hoisted(() => ({ modelo: vi.fn(), magra: vi.fn(), pagina: vi.fn(), jsonLd: vi.fn(), barra: vi.fn() }))

vi.mock('next-intl', () => ({ useLocale: () => 'pt', useTranslations: () => (k: string, v?: object) => (v ? `${k} ${JSON.stringify(v)}` : k) }))
vi.mock('@/lib/profiles/productionProfile', () => ({ buildProductionProfileModel: m.modelo }))
vi.mock('@/lib/productions/fichaMagra', () => ({ producaoMagra: m.magra }))
vi.mock('@/components/providers/AdsProvider', () => ({ SemAnuncios: ({ children }: { children: ReactNode }) => <div data-testid="sem-anuncios">{children}</div> }))
vi.mock('@/components/productions/ProductionPageB', () => ({ ProductionPageB: (p: object) => { m.pagina(p); return null } }))
vi.mock('@/components/ui/ReadingBar', () => ({ ReadingBar: (p: object) => { m.barra(p); return null } }))
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: ({ data }: { data: object }) => { m.jsonLd(data); return null } }))

import { ProductionDetailPage } from './ProductionDetailPage'

const modelo = (extra: Record<string, unknown> = {}) => ({
    title: 'Obra', acf: {}, genres: [], platforms: [], synopsis: '', schemaType: 'TVSeries',
    galleryUrls: [], backdropUrl: undefined, facts: [], hasTrailer: false, primaryPlatform: undefined, releaseLabel: undefined, ...extra,
})
const producao = { id: 1, slug: 'obra', title: { rendered: 'Obra' }, acf: {} } as unknown as WPProduction
const elenco = [{ id: 2, slug: 'iu', title: { rendered: 'IU' } }] as unknown as WPArtist[]
const montar = (props: Record<string, unknown> = {}) => render(<ProductionDetailPage production={producao} {...props} /> as ReactElement)

beforeEach(() => {
    m.modelo.mockReset().mockReturnValue(modelo())
    m.magra.mockReset().mockReturnValue(false)
    m.pagina.mockReset()
    m.jsonLd.mockReset()
    m.barra.mockReset()
})
afterEach(cleanup)

describe('ProductionDetailPage', () => {
    it('ficha magra sai sem anúncios', () => {
        m.magra.mockReturnValue(true)
        montar()
        expect(screen.getByTestId('sem-anuncios')).toBeTruthy()
    })

    it('ficha vazia mantém só sinopse e perguntas, com a resposta genérica', () => {
        montar()
        expect(screen.queryByTestId('sem-anuncios')).toBeNull()
        const { faqItems } = m.pagina.mock.calls[0][0]
        expect(faqItems).toHaveLength(1)
        expect(faqItems[0].answer).toContain('production.faq.aboutA')
        expect(m.barra.mock.calls[0][0].pageAnchors.map((a: { href: string }) => a.href)).toEqual(['#sinopse', '#faq'])
        expect(m.jsonLd.mock.calls[0][0]).toMatchObject({ '@type': 'TVSeries', actor: undefined, datePublished: undefined })
    })

    it('ficha completa liga todas as âncoras, limita a cinco perguntas e declara o elenco', () => {
        m.modelo.mockReturnValue(modelo({
            synopsis: 'Resumo', acf: { year: 2019, episodes: 16 }, genres: [{ name: 'Drama' }], platforms: [{ name: 'Netflix' }],
            primaryPlatform: { name: 'Netflix' }, releaseLabel: '2019', hasTrailer: true, galleryUrls: ['g'], facts: ['f'], backdropUrl: 'https://exemplo.test/b.jpg',
        }))
        montar({ cast: elenco, related: [producao], relatedPosts: [{ id: 3 }] })
        const { faqItems } = m.pagina.mock.calls[0][0]
        expect(faqItems).toHaveLength(5)
        expect(faqItems[0].answer).toBe('Resumo')
        expect(m.barra.mock.calls[0][0].pageAnchors).toHaveLength(8)
        expect(m.barra.mock.calls[0][0].tagLabel).toBe('Drama')
        const dados = m.jsonLd.mock.calls[0][0]
        expect(dados).toMatchObject({ datePublished: '2019', numberOfEpisodes: 16, image: 'https://exemplo.test/b.jpg', genre: ['Drama'] })
        expect(dados.actor[0].name).toBe('IU')
        expect(dados.actor[0].url).toMatch(/\/artists\/iu$/)
    })
})
