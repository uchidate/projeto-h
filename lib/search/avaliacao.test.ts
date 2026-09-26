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

type Item = { id: number; slug: string; title: string; acf?: object }

const ACERVO: Record<string, Item[]> = {
    group: [
        { id: 1, slug: 'bts', title: 'BTS' },
        { id: 2, slug: 'blackpink', title: 'BLACKPINK' },
        { id: 3, slug: 'apink', title: 'Apink' },
    ],
    artist: [
        { id: 10, slug: 'jisoo-kim', title: 'Kim Ji-soo', acf: { name_hangul: '지수', name_romanized: 'Kim Ji-soo', birth_date: '19950103', groups: [2], trending_score: 150, roles: ['singer', 'actor'] } },
        { id: 11, slug: 'kim-ji-soo', title: 'Kim Ji-soo', acf: { name_hangul: '김지수', birth_date: '19721024', trending_score: 44, roles: ['actor'] } },
        { id: 12, slug: 'kim-ji-soo-2', title: 'Kim Ji-soo', acf: { name_hangul: '지수', birth_date: '19930328', trending_score: 41, roles: ['actor'] } },
        { id: 13, slug: 'kim-ji-sook-2047233', title: 'Kim Ji-sook' },
        { id: 14, slug: 'lisa', title: 'Lisa', acf: { name_hangul: '리사', birth_date: '1997-03-27', groups: [2], trending_score: 35, roles: ['singer'] } },
        { id: 15, slug: 'jimin', title: 'Jimin', acf: { groups: [1] } },
        { id: 16, slug: 'seo-in-guk', title: 'Seo In-guk' },
        { id: 17, slug: 'park-jisoo', title: 'Park Jisoo', acf: { groups: [3], birth_date: '19950626', roles: ['singer'] } },
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
        { id: 29, slug: 'unforgivable', title: 'Unforgivable', acf: { original_title: '비밀', type: 'movie', year: 2023 } },
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
    { q: 'jisoo blackpink', topo: '/artists/jisoo-kim', nota: 'nome + grupo, várias palavras' },
    { q: 'lisa blackpink', topo: '/artists/lisa', nota: 'nome + grupo' },
    { q: 'jimin bts', topo: '/artists/jimin', nota: 'nome + grupo' },
    { q: 'blackpink jisoo', topo: '/artists/jisoo-kim', nota: 'grupo antes do nome' },
    { q: 'blakpink jisoo', entre3: '/artists/jisoo-kim', nota: 'erro de digitação em nome + grupo' },
    { q: 'jiso blackpink', entre3: '/artists/jisoo-kim', nota: 'erro de digitação no nome' },
    { q: 'bts guia', topo: '/blog/guia-bts', nota: 'palavras fora de ordem no título' },
    { q: 'filme unforgivable', topo: '/productions/unforgivable', nota: 'palavra-tipo' },
    { q: 'yg', topo: '/empresas/yg-entertainment' },
    { q: '지수', topo: '/artists/jisoo-kim', nota: 'hangul; entre dois 지수, o mais em alta' },
    { q: '리사', topo: '/artists/lisa', nota: 'hangul' },
    { q: '비밀', topo: '/productions/unforgivable', nota: 'título original em hangul' },
    { q: 'kimchi', topo: '/comidas/kimchi' },
    { q: 'snowdrop', topo: '/productions/snowdrop' },
]

describe('busca: consultas de referência', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.stubGlobal('fetch', vi.fn(async (url: string) => {
            const tipo = Object.keys(ACERVO).find(t => url.includes(`/wp/v2/${t}?`))
            const itens = ACERVO[tipo!].map(i => ({
                id: i.id, slug: i.slug, title: { rendered: i.title }, featured_image_url: null, acf: i.acf ?? [],
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

    it('homônimos ganham subtítulo que os diferencia (grupo/papel e ano)', async () => {
        const { searchIndex, aguardarIndice } = await import('./index')
        await aguardarIndice()
        const r = (await searchIndex('kim ji-soo', 12))!
        const sub = Object.fromEntries(r.map(x => [x.href, x.subtitle]))
        expect(sub['/artists/jisoo-kim']).toBe('Membro de BLACKPINK · 1995')
        expect(sub['/artists/kim-ji-soo']).toBe('Ator/Atriz · 1972')
        expect(sub['/artists/kim-ji-soo-2']).toBe('Ator/Atriz · 1993')
    })

    it('erro de digitação em várias palavras não traz grupo de nome parecido', async () => {
        const { searchIndex, aguardarIndice } = await import('./index')
        await aguardarIndice()
        const hrefs = (await searchIndex('blakpink jisoo', 12))!.map(x => x.href)
        expect(hrefs).toContain('/artists/jisoo-kim')
        expect(hrefs).not.toContain('/artists/park-jisoo')
    })

    it('achado por hangul mostra a grafia que casou; achado pelo título, não', async () => {
        const { searchIndex, aguardarIndice } = await import('./index')
        await aguardarIndice()
        const porHangul = (await searchIndex('리사', 12))!
        expect(porHangul[0].alias).toBe('리사')
        const porTitulo = (await searchIndex('lisa', 12))!
        expect(porTitulo[0].alias).toBeUndefined()
    })

    it('produção mostra tipo e ano', async () => {
        const { searchIndex, aguardarIndice } = await import('./index')
        await aguardarIndice()
        const r = (await searchIndex('unforgivable', 12))!
        expect(r[0].subtitle).toBe('Filme · 2023')
    })
})
