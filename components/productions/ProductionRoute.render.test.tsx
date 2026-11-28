import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
    producao: vi.fn(), relacionadas: vi.fn(), generos: vi.fn(), comidas: vi.fn(), artistas: vi.fn(),
    prateleira: vi.fn(), posts: vi.fn(), categorias: vi.fn(), cenas: vi.fn(), disponibilidade: vi.fn(),
    idiomas: vi.fn(), streaming: vi.fn(),
    Detalhe: () => null, Migalhas: () => null, Aviso: () => null, Idiomas: () => null,
}))

vi.mock('@/lib/tmdb/streaming', async (original) => ({ ...await original<typeof import('@/lib/tmdb/streaming')>(), getStreamingTopShows: m.streaming }))

vi.mock('@/lib/wordpress/productions', () => ({ getProductionBySlug: m.producao, getSmartRelatedProductions: m.relacionadas, getProductionGenres: m.generos }))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (chave: string) => chave }))
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('404') } }))
vi.mock('@/lib/wordpress/foods', () => ({ getFoodsFeaturedInProduction: m.comidas }))
vi.mock('@/lib/wordpress/artists', () => ({ getArtists: m.artistas }))
vi.mock('@/lib/wordpress/vitrine', () => ({ getPrateleiraDaObra: m.prateleira }))
vi.mock('@/lib/wordpress/posts', () => ({ getPosts: m.posts, getCategories: m.categorias }))
vi.mock('@/lib/guias/hub-lookup', () => ({ getHubsForProduction: () => [] }))
vi.mock('@/lib/tmdb/imagens', () => ({ getCenas: m.cenas }))
vi.mock('@/lib/tmdb/episodios', () => ({ getEpisodios: async () => null }))
vi.mock('@/lib/tmdb/avaliacao', () => ({ getAvaliacao: async () => null }))
vi.mock('@/lib/tmdb/watchProviders', () => ({ getDisponibilidade: m.disponibilidade }))
vi.mock('@/lib/i18n/language-links', () => ({ buildLanguageLinks: m.idiomas }))
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: m.Migalhas }))
vi.mock('@/components/ui/WpEditContext', () => ({ WpEditSetter: () => null }))
vi.mock('@/components/productions/ProductionDetailPage', () => ({ ProductionDetailPage: m.Detalhe }))
vi.mock('@/components/i18n/LanguageSwitcher', () => ({ LanguageSwitcher: m.Idiomas }))
vi.mock('@/components/i18n/AvisoSemTraducao', () => ({ AvisoSemTraducao: m.Aviso }))
vi.mock('@/components/analytics/RastreioDeRolagem', () => ({ RastreioDeRolagem: () => null }))

import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { ProductionRoute } from './ProductionRoute'

