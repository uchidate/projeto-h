import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Conjunto de consultas de referência da busca.
 *
 * Cada linha diz o que um leitor espera achar. Sem isso, cada ajuste no ranking
 * é palpite: melhora "bts" e ninguém percebe que piorou "jisoo". O acervo abaixo
 * é uma amostra com títulos e slugs REAIS de produção (26/09/2026), incluindo os
 * homônimos que motivaram este teste (três "Kim Ji-soo" que são pessoas
 * diferentes) — não é um acervo de brinquedo.
 *
 * Para acrescentar um caso: uma linha em CASOS. Ao corrigir um bug de busca
 * reportado, o caso do bug entra aqui antes da correção.
 */

type Item = { id: number; slug: string; title: string; meta?: object }

const ACERVO: Record<string, Item[]> = {
    group: [
        { id: 1, slug: 'bts', title: 'BTS' },
        { id: 2, slug: 'blackpink', title: 'BLACKPINK' },
        { id: 3, slug: 'apink', title: 'Apink' },
    ],
    artist: [
        { id: 10, slug: 'jisoo-kim', title: 'Kim Ji-soo', meta: { groups: [2] } },
        { id: 11, slug: 'kim-ji-soo', title: 'Kim Ji-soo' },
        { id: 12, slug: 'kim-ji-soo-2', title: 'Kim Ji-soo' },
        { id: 13, slug: 'kim-ji-sook-2047233', title: 'Kim Ji-sook' },
        { id: 14, slug: 'lisa', title: 'Lisa', meta: { groups: [2] } },
        { id: 15, slug: 'jimin', title: 'Jimin', meta: { groups: [1] } },
        { id: 16, slug: 'seo-in-guk', title: 'Seo In-guk' },
    ],
    production: [
        { id: 20, slug: 'bts-bon-voyage', title: 'BTS: Bon Voyage' },
        { id: 21, slug: 'bts-yet-to-come', title: 'BTS: Yet To Come' },
        { id: 22, slug: 'bts-gayo', title: 'BTS GAYO' },
        { id: 23, slug: 'blackpink-o-filme', title: 'BLACKPINK: O Filme' },
        { id: 24, slug: 'blackpink-house', title: 'BLACKPINK HOUSE' },
        { id: 25, slug: 'todays-jisoo', title: 'Today’s Jisoo' },
        { id: 26, slug: 'parasita', title: 'Parasita' },
        { id: 27, slug: 'parasyte-the-grey', title: 'Parasyte: The Grey' },
        { id: 28, slug: 'snowdrop', title: 'Snowdrop' },
    ],
    posts: [
        { id: 30, slug: 'jisoo-blackpink-visual', title: 'Jisoo (BLACKPINK): da Visual ao Centro do Palco' },
        { id: 31, slug: 'guia-bts', title: 'Guia BTS: por onde começar' },
    ],
    company: [{ id: 40, slug: 'yg-entertainment', title: 'YG Entertainment' }],
    food: [{ id: 50, slug: 'kimchi', title: 'Kimchi' }],
}

/** `topo`: o href deve ser o 1º resultado. `entre3`: deve estar nos 3 primeiros. */
const CASOS: Array<{ q: string; topo?: string; entre3?: string; nota?: string }> = [
    { q: 'bts', topo: '/groups/bts', nota: 'o grupo antes das produções' },
    { q: 'BTS', topo: '/groups/bts', nota: 'caixa alta' },
    { q: 'blackpink', topo: '/groups/blackpink' },
    { q: 'black pink', topo: '/groups/blackpink', nota: 'espaço na romanização' },
    { q: 'blakpink', entre3: '/groups/blackpink', nota: 'erro de digitação' },
    { q: 'jisoo', topo: '/artists/jisoo-kim', nota: 'a Jisoo do BLACKPINK entre as três Kim Ji-soo' },
    { q: 'jiso', entre3: '/artists/jisoo-kim', nota: 'erro de digitação' },
    { q: 'kim ji-soo', entre3: '/artists/jisoo-kim' },
    { q: 'parasite', entre3: '/productions/parasita', nota: 'título em inglês, ficha em português' },
    { q: 'lisa', topo: '/artists/lisa' },
    { q: 'yg', topo: '/empresas/yg-entertainment' },
    { q: 'kimchi', topo: '/comidas/kimchi' },
    { q: 'snowdrop', topo: '/productions/snowdrop' },
]

describe('busca: consultas de referência', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.stubGlobal('fetch', vi.fn(async (url: string) => {
            const tipo = Object.keys(ACERVO).find(t => url.includes(`/wp/v2/${t}?`))
            const itens = ACERVO[tipo!].map(i => ({
                id: i.id, slug: i.slug, title: { rendered: i.title }, featured_image_url: null, meta: i.meta ?? [],
            }))
            return { ok: true, headers: new Headers({ 'x-wp-total': String(itens.length), 'x-wp-totalpages': '1' }), json: async () => itens }
        }))
    })
    afterEach(() => { vi.unstubAllGlobals() })

    it.each(CASOS)('"$q" $nota', async ({ q, topo, entre3 }) => {
        const { searchIndex, aguardarIndice } = await import('./index')
        await aguardarIndice()
        const r = (await searchIndex(q, 12))!
        const hrefs = r.map(x => x.href)
        if (topo) expect(hrefs[0], `resultados: ${hrefs.join(', ')}`).toBe(topo)
        if (entre3) expect(hrefs.slice(0, 3), `resultados: ${hrefs.join(', ')}`).toContain(entre3)
    })
})
