import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

function item(id: number, title: string, slug: string, acf?: object) {
    return { id, slug, title: { rendered: title }, featured_image_url: null, acf: acf ?? [] }
}

const BASE: Record<string, unknown[]> = {
    artist: [item(1, 'Lisa', 'lisa', { groups: [10] }), item(2, 'Kim Ji-soo', 'kim-ji-soo', { groups: [10] })],
    group: [item(10, 'BLACKPINK', 'blackpink')],
    production: [item(20, 'Today’s Jisoo', 'todays-jisoo')],
    posts: [item(30, 'Guia BLACKPINK', 'guia-blackpink')],
    company: [item(40, 'YG Entertainment', 'yg')],
    food: [item(50, 'Kimchi', 'kimchi')],
}

describe('indice de busca em memoria', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.stubGlobal('fetch', vi.fn(async (url: string) => {
            const tipo = Object.keys(BASE).find(t => url.includes(`/wp/v2/${t}?`))
            return { ok: true, headers: new Headers({ 'x-wp-total': String(BASE[tipo!].length), 'x-wp-totalpages': '1' }), json: async () => BASE[tipo!] }
        }))
    })
    afterEach(() => { vi.unstubAllGlobals() })

    it('sem indice pronto devolve null (quem chama usa a busca REST) e carrega em segundo plano', async () => {
        const { searchIndex, aguardarIndice } = await import('./index')
        expect(await searchIndex('jisoo', 12)).toBeNull()
        await aguardarIndice()
        expect(await searchIndex('jisoo', 12)).not.toBeNull()
    })

    it('"jisoo" acha a ficha Kim Ji-soo antes de Lisa, com subtitulo do grupo', async () => {
        const { searchIndex, aguardarIndice } = await import('./index')
        await aguardarIndice()
        const r = (await searchIndex('jisoo', 12))!
        const kim = r.find(x => x.id === 2)!
        expect(kim.subtitle).toBe('Membro de BLACKPINK')
        expect(r.findIndex(x => x.id === 2)).toBeLessThan(r.findIndex(x => x.id === 1) === -1 ? 99 : r.findIndex(x => x.id === 1))
    })

    it('tolera erro de digitacao ("blakpink") quando quase nada casa direto', async () => {
        const { searchIndex, aguardarIndice } = await import('./index')
        await aguardarIndice()
        const r = (await searchIndex('blakpink', 12))!
        expect(r.map(x => x.id)).toContain(10)
    })

    it('se uma colecao vier vazia (WP falhou), nao cria indice pela metade', async () => {
        BASE.food = []
        const { searchIndex, aguardarIndice } = await import('./index')
        vi.spyOn(console, 'error').mockImplementation(() => {})
        await aguardarIndice()
        expect(await searchIndex('kimchi', 12)).toBeNull()
        BASE.food = [item(50, 'Kimchi', 'kimchi')]
    })

    it('ficha repetida entre paginas do WP aparece uma vez só no índice', async () => {
        const antes = BASE.artist
        BASE.artist = [...antes, antes[0]]
        const { searchIndex, aguardarIndice } = await import('./index')
        await aguardarIndice()
        const r = (await searchIndex('lisa', 12))!
        expect(r.filter(x => x.id === 1)).toHaveLength(1)
        BASE.artist = antes
    })
})
