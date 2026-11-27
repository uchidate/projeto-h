import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config'

// Cobre o que a rota da listagem do blog decide: qual consulta fazer (guias de compra fora da lista
// sem filtro), "Mais lidos", destaque, vitrine de loja, 404/erro de página, categorias por idioma
// e os metadados (canonical, paginação, noindex em filtro, hreflang).
const getPosts = vi.fn()
const getCategories = vi.fn()
const getSidebarPosts = vi.fn()
const getFeaturedStoreProducts = vi.fn()
const carregarLojaDoTema = vi.fn()
const getMapaDeGuias = vi.fn()
const maisLidos = vi.fn()
const destaqueRecente = vi.fn()
const notFound = vi.fn(() => { throw new Error('NEXT_NOT_FOUND') })

vi.mock('@/lib/wordpress/posts', () => ({
    getPosts: (...a: unknown[]) => getPosts(...a),
    getCategories: (...a: unknown[]) => getCategories(...a),
    getSidebarPosts: (...a: unknown[]) => getSidebarPosts(...a),
}))
vi.mock('@/lib/wordpress/store', () => ({ getFeaturedStoreProducts: (...a: unknown[]) => getFeaturedStoreProducts(...a) }))
vi.mock('@/lib/wordpress/store-ranking', () => ({ ordenarPrateleira: (p: unknown[]) => p }))
vi.mock('@/lib/blog/lojaDoTema', () => ({ carregarLojaDoTema: (...a: unknown[]) => carregarLojaDoTema(...a) }))
vi.mock('@/lib/blog/categoriaLoja', () => ({ CATEGORIAS_COM_LOJA: { 'k-beauty': { categoriasLoja: ['kbeauty'], industria: 'x', rotulo: 'K-Beauty' } } }))
vi.mock('@/lib/blog/guiasDeCompra', () => ({ idsGuiaDeCompra: () => [90, 91] }))
vi.mock('@/lib/blog/destaque', () => ({
    destaqueRecente: (...a: unknown[]) => destaqueRecente(...a),
    maisLidos: (...a: unknown[]) => maisLidos(...a),
    candidatosDestaque: () => [],
    perenes: () => [],
}))
vi.mock('@/lib/guias/i18n', () => ({ getMapaDeGuias: (...a: unknown[]) => getMapaDeGuias(...a) }))
vi.mock('next/navigation', () => ({ notFound: () => notFound() }))
vi.mock('next-intl/server', () => ({
    getTranslations: async () => Object.assign((k: string) => k, { has: (k: string) => k === 'k-pop' }),
}))
vi.mock('@/components/seo/PageBreadcrumb', () => ({ PageBreadcrumb: () => null }))
vi.mock('@/components/blog/BlogPage', () => ({ BlogPage: () => null }))

import { BlogPage } from '@/components/blog/BlogPage'
import { BlogListagem, metadataBlogListagem, type SearchParams } from './BlogListagem'

const OUTRO = ACTIVE_LOCALES.find((l) => l !== DEFAULT_LOCALE)

type Posts = { id: number; acf?: { views?: number } }
const posts = (n: number, inicio = 1): Posts[] => Array.from({ length: n }, (_, i) => ({ id: inicio + i }))
const resultado = (items: Posts[], totalPages = 1, total = items.length) => ({ items, total, totalPages })

type Props = {
    locale?: string
    posts: Posts[]
    total: number
    totalPages: number
    categories: { slug: string; name: string; count: number }[]
    currentPage: number
    currentCategory?: string
    order?: string
    tipo?: string
    guias: { slug: string }[]
    shopProducts: unknown[]
    destaques: Posts[]
    categoriaLoja?: unknown
}

async function propsDa(params: Awaited<SearchParams> = {}, locale = DEFAULT_LOCALE) {
    const el = (await BlogListagem({ searchParams: Promise.resolve(params), locale })) as ReactElement
    const filhos = (el.props as { children: ReactElement[] }).children
    return (filhos.find((c) => c && c.type === BlogPage) as ReactElement).props as Props
}

