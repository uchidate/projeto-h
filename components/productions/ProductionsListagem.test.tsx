import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config'

// Cobre o que a /productions decide: ordenação, tipo válido, filtros, faixas da página inicial
// (Em alta, plataformas, gêneros sem pôster repetido, loja), lista vazia lançando (ISR), 404 e metadados.
const getProductions = vi.fn()
const getProductionGenres = vi.fn()
const getProductionPlatforms = vi.fn()
const getFeaturedStoreProducts = vi.fn()
const getSingleGenreHubSlug = vi.fn()
const notFound = vi.fn(() => { throw new Error('NEXT_NOT_FOUND') })

vi.mock('@/lib/wordpress/productions', () => ({
    getProductions: (...a: unknown[]) => getProductions(...a),
    getProductionGenres: (...a: unknown[]) => getProductionGenres(...a),
    getProductionPlatforms: (...a: unknown[]) => getProductionPlatforms(...a),
}))
vi.mock('@/lib/wordpress/store', () => ({ getFeaturedStoreProducts: (...a: unknown[]) => getFeaturedStoreProducts(...a) }))
vi.mock('@/lib/wordpress/store-ranking', () => ({ ordenarPrateleira: (p: unknown[]) => p }))
vi.mock('@/lib/guias/hub-lookup', () => ({ getSingleGenreHubSlug: (...a: unknown[]) => getSingleGenreHubSlug(...a) }))
vi.mock('@/lib/productions/generos', () => ({ generosNoIdioma: (g: unknown[]) => g }))
vi.mock('@/components/features/LocalizedCatalog', () => ({ defaultCatalogLanguages: () => ({}) }))
vi.mock('@/lib/i18n/entity-translation', () => ({
    hasLocale: (e: { traduzido?: boolean }) => e.traduzido === true,
    localizeEntity: (e: object) => ({ ...e, localizado: true }),
}))
vi.mock('next/navigation', () => ({ notFound: () => notFound() }))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (k: string) => k }))
vi.mock('@/components/seo/PageBreadcrumb', () => ({ PageBreadcrumb: () => null }))
vi.mock('@/components/productions/ProductionsPage', () => ({ ProductionsPage: () => null }))

import { ProductionsPage } from '@/components/productions/ProductionsPage'
import { ProductionsListagem, metadataProductionsListagem, type SearchParams } from './ProductionsListagem'

const OUTRO = ACTIVE_LOCALES.find((l) => l !== DEFAULT_LOCALE)

type P = { id: number; traduzido?: boolean }
let seq = 0
const producao = (extra: Partial<P> = {}): P => ({ id: ++seq, ...extra })
const lista = (items: P[], totalPages = 1) => ({ items, total: items.length, totalPages })

type Props = Record<string, unknown> & {
    productions: P[]; emAlta: P[]; currentOrder: string; currentType?: string; currentPage: number
    plataformasTop: { slug: string }[]; generosTop: { slug: string; nome: string; fotos: P[] }[]; shopProducts: unknown[]
    genres: unknown[]; platforms: unknown[]
}

async function propsDa(params: Awaited<SearchParams> = {}, locale = DEFAULT_LOCALE) {
    const el = (await ProductionsListagem({ searchParams: Promise.resolve(params), locale })) as ReactElement
    const filhos = (el.props as { children: ReactElement[] }).children
    return (filhos.find((c) => c && c.type === ProductionsPage) as ReactElement).props as Props
}
const meta = (params: Awaited<SearchParams> = {}, locale = DEFAULT_LOCALE) => metadataProductionsListagem({ searchParams: Promise.resolve(params), locale })

beforeEach(() => {
    for (const m of [getProductions, getProductionGenres, getProductionPlatforms, getFeaturedStoreProducts, getSingleGenreHubSlug, notFound]) m.mockReset()
    notFound.mockImplementation(() => { throw new Error('NEXT_NOT_FOUND') })
    getProductions.mockResolvedValue(lista([producao(), producao()]))
    getProductionGenres.mockResolvedValue([])
    getProductionPlatforms.mockResolvedValue([])
    getFeaturedStoreProducts.mockResolvedValue([])
    getSingleGenreHubSlug.mockReturnValue(undefined)
})

// A consulta principal é a de 24 por página (as faixas de gênero usam 12).
const consultaPrincipal = () => getProductions.mock.calls.map(([o]) => o).find((o) => o.perPage === 24)