function obra(extra: Record<string, unknown> = {}) {
    return {
        id: 9,
        slug: 'obra',
        title: { rendered: 'Obra' },
        content: { rendered: '<p>Texto.</p>' },
        excerpt: { rendered: '' },
        meta: {},
        acf: { type: 'drama', tmdb_id: 1 },
        ...extra,
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function renderizar(locale: Locale = DEFAULT_LOCALE) {
    const raiz = await ProductionRoute({ slug: 'obra', locale }) as ReactElement<{ children: ReactNode[] }>
    const filhos = raiz.props.children.filter(isValidElement) as ReactElement<any>[]
    const props = (tipo: unknown) => filhos.find((f) => f.type === tipo)?.props
    return { detalhe: props(m.Detalhe)!, migalhas: props(m.Migalhas)!, aviso: props(m.Aviso), idiomas: props(m.Idiomas) }
}

beforeEach(() => {
    vi.resetAllMocks()
    m.producao.mockResolvedValue(obra())
    m.relacionadas.mockResolvedValue([])
    m.generos.mockResolvedValue([])
    m.comidas.mockResolvedValue([])
    m.artistas.mockImplementation(async ({ slug }: { slug: string }) => ({ items: slug.split(',').reverse().map((s, i) => ({ id: i + 1, slug: s })) }))
    m.prateleira.mockResolvedValue({ produtos: [{ id: 1 }], motivos: { 1: 'elenco' } })
    m.posts.mockResolvedValue({ items: [{ id: 5 }] })
    m.categorias.mockResolvedValue([])
    m.cenas.mockResolvedValue([])
    m.disponibilidade.mockResolvedValue({ onde: 'tmdb' })
    m.idiomas.mockResolvedValue([])
    m.streaming.mockResolvedValue({})
})

describe('ProductionRoute', () => {
    it('404 para produção inexistente ou adulta', async () => {
        m.producao.mockResolvedValue(null)
        await expect(renderizar()).rejects.toThrow('404')
        m.producao.mockResolvedValue(obra({ acf: { adult_content: true } }))
        await expect(renderizar()).rejects.toThrow('404')
    })

    it('mantém a ordem do elenco da ficha e descarta quem não tem perfil', async () => {
        m.producao.mockResolvedValue(obra({ production_cast: [{ slug: 'a', role: '' }, { slug: 'b', role: '' }, { slug: 'sem-ficha', role: '' }] }))
        m.artistas.mockResolvedValue({ items: [{ id: 2, slug: 'b' }, { id: 1, slug: 'a' }] })
        const { detalhe } = await renderizar()
        expect(detalhe.cast.map((a: any) => a.slug)).toEqual(['a', 'b'])
        expect(m.prateleira).toHaveBeenCalledWith(expect.objectContaining({ artistIds: [2, 1], contexto: 'producao:obra' }))
    })

    it('sem elenco detalhado usa os slugs de artistas, e sem nenhum não consulta', async () => {
        m.producao.mockResolvedValue(obra({ artist_slugs: ['x'] }))
        expect((await renderizar()).detalhe.cast.map((a: any) => a.slug)).toEqual(['x'])
        m.artistas.mockClear()
        m.producao.mockResolvedValue(obra())
        expect((await renderizar()).detalhe.cast).toEqual([])
        expect(m.artistas).not.toHaveBeenCalled()
    })

    it('elenco com mais de 100 nomes é buscado em lotes que o WordPress aceita', async () => {
        const nomes = Array.from({ length: 230 }, (_, i) => `a${i}`)
        m.producao.mockResolvedValue(obra({ artist_slugs: nomes }))
        const { detalhe } = await renderizar()
        expect(m.artistas.mock.calls.map(([q]) => q.perPage)).toEqual([100, 100, 30])
        expect(detalhe.cast.map((a: any) => a.slug)).toEqual(nomes)
    })

    it('completa a galeria com cenas do TMDB só quando a ficha não tem fotos', async () => {
        m.cenas.mockResolvedValue(['cena.jpg'])
        expect((await renderizar()).detalhe.production.acf.gallery_urls).toEqual(['cena.jpg'])
        m.cenas.mockClear()
        m.producao.mockResolvedValue(obra({ acf: { gallery_urls: ['nossa.jpg'] } }))
        expect((await renderizar()).detalhe.production.acf.gallery_urls).toEqual(['nossa.jpg'])
        expect(m.cenas).not.toHaveBeenCalled()
    })

    it('só consulta onde assistir quando o catálogo não tem plataforma', async () => {
        expect((await renderizar()).detalhe.disponibilidade).toEqual({ onde: 'tmdb' })
        m.disponibilidade.mockClear()
        m.producao.mockResolvedValue(obra({ acf: { platforms: ['netflix'] } }))
        expect((await renderizar()).detalhe.disponibilidade).toBeNull()
        expect(m.disponibilidade).not.toHaveBeenCalled()
    })

    it('em português mostra loja e artigos relacionados, sem aviso', async () => {
        const { detalhe, aviso, idiomas } = await renderizar()
        expect(detalhe.shopProducts).toEqual([{ id: 1 }])
        expect(detalhe.shopMotivos).toEqual({ 1: 'elenco' })
        expect(detalhe.relatedPosts).toEqual([{ id: 5 }])
        expect(aviso).toBeUndefined()
        expect(idiomas).toBeUndefined()
    })

    it('em outro idioma sem tradução avisa, oferece os idiomas e não leva loja nem artigos', async () => {
        m.idiomas.mockResolvedValue([{ href: '/ja/x' }])
        const { detalhe, aviso, idiomas } = await renderizar('en')
        expect(aviso).toMatchObject({ locale: 'en', hrefOriginal: expect.stringContaining('obra') })
        expect(idiomas?.links).toHaveLength(1)
        expect(detalhe.shopProducts).toEqual([])
        expect(detalhe.relatedPosts).toEqual([])
        expect(m.prateleira).not.toHaveBeenCalled()
    })

    it('o bloco de streaming sai sem a própria obra e sem o que já é recomendado', async () => {
        m.relacionadas.mockResolvedValue([{ id: 3, slug: 'parecida', title: { rendered: 'P' } }])
        m.streaming.mockResolvedValue({ netflix_br: ['obra', 'parecida', 'a', 'b', 'c'].map(s => ({ tmdbId: s, title: s, productionSlug: s })) })
        const { detalhe } = await renderizar()
        expect(detalhe.emAlta.netflix_br.map((s: any) => s.productionSlug)).toEqual(['a', 'b', 'c'])
    })

    it('falha no streaming não derruba a ficha, e fora do português nem se consulta', async () => {
        m.streaming.mockRejectedValue(new Error('fora do ar'))
        expect((await renderizar()).detalhe.emAlta).toEqual({})
        m.streaming.mockClear()
        expect((await renderizar('en')).detalhe.emAlta).toEqual({})
        expect(m.streaming).not.toHaveBeenCalled()
    })

    it('a trilha de navegação usa o primeiro gênero conhecido', async () => {
        m.producao.mockResolvedValue(obra({ production_genre: [99, 7] }))
        m.generos.mockResolvedValue([{ id: 7, slug: 'romance', name: 'Romance' }])
        const itens = (await renderizar()).migalhas.data.itemListElement
        expect(itens).toHaveLength(4)
        expect(JSON.stringify(itens[2])).toContain('?genero=romance')
    })
})