const meta = (params: Awaited<SearchParams> = {}, locale = DEFAULT_LOCALE) =>
    metadataBlogListagem({ searchParams: Promise.resolve(params), locale })

beforeEach(() => {
    for (const m of [getPosts, getCategories, getSidebarPosts, getFeaturedStoreProducts, carregarLojaDoTema, getMapaDeGuias, maisLidos, destaqueRecente, notFound]) m.mockReset()
    notFound.mockImplementation(() => { throw new Error('NEXT_NOT_FOUND') })
    getPosts.mockResolvedValue(resultado(posts(3)))
    getCategories.mockResolvedValue([{ id: 1, slug: 'k-pop', name: 'K-Pop', count: 9 }, { id: 2, slug: 'k-drama', name: 'K-Drama', count: 4 }])
    getSidebarPosts.mockResolvedValue([])
    getFeaturedStoreProducts.mockResolvedValue([])
    carregarLojaDoTema.mockResolvedValue({ marcas: [] })
    getMapaDeGuias.mockResolvedValue({ hubs: [], localizar: () => null, slugPublico: () => null })
    maisLidos.mockReturnValue([])
    destaqueRecente.mockReturnValue(null)
})

describe('BlogListagem — consulta da lista', () => {
    it('sem filtro tira os guias de compra da lista e da barra lateral', async () => {
        await propsDa()
        expect(getPosts).toHaveBeenCalledWith(expect.objectContaining({ page: 1, perPage: 13, categoriesExclude: [90, 91] }))
        expect(getSidebarPosts).toHaveBeenCalledWith(1, 13, [90, 91], undefined)
    })

    it('?tipo=guias traz só os guias de compra', async () => {
        const p = await propsDa({ tipo: 'guias' })
        expect(getPosts).toHaveBeenCalledWith(expect.objectContaining({ categoryIds: [90, 91] }))
        expect(p.tipo).toBe('guias')
        expect(getSidebarPosts).toHaveBeenCalledWith(1, 13, [], undefined)
    })

    it('com categoria, nada é retirado (leitor pediu um recorte)', async () => {
        await propsDa({ category: 'k-pop' })
        const chamada = getPosts.mock.calls.find(([o]) => o.category === 'k-pop')?.[0]
        expect(chamada.categoriesExclude).toBeUndefined()
        expect(chamada.categoryIds).toBeUndefined()
    })

    it('busca ordena por relevância, não por data', async () => {
        await propsDa({ search: 'round 6' })
        expect(getPosts).toHaveBeenCalledWith(expect.objectContaining({ search: 'round 6', orderby: 'relevance' }))
    })

    it('só a lista sem filtro carrega a base do acervo (8 páginas de 100 no máximo)', async () => {
        getPosts.mockImplementation(async (o) => (o.perPage === 100 ? resultado(posts(2), 12) : resultado(posts(3))))
        await propsDa()
        expect(getPosts.mock.calls.filter(([o]) => o.perPage === 100)).toHaveLength(8)
        getPosts.mockClear()
        await propsDa({ category: 'k-pop' })
        expect(getPosts.mock.calls.filter(([o]) => o.perPage === 100)).toHaveLength(0)
    })

    it('falha ao carregar a base não derruba a lista', async () => {
        getPosts.mockImplementation(async (o) => { if (o.perPage === 100) throw new Error('WP'); return resultado(posts(3)) })
        const p = await propsDa()
        expect(p.posts).toHaveLength(3)
    })
})