describe('ProductionsListagem — consulta', () => {
    it('ordenação: recentes = data decrescente; A–Z = título crescente; o resto = relevância', async () => {
        const casos: [string | undefined, string, string][] = [
            [undefined, 'relevance', 'desc'], ['recent', 'date', 'desc'], ['az', 'title', 'asc'], ['lixo', 'relevance', 'desc'],
        ]
        for (const [order, orderby, ordem] of casos) {
            getProductions.mockClear()
            await propsDa({ order })
            expect(consultaPrincipal(), String(order)).toMatchObject({ orderby, order: ordem, excludeAdult: true })
        }
    })

    it('tipo só vale se for drama, movie, special ou variety', async () => {
        for (const type of ['drama', 'movie', 'special', 'variety']) {
            getProductions.mockClear()
            expect((await propsDa({ type })).currentType).toBe(type)
            expect(consultaPrincipal()?.type).toBe(type)
        }
        getProductions.mockClear()
        expect((await propsDa({ type: 'anime' })).currentType).toBeUndefined()
        expect(consultaPrincipal()?.type).toBeUndefined()
    })

    it('filtros e busca viram parâmetros; a ordem padrão exibida é "trending"', async () => {
        const p = await propsDa({ genre: 'romance', platform: 'netflix', search: 'amor', page: '1' })
        expect(consultaPrincipal()).toMatchObject({ genre: 'romance', platform: 'netflix', search: 'amor', page: 1 })
        expect(p.currentOrder).toBe('trending')
        expect((await propsDa({ order: 'az' })).currentOrder).toBe('az')
    })
})

describe('ProductionsListagem — erros e páginas', () => {
    it('catálogo vazio sem filtro na página 1 lança, para preservar o ISR', async () => {
        getProductions.mockResolvedValue(lista([]))
        await expect(propsDa()).rejects.toThrow(/Catálogo de produções retornou vazio/)
    })

    it('vazio com filtro, ou fora da página 1, não lança', async () => {
        getProductions.mockResolvedValue(lista([]))
        expect((await propsDa({ search: 'zzz' })).productions).toEqual([])
        expect((await propsDa({ genre: 'x' })).productions).toEqual([])
    })

    it('página além do fim vira 404', async () => {
        getProductions.mockResolvedValue(lista([producao()], 2))
        await expect(propsDa({ page: '4' })).rejects.toThrow('NEXT_NOT_FOUND')
    })
})

describe('ProductionsListagem — faixas da página inicial', () => {
    const generos = [
        { slug: 'drama', name: 'Drama', count: 50 },
        { slug: 'comedia', name: 'Comédia', count: 40 },
        { slug: 'raro', name: 'Raro', count: 1 },
    ]

    it('Em alta = as 16 primeiras; plataformas = as 6 maiores', async () => {
        getProductions.mockResolvedValue(lista(Array.from({ length: 20 }, () => producao())))
        getProductionPlatforms.mockResolvedValue(Array.from({ length: 8 }, (_, i) => ({ slug: `p${i}`, name: `P${i}`, count: i })))
        const p = await propsDa()
        expect(p.emAlta).toHaveLength(16)
        expect(p.plataformasTop.map((x) => x.slug)).toEqual(['p7', 'p6', 'p5', 'p4', 'p3', 'p2'])
    })

    it('pôster não se repete entre as faixas de gênero nem com o "Em alta"', async () => {
        const emAlta = [producao(), producao()]
        const [a, b, c, d, e] = [producao(), producao(), producao(), producao(), producao()]
        getProductionGenres.mockResolvedValue(generos)
        getProductions.mockImplementation(async (o) => {
            if (o.perPage === 24) return lista(emAlta)
            if (o.genre === 'drama') return lista([emAlta[0], a, b, c])
            if (o.genre === 'comedia') return lista([b, c, d, e])
            return lista([])
        })
        const p = await propsDa()
        // drama: tira o que já está em Em alta (emAlta[0]) → a, b, c; comédia: tira b e c → d, e
        expect(p.generosTop.map((g) => [g.slug, g.fotos.map((f) => f.id)])).toEqual([
            ['drama', [a.id, b.id, c.id]],
            ['comedia', [d.id, e.id]],
        ])
    })

    it('gênero com menos de 2 pôsteres livres some da faixa', async () => {
        getProductionGenres.mockResolvedValue(generos)
        getProductions.mockImplementation(async (o) => (o.perPage === 24 ? lista([producao()]) : lista([producao()])))
        expect((await propsDa()).generosTop).toEqual([])
    })

    it('falha na busca de um gênero não derruba a lista', async () => {
        getProductionGenres.mockResolvedValue(generos)
        getProductions.mockImplementation(async (o) => {
            if (o.perPage === 24) return lista([producao()])
            throw new Error('WP')
        })
        const p = await propsDa()
        expect(p.productions).toHaveLength(1)
        expect(p.generosTop).toEqual([])
    })

    it('loja de drama aparece só na página inicial em português', async () => {
        getFeaturedStoreProducts.mockResolvedValue([{ id: 1 }])
        expect((await propsDa()).shopProducts).toHaveLength(1)
        expect(getFeaturedStoreProducts).toHaveBeenCalledWith(8, 'drama')
    })

    it('com filtro, busca, tipo, ordem ou página 2 as faixas somem', async () => {
        getProductions.mockResolvedValue(lista([producao()], 3))
        getProductionGenres.mockResolvedValue(generos)
        getFeaturedStoreProducts.mockResolvedValue([{ id: 1 }])
        for (const params of [{ genre: 'x' }, { platform: 'x' }, { type: 'drama' }, { search: 'x' }, { order: 'recent' }, { page: '2' }]) {
            const p = await propsDa(params)
            expect(p.emAlta, JSON.stringify(params)).toEqual([])
            expect(p.generosTop).toEqual([])
            expect(p.plataformasTop).toEqual([])
            expect(p.shopProducts).toEqual([])
        }
    })
})

