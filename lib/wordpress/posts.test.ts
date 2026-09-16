import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getPosts, getRelatedPosts } from './posts'
import type { WPPost } from './types'

function post(id: number, overrides: Partial<WPPost> = {}): WPPost {
    return {
        id, slug: `post-${id}`, title: { rendered: `Post ${id}` }, date: '2026-01-01T00:00:00',
        tags: [], categories: [],
        ...overrides,
    } as WPPost
}

describe('getPosts', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('quando categoryId é passado direto, não faz lookup de slug de categoria', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [], headers: new Map([['X-WP-Total', '0'], ['X-WP-TotalPages', '0']]) })
        await getPosts({ categoryId: 5 })
        expect(fetchMock.mock.calls.some(([url]) => url.includes('/wp/v2/categories'))).toBe(false)
        const postsCall = fetchMock.mock.calls.find(([url]) => url.includes('/wp/v2/posts'))
        expect(postsCall![0]).toContain('categories=5')
    })

    it('quando só category (slug) é passado, resolve o ID via lookup antes de buscar os posts', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('/wp/v2/categories')) return { ok: true, json: async () => [{ id: 9, slug: 'k-pop' }] }
            return { ok: true, json: async () => [], headers: new Map([['X-WP-Total', '0'], ['X-WP-TotalPages', '0']]) }
        })
        await getPosts({ category: 'k-pop' })
        const postsCall = fetchMock.mock.calls.find(([url]) => url.includes('/wp/v2/posts'))
        expect(postsCall![0]).toContain('categories=9')
    })

    it('quando o slug de categoria não resolve pra nenhum ID, não filtra por categoria (sem quebrar)', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('/wp/v2/categories')) return { ok: true, json: async () => [] }
            return { ok: true, json: async () => [], headers: new Map([['X-WP-Total', '0'], ['X-WP-TotalPages', '0']]) }
        })
        await getPosts({ category: 'categoria-inexistente' })
        const postsCall = fetchMock.mock.calls.find(([url]) => url.includes('/wp/v2/posts'))
        expect(postsCall![0]).not.toContain('categories=')
    })

    it('resolve tag slug pra ID da mesma forma', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('/wp/v2/tags')) return { ok: true, json: async () => [{ id: 4, slug: 'comeback' }] }
            return { ok: true, json: async () => [], headers: new Map([['X-WP-Total', '0'], ['X-WP-TotalPages', '0']]) }
        })
        await getPosts({ tag: 'comeback' })
        const postsCall = fetchMock.mock.calls.find(([url]) => url.includes('/wp/v2/posts'))
        expect(postsCall![0]).toContain('tags=4')
    })

    it('não transfere HTML do artigo quando a listagem pede o resumo', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [], headers: new Map([['X-WP-Total', '0'], ['X-WP-TotalPages', '0']]) })
        await getPosts({ includeContent: false })
        const postsCall = fetchMock.mock.calls.find(([url]) => url.includes('/wp/v2/posts'))
        const fields = new URL(postsCall![0]).searchParams.get('_fields')
        expect(fields).not.toContain('content')
        expect(fields).toContain('excerpt')
        expect(fields).toContain('acf')
    })
})

describe('getRelatedPosts', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    function mockResults(items: WPPost[]) {
        fetchMock.mockResolvedValue({ ok: true, json: async () => items, headers: new Map([['X-WP-Total', String(items.length)], ['X-WP-TotalPages', '1']]) })
    }

    it('pontua tag em comum com peso 3 e categoria em comum com peso 1', async () => {
        const source = post(1, { tags: [10], categories: [20] })
        mockResults([
            post(2, { tags: [10], categories: [] }),        // 1 tag em comum = score 3
            post(3, { tags: [], categories: [20] }),        // 1 categoria em comum = score 1
        ])
        const result = await getRelatedPosts(source)
        expect(result.map(p => p.id)).toEqual([2, 3]) // tag (score 3) vem antes de categoria (score 1)
    })

    it('soma os pesos quando o candidato compartilha tag E categoria', async () => {
        const source = post(1, { tags: [10], categories: [20] })
        mockResults([
            post(2, { tags: [10], categories: [] }),         // score 3
            post(3, { tags: [10], categories: [20] }),       // score 4 (3+1)
        ])
        const result = await getRelatedPosts(source)
        expect(result.map(p => p.id)).toEqual([3, 2])
    })

    it('desempata por data mais recente quando o score é igual', async () => {
        const source = post(1, { tags: [10], categories: [] })
        mockResults([
            post(2, { tags: [10], date: '2026-01-01T00:00:00' }),
            post(3, { tags: [10], date: '2026-02-01T00:00:00' }), // mais recente, mesmo score
        ])
        const result = await getRelatedPosts(source)
        expect(result.map(p => p.id)).toEqual([3, 2])
    })

    it('deduplica posts que aparecem tanto na busca por tag quanto por categoria', async () => {
        const source = post(1, { tags: [10], categories: [20] })
        mockResults([post(2, { tags: [10], categories: [20] })])
        const result = await getRelatedPosts(source)
        expect(result).toHaveLength(1)
    })

    it('exclui o próprio post da busca (via param exclude)', async () => {
        mockResults([])
        await getRelatedPosts(post(42, { tags: [10] }))
        expect(fetchMock.mock.calls.every(([url]) => url.includes('exclude=42'))).toBe(true)
    })

    it('respeita o limit', async () => {
        const source = post(1, { tags: [10] })
        mockResults(Array.from({ length: 10 }, (_, i) => post(i + 2, { tags: [10] })))
        const result = await getRelatedPosts(source, 2)
        expect(result).toHaveLength(2)
    })

    it('sem tags nem categorias no post de origem, não faz nenhuma busca e retorna vazio', async () => {
        const result = await getRelatedPosts(post(1, { tags: [], categories: [] }))
        expect(result).toEqual([])
        expect(fetchMock).not.toHaveBeenCalled()
    })
})
