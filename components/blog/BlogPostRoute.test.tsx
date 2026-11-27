import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactElement } from 'react'

// Cobre o que a rota decide: metadata (Rank Math, subtítulo, resumo, datas do artigo),
// 404 e a prateleira de loja do artigo (produtos do grupo/artista citado, complemento por tema
// e deduplicação contra os produtos já inseridos no texto).
const getPostBySlug = vi.fn()
const getPosts = vi.fn()
const getRelatedPosts = vi.fn()
const getStoreProducts = vi.fn()
const getStoreProductsByGroupId = vi.fn()
const getStoreProductsByArtistId = vi.fn()
const escolherPorTema = vi.fn()
const getProdutosDosBlocos = vi.fn()
const notFound = vi.fn(() => { throw new Error('NEXT_NOT_FOUND') })

vi.mock('@/lib/wordpress/posts', () => ({
    getPostBySlug: (...a: unknown[]) => getPostBySlug(...a),
    getPosts: (...a: unknown[]) => getPosts(...a),
    getRelatedPosts: (...a: unknown[]) => getRelatedPosts(...a),
}))
vi.mock('@/lib/wordpress/store', () => ({
    getStoreProducts: (...a: unknown[]) => getStoreProducts(...a),
    getStoreProductsByGroupId: (...a: unknown[]) => getStoreProductsByGroupId(...a),
    getStoreProductsByArtistId: (...a: unknown[]) => getStoreProductsByArtistId(...a),
}))
vi.mock('@/lib/wordpress/store-contexto', () => ({ escolherPorTema: (...a: unknown[]) => escolherPorTema(...a) }))
vi.mock('@/lib/blog/produtosDosBlocos', () => ({ getProdutosDosBlocos: (...a: unknown[]) => getProdutosDosBlocos(...a) }))
vi.mock('next/navigation', () => ({ notFound: () => notFound() }))
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: () => null }))
vi.mock('@/components/analytics/RastreioDeLeitura', () => ({ RastreioDeLeitura: () => null }))
vi.mock('@/components/blog/BlogPostPage', () => ({ BlogPostPage: () => null }))
vi.mock('@/components/ui/WpEditContext', () => ({ WpEditSetter: () => null }))

import { BlogPostPage } from '@/components/blog/BlogPostPage'
import PostPage, { generateMetadata, slugsPreGerados } from './BlogPostRoute'

const params = (slug: string) => Promise.resolve({ slug })

function post(extra: Record<string, unknown> = {}) {
    return {
        id: 5,
        slug: 'artigo',
        date: '2026-11-20T10:00:00',
        modified: '2026-11-21T12:00:00',
        title: { rendered: 'Título do artigo' },
        excerpt: { rendered: '<p>Resumo curto do artigo sobre K-pop.</p>' },
        content: { rendered: '<p>Texto.</p>' },
        meta: {},
        acf: {},
        related_entities: { groups: [], artists: [] },
        ...extra,
    }
}

const produto = (id: number) => ({ id, name: `p${id}` })

function propsDaPagina(el: ReactElement) {
    const filhos = (el.props as { children: ReactElement[] }).children
    const pagina = filhos.find((c) => c && c.type === BlogPostPage)
    return (pagina as ReactElement).props as { shopProducts: { id: number }[]; origemLoja: string | null }
}

beforeEach(() => {
    for (const m of [getPostBySlug, getPosts, getRelatedPosts, getStoreProducts, getStoreProductsByGroupId, getStoreProductsByArtistId, escolherPorTema, getProdutosDosBlocos, notFound]) m.mockClear()
    getRelatedPosts.mockResolvedValue([])
    getProdutosDosBlocos.mockResolvedValue([])
    getStoreProducts.mockResolvedValue([])
    getStoreProductsByGroupId.mockResolvedValue([])
    getStoreProductsByArtistId.mockResolvedValue([])
    escolherPorTema.mockReturnValue([])
})