describe.skipIf(!OUTRO)('ProductionsListagem — outro idioma', () => {
    it('só produções traduzidas, localizadas; sem loja; consulta leva o locale', async () => {
        getProductions.mockResolvedValue(lista([producao({ traduzido: true }), producao({ traduzido: false })]))
        const p = await propsDa({}, OUTRO!)
        expect(p.productions).toHaveLength(1)
        expect(p.productions[0]).toMatchObject({ localizado: true })
        expect(p.shopProducts).toEqual([])
        expect(getFeaturedStoreProducts).not.toHaveBeenCalled()
        expect(consultaPrincipal()).toMatchObject({ locale: OUTRO })
    })

    it('lista traduzida vazia não lança (idioma novo)', async () => {
        getProductions.mockResolvedValue(lista([]))
        expect((await propsDa({}, OUTRO!)).productions).toEqual([])
    })
})

describe('metadataProductionsListagem', () => {
    it('sem filtro: indexável e canônica /productions', async () => {
        const m = await meta()
        expect(m.robots).toBeUndefined()
        expect(String(m.alternates?.canonical)).toMatch(/\/productions$/)
    })

    it('busca, gênero, plataforma, tipo e ordem não são indexados', async () => {
        for (const p of [{ search: 'x' }, { genre: 'x' }, { platform: 'x' }, { type: 'drama' }, { order: 'az' }]) {
            expect((await meta(p)).robots, JSON.stringify(p)).toBeDefined()
        }
    })

    it('gênero puro com guia editorial aponta a canônica para o guia e não consulta o WP', async () => {
        getSingleGenreHubSlug.mockReturnValue('melhores-doramas-de-romance')
        const m = await meta({ genre: 'romance' })
        expect(String(m.alternates?.canonical)).toMatch(/\/guias\/melhores-doramas-de-romance$/)
        expect(getProductions).not.toHaveBeenCalled()
    })

    it('gênero combinado com plataforma ou página 2 não vai para o guia', async () => {
        getSingleGenreHubSlug.mockReturnValue('melhores-doramas-de-romance')
        for (const p of [{ genre: 'romance', platform: 'netflix' }, { genre: 'romance', type: 'drama' }, { genre: 'romance', page: '2' }]) {
            getProductions.mockClear()
            const m = await meta(p)
            expect(String(m.alternates?.canonical), JSON.stringify(p)).not.toContain('/guias/')
            expect(getProductions).toHaveBeenCalled()
        }
    })

    it('em outro idioma o guia (só PT) nunca é a canônica', async () => {
        if (!OUTRO) return
        getSingleGenreHubSlug.mockReturnValue('melhores-doramas-de-romance')
        const m = await meta({ genre: 'romance' }, OUTRO)
        expect(String(m.alternates?.canonical)).not.toContain('/guias/')
    })

    it('página 2 leva prev e next e canônica com page=2', async () => {
        getProductions.mockResolvedValue(lista([producao()], 3))
        const m = await meta({ page: '2' })
        const { prev, next } = m.alternates as { prev?: string; next?: string }
        expect(String(m.alternates?.canonical)).toContain('page=2')
        expect(String(next)).toContain('page=3')
        expect(prev).toBeDefined()
    })
})
