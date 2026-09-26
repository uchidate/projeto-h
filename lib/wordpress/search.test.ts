import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

function wpItem(id: number, title: string, slug: string) {
    return { id, slug, title: { rendered: title }, featured_image_url: null }
}

describe('searchWordPress', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        vi.resetModules()
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('retorna array vazio sem fazer nenhum fetch quando a query tem menos de 2 caracteres', async () => {
        const { searchWordPress } = await import('./search')
        const result = await searchWordPress('a')
        expect(result).toEqual([])
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('retorna array vazio pra query só com espaços', async () => {
        const { searchWordPress } = await import('./search')
        const result = await searchWordPress('   ')
        expect(result).toEqual([])
    })

    it('busca em paralelo nos 4 CPTs e mapeia pro formato SearchResult', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('/wp/v2/production')) return { ok: true, json: async () => [wpItem(1, 'BTS Drama', 'bts-drama')] }
            if (url.includes('/wp/v2/artist')) return { ok: true, json: async () => [wpItem(2, 'Jimin', 'jimin')] }
            if (url.includes('/wp/v2/group')) return { ok: true, json: async () => [wpItem(3, 'BTS', 'bts')] }
            if (url.includes('/wp/v2/posts')) return { ok: true, json: async () => [wpItem(4, 'Guia BTS', 'guia-bts')] }
            return { ok: true, json: async () => [] }
        })
        const { searchWordPress } = await import('./search')
        const result = await searchWordPress('bts')

        expect(result).toContainEqual({ id: 1, title: 'BTS Drama', href: '/productions/bts-drama', type: 'production', thumbnail: undefined })
        expect(result).toContainEqual({ id: 2, title: 'Jimin', href: '/artists/jimin', type: 'artist', thumbnail: undefined })
        expect(result).toContainEqual({ id: 3, title: 'BTS', href: '/groups/bts', type: 'group', thumbnail: undefined })
        expect(result).toContainEqual({ id: 4, title: 'Guia BTS', href: '/blog/guia-bts', type: 'post', thumbnail: undefined })
    })

    it('coloca título com match exato (case-insensitive) no topo do ranking', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('/wp/v2/production')) return { ok: true, json: async () => [wpItem(1, 'BTS World Tour Especial', 'bts-tour')] }
            if (url.includes('/wp/v2/group')) return { ok: true, json: async () => [wpItem(2, 'bts', 'bts')] }
            return { ok: true, json: async () => [] }
        })
        const { searchWordPress } = await import('./search')
        const result = await searchWordPress('BTS')
        expect(result[0].id).toBe(2)
    })

    it('titulo que contem a query (Kim Ji-soo) vence item achado so por meta/conteudo (Lisa)', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('/wp/v2/artist')) return { ok: true, json: async () => [wpItem(1, 'Lisa', 'lisa'), wpItem(2, 'Kim Ji-soo', 'kim-ji-soo')] }
            return { ok: true, json: async () => [] }
        })
        const { searchWordPress } = await import('./search')
        const result = await searchWordPress('jisoo')
        expect(result[0].id).toBe(2)
    })

    it('respeita o limit total após juntar os 4 CPTs', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('/wp/v2/production')) return { ok: true, json: async () => Array.from({ length: 6 }, (_, i) => wpItem(i, `Item ${i}`, `item-${i}`)) }
            return { ok: true, json: async () => [] }
        })
        const { searchWordPress } = await import('./search')
        const result = await searchWordPress('item', 3)
        expect(result).toHaveLength(3)
    })

    it('não quebra a busca inteira se um dos 4 CPTs falhar (Promise.allSettled)', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('/wp/v2/production')) throw new Error('WP fora do ar')
            if (url.includes('/wp/v2/artist')) return { ok: true, json: async () => [wpItem(1, 'Jimin', 'jimin')] }
            return { ok: true, json: async () => [] }
        })
        const { searchWordPress } = await import('./search')
        const result = await searchWordPress('jimin')
        expect(result).toEqual([{ id: 1, title: 'Jimin', href: '/artists/jimin', type: 'artist', thumbnail: undefined }])
    })

    it('não quebra quando um CPT responde com erro HTTP (wpFetch já trata e retorna [])', async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('/wp/v2/production')) return { ok: false, status: 500, statusText: 'Error' }
            if (url.includes('/wp/v2/artist')) return { ok: true, json: async () => [wpItem(1, 'Jimin', 'jimin')] }
            return { ok: true, json: async () => [] }
        })
        const { searchWordPress } = await import('./search')
        const result = await searchWordPress('jimin')
        expect(result).toEqual([{ id: 1, title: 'Jimin', href: '/artists/jimin', type: 'artist', thumbnail: undefined }])
    })
})