describe('generateMetadata', () => {
    it('devolve metadata vazia quando o post não existe', async () => {
        getPostBySlug.mockResolvedValue(null)
        expect(await generateMetadata({ params: params('nao-existe') })).toEqual({})
    })

    it('prefere título e descrição manuais do Rank Math', async () => {
        getPostBySlug.mockResolvedValue(post({ meta: { rank_math_title: 'SEO manual', rank_math_description: 'Descrição manual.' } }))
        const m = await generateMetadata({ params: params('artigo') })
        expect(m.title).toBe('SEO manual')
        expect(m.description).toBe('Descrição manual.')
    })

    it('sem Rank Math usa o título do post e o subtítulo antes do resumo', async () => {
        getPostBySlug.mockResolvedValue(post({ acf: { subtitle: ' Subtítulo do artigo ' } }))
        const m = await generateMetadata({ params: params('artigo') })
        expect(m.title).toBe('Título do artigo')
        expect(m.description).toBe('Subtítulo do artigo')
    })

    it('sem subtítulo deriva a descrição do resumo', async () => {
        getPostBySlug.mockResolvedValue(post())
        const m = await generateMetadata({ params: params('artigo') })
        expect(String(m.description)).toContain('Resumo curto do artigo')
    })

    it('marca o artigo com as datas de publicação e modificação e canonical em /blog/slug', async () => {
        getPostBySlug.mockResolvedValue(post())
        const m = await generateMetadata({ params: params('artigo') })
        expect(m.alternates?.canonical).toMatch(/\/blog\/artigo$/)
        const og = m.openGraph as { type?: string; publishedTime?: string; modifiedTime?: string }
        expect(og.publishedTime).toBe('2026-11-20T10:00:00-03:00')
        expect(og.modifiedTime).toBe('2026-11-21T12:00:00-03:00')
    })
})

describe('slugsPreGerados', () => {
    it('lista os slugs dos posts mais recentes', async () => {
        getPosts.mockResolvedValue({ items: [{ slug: 'a' }, { slug: 'b' }] })
        expect(await slugsPreGerados()).toEqual([{ slug: 'a' }, { slug: 'b' }])
    })

    it('com o WordPress fora do ar devolve lista vazia em vez de quebrar o build', async () => {
        getPosts.mockRejectedValue(new Error('503'))
        expect(await slugsPreGerados()).toEqual([])
    })
})

describe('PostPage', () => {
    it('chama notFound quando o post não existe', async () => {
        getPostBySlug.mockResolvedValue(null)
        await expect(PostPage({ params: params('nao-existe') })).rejects.toThrow('NEXT_NOT_FOUND')
    })

    it('com 3+ produtos do grupo citado usa só eles e nomeia o grupo', async () => {
        getPostBySlug.mockResolvedValue(post({ related_entities: { groups: [{ id: 1, name: 'aespa' }], artists: [] } }))
        getStoreProductsByGroupId.mockResolvedValue([produto(1), produto(2), produto(3)])
        const props = propsDaPagina(await PostPage({ params: params('artigo') }))
        expect(props.shopProducts.map((p) => p.id)).toEqual([1, 2, 3])
        expect(props.origemLoja).toBe('aespa')
        expect(escolherPorTema).not.toHaveBeenCalled()
    })

    it('com poucos produtos da entidade completa pelo assunto do texto', async () => {
        getPostBySlug.mockResolvedValue(post({ related_entities: { groups: [{ id: 1, name: 'aespa' }], artists: [] } }))
        getStoreProductsByGroupId.mockResolvedValue([produto(1)])
        escolherPorTema.mockReturnValue([produto(10), produto(11)])
        const props = propsDaPagina(await PostPage({ params: params('artigo') }))
        expect(props.shopProducts.map((p) => p.id)).toEqual([1, 10, 11])
        expect(escolherPorTema).toHaveBeenCalledWith([], expect.objectContaining({ excluirIds: [1], limite: 5 }))
    })

    it('post sem entidade usa só produtos por tema e não nomeia ninguém', async () => {
        getPostBySlug.mockResolvedValue(post())
        escolherPorTema.mockReturnValue([produto(20)])
        const props = propsDaPagina(await PostPage({ params: params('artigo') }))
        expect(props.shopProducts.map((p) => p.id)).toEqual([20])
        expect(props.origemLoja).toBeNull()
    })

    it('não repete na prateleira o produto que já aparece dentro do texto', async () => {
        getPostBySlug.mockResolvedValue(post({ related_entities: { groups: [{ id: 1, name: 'aespa' }], artists: [] } }))
        getStoreProductsByGroupId.mockResolvedValue([produto(1), produto(2), produto(3)])
        getProdutosDosBlocos.mockResolvedValue([produto(2)])
        const props = propsDaPagina(await PostPage({ params: params('artigo') }))
        expect(props.shopProducts.map((p) => p.id)).toEqual([1, 3])
    })
})