describe('BlogListagem — páginas e erros', () => {
    it('lista vazia sem filtro na página 1 lança, para preservar o ISR anterior', async () => {
        getPosts.mockResolvedValue(resultado([]))
        await expect(propsDa()).rejects.toThrow(/WP indisponível/)
    })

    it('categoria sem artigo não lança: mostra a lista vazia', async () => {
        getPosts.mockResolvedValue(resultado([]))
        const p = await propsDa({ category: 'k-pop' })
        expect(p.posts).toEqual([])
    })

    it('página além do fim vira 404', async () => {
        getPosts.mockResolvedValue(resultado(posts(3), 2))
        await expect(propsDa({ page: '5' })).rejects.toThrow('NEXT_NOT_FOUND')
    })

    it('em categoria com loja (K-beauty), a 1ª página carrega as marcas; na 2ª não', async () => {
        getPosts.mockResolvedValue(resultado(posts(3), 3))
        const p1 = await propsDa({ category: 'k-beauty' })
        expect(carregarLojaDoTema).toHaveBeenCalledWith(expect.anything(), 'listagem:blog:k-beauty')
        expect(p1.categoriaLoja).toEqual({ marcas: [] })
        carregarLojaDoTema.mockClear()
        await propsDa({ category: 'k-beauty', page: '2' })
        expect(carregarLojaDoTema).not.toHaveBeenCalled()
    })
})

describe('BlogListagem — Mais lidos', () => {
    beforeEach(() => {
        maisLidos.mockReturnValue(posts(30))
        getPosts.mockResolvedValue(resultado(posts(3), 4))
    })

    it('?order=lidos pagina a base ordenada em 12 por página', async () => {
        const p = await propsDa({ order: 'lidos', page: '2' })
        expect(p.order).toBe('lidos')
        expect(p.posts.map((x) => x.id)).toEqual(posts(12, 13).map((x) => x.id))
        expect(p.total).toBe(30)
        expect(p.totalPages).toBe(3)
    })

    it('página além do total de "Mais lidos" vira 404', async () => {
        await expect(propsDa({ order: 'lidos', page: '4' })).rejects.toThrow('NEXT_NOT_FOUND')
    })

    it.skipIf(!OUTRO)('em outro idioma a ordem por leitura é ignorada (só o PT acumula views)', async () => {
        const p = await propsDa({ order: 'lidos' }, OUTRO!)
        expect(p.order).toBeUndefined()
        expect(maisLidos).not.toHaveBeenCalled()
    })
})

describe('BlogListagem — destaque, loja e guias', () => {
    it('na página inicial em PT mostra a prateleira de loja; com filtro ou página 2, não', async () => {
        getFeaturedStoreProducts.mockResolvedValue([{ id: 1 }, { id: 2 }])
        getPosts.mockResolvedValue(resultado(posts(3), 3))
        expect((await propsDa()).shopProducts).toHaveLength(2)
        expect((await propsDa({ category: 'k-pop' })).shopProducts).toEqual([])
        expect((await propsDa({ page: '2' })).shopProducts).toEqual([])
    })

    it('o destaque recente vem da primeira página sem filtro', async () => {
        getPosts.mockResolvedValue(resultado(posts(3)))
        destaqueRecente.mockReturnValue({ id: 2 })
        const p = await propsDa()
        expect(p.destaques.map((x) => x.id)).toEqual([2])
        expect((await propsDa({ category: 'k-pop' })).destaques).toEqual([])
    })

    it('guias de gênero: no máximo 6 e só os de produções com gênero', async () => {
        const hub = (n: number, genre?: string) => ({ kind: 'productions', slug: `g${n}`, filter: genre ? { genre } : {} })
        getMapaDeGuias.mockResolvedValue({
            hubs: [hub(1, 'a'), hub(2), hub(3, 'b'), hub(4, 'c'), hub(5, 'd'), hub(6, 'e'), hub(7, 'f'), hub(8, 'g'), { kind: 'agency', slug: 'x', filter: { genre: 'z' } }],
            localizar: () => null, slugPublico: () => null,
        })
        const p = await propsDa()
        expect(p.guias.map((g) => g.slug)).toEqual(['g1', 'g3', 'g4', 'g5', 'g6', 'g7'])
    })

    it.skipIf(!OUTRO)('em outro idioma só entram guias traduzidos e atualizados, com o slug público do idioma', async () => {
        const hub = (slug: string) => ({ kind: 'productions', slug, filter: { genre: 'x' } })
        getMapaDeGuias.mockResolvedValue({
            hubs: [hub('a'), hub('b'), hub('c')],
            localizar: (h: { slug: string }) => (h.slug === 'a' ? { ...h, desatualizado: false } : h.slug === 'b' ? { ...h, desatualizado: true } : null),
            slugPublico: (slug: string) => `${slug}-traduzido`,
        })
        const p = await propsDa({}, OUTRO!)
        expect(p.guias.map((g) => g.slug)).toEqual(['a-traduzido'])
    })
})

describe.skipIf(!OUTRO)('BlogListagem — categorias em outro idioma', () => {
    it('mostra só as categorias com artigo traduzido, com a contagem do idioma e o rótulo traduzido', async () => {
        getPosts.mockImplementation(async (o) => {
            if (o.category === 'k-pop') return resultado([], 1, 5)
            if (o.category) return resultado([], 1, 0)
            return resultado(posts(3))
        })
        const p = await propsDa({}, OUTRO!)
        expect(p.categories).toEqual([{ id: 1, slug: 'k-pop', name: 'k-pop', count: 5 }])
    })
})

describe('metadataBlogListagem', () => {
    const canonicalDe = async (params: Awaited<SearchParams> = {}) => (await meta(params)).alternates?.canonical
    const indexavel = async (params: Awaited<SearchParams> = {}) => (await meta(params)).robots === undefined

    it('lista sem filtro: canônica /blog, indexável, título padrão', async () => {
        const m = await meta()
        expect(String(m.alternates?.canonical)).toMatch(/\/blog$/)
        expect(m.robots).toBeUndefined()
        expect(m.title).toBe('metaTitle')
    })

    it('categoria é indexável e usa o título de categoria; canônica leva a categoria', async () => {
        const m = await meta({ category: 'k-pop' })
        expect(m.title).toBe('metaTitleCategory')
        expect(m.robots).toBeUndefined()
        expect(String(m.alternates?.canonical)).toContain('category=k-pop')
    })

    it('busca, etiqueta, ordem e ?tipo=guias não são indexados', async () => {
        for (const p of [{ search: 'x' }, { tag: 't' }, { order: 'lidos' }, { tipo: 'guias' }]) {
            expect(await indexavel(p), JSON.stringify(p)).toBe(false)
        }
    })

    it('?tipo=guias junto de categoria não vira noindex por causa do tipo', async () => {
        expect(await indexavel({ category: 'k-pop', tipo: 'guias' })).toBe(true)
    })

    it('página além do fim não é indexada', async () => {
        getPosts.mockResolvedValue(resultado(posts(3), 2))
        expect(await indexavel({ page: '9' })).toBe(false)
    })

    it('página 2: título com sufixo, canônica com page=2 e links prev/next', async () => {
        getPosts.mockResolvedValue(resultado(posts(3), 3))
        const m = await meta({ page: '2' })
        expect(m.title).toBe('metaTitlemetaPage')
        expect(String(await canonicalDe({ page: '2' }))).toContain('page=2')
        const { prev, next } = m.alternates as { prev?: string; next?: string }
        expect(String(prev)).not.toContain('page=')
        expect(String(next)).toContain('page=3')
    })

    it.skipIf(!OUTRO)('hreflang só na primeira página sem filtro e só para idioma com artigo', async () => {
        getPosts.mockImplementation(async (o) => resultado(o.lang === OUTRO ? posts(1) : posts(3)))
        const comLang = await meta()
        expect(Object.keys(comLang.alternates?.languages ?? {})).toContain(OUTRO)
        expect((await meta({ category: 'k-pop' })).alternates?.languages).toBeUndefined()
        expect((await meta({ page: '2' })).alternates?.languages).toBeUndefined()
        getPosts.mockResolvedValue(resultado([]))
        expect((await meta()).alternates?.languages).toBeUndefined()
    })
})
