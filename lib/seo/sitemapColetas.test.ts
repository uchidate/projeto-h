import { beforeEach, describe, expect, it, vi } from 'vitest'

type Resposta = { items: Array<Record<string, unknown>>; total: number; totalPages: number }
const wp = vi.hoisted(() => ({
    responder: (_base: string, _params: URLSearchParams): Resposta | Error => ({ items: [], total: 0, totalPages: 0 }),
    chamadas: [] as string[],
}))
vi.mock('@/lib/wordpress/client', () => ({
    buildParams: (p: Record<string, unknown>) => '?' + new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString(),
    wpFetchWithTotal: async (caminho: string) => {
        wp.chamadas.push(caminho)
        const [rota, query] = caminho.split('?')
        const r = wp.responder(rota.replace('/wp/v2/', ''), new URLSearchParams(query))
        if (r instanceof Error) throw r
        return r
    },
}))
vi.mock('@/lib/guias/i18n', () => ({
    getMapaDeGuias: async () => ({
        hubs: [{ slug: 'kdrama' }],
        traduzidos: (locale: string) => (locale === 'en' ? ['kdrama'] : []),
        slugPublico: () => 'k-drama-guide',
        alternativas: () => ({ 'pt-BR': 'https://exemplo/guias/kdrama' }),
        alternativasDoIndice: () => undefined,
    }),
}))
vi.mock('@/lib/wordpress/fandoms', () => ({ getAllFandoms: async () => [] }))

import { SITE_URL } from '@/lib/constants/site'
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config'
import { SHARDS_TRADUZIVEIS } from '@/lib/i18n/entidades-traduziveis'
import { getLocalizedSitemapEntries, getSitemapEntries, lastmodDosShards, shardsComTraducao } from './dynamicSitemap'

const idiomas = ACTIVE_LOCALES.filter((l) => l !== DEFAULT_LOCALE)
const traduzida = { en: { stale: false, content: 'b'.repeat(400) } }
const pagina = (items: Array<Record<string, unknown>>, total = items.length, totalPages = total ? 1 : 0): Resposta => ({ items, total, totalPages })

beforeEach(() => {
    wp.chamadas.length = 0
    wp.responder = () => pagina([])
})

describe('coleção em português', () => {
    it('monta uma URL por ficha, com a data da última alteração', async () => {
        wp.responder = () => pagina([{ slug: 'kimchi', date: '2026-01-01T10:00:00', modified: '2026-02-03T10:00:00' }, { slug: 'sem-data' }])
        expect(await getSitemapEntries('foods')).toEqual([
            { loc: `${SITE_URL}/comidas/kimchi`, lastmod: '2026-02-03' },
            { loc: `${SITE_URL}/comidas/sem-data`, lastmod: undefined },
        ])
    })

    it('junta todas as páginas, em blocos de quatro', async () => {
        wp.responder = (_base, p) => pagina([{ slug: `ficha-${p.get('page')}` }], 7, 7)
        const entradas = await getSitemapEntries('companies')
        expect(entradas.map((e) => e.loc.split('/').pop())).toEqual([1, 2, 3, 4, 5, 6, 7].map((n) => `ficha-${n}`))
        expect(wp.chamadas).toHaveLength(7)
    })

    it('não publica sitemap vazio, incompleto ou acima do limite', async () => {
        await expect(getSitemapEntries('foods')).rejects.toThrow('vazio')
        wp.responder = (_base, p) => pagina(p.get('page') === '1' ? [{ slug: 'a' }] : [], 2, 2)
        await expect(getSitemapEntries('foods')).rejects.toThrow('incompleto: 1/2')
        wp.responder = () => pagina([{ slug: 'a' }], 50_001, 501)
        await expect(getSitemapEntries('foods')).rejects.toThrow('50 mil')
    })

    it('post em português leva o hreflang da tradução publicada', async () => {
        wp.responder = () => pagina([{ slug: 'meu-post', translations: { pt: 'meu-post', en: 'my-post' } }, { slug: 'so-pt' }])
        const [com, sem] = await getSitemapEntries('posts')
        expect(com.alternates?.en).toBe(`${SITE_URL}/en/blog/meu-post`)
        expect(sem.alternates).toBeUndefined()
    })
})

describe('páginas fixas', () => {
    it('inclui os hubs e os guias traduzidos', async () => {
        const entradas = await getSitemapEntries('pages')
        const locs = entradas.map((e) => e.loc)
        expect(locs).toContain(SITE_URL)
        expect(locs).toContain(`${SITE_URL}/guias/kdrama`)
        expect(locs.some((l) => l.startsWith(`${SITE_URL}/en/`) && l.endsWith('k-drama-guide'))).toBe(true)
        expect(entradas.find((e) => e.loc === `${SITE_URL}/guias`)?.alternates).toBeUndefined()
    })
})

describe('coleção em outro idioma', () => {
    it('lista só as fichas traduzidas, com a listagem e sem lançar quando não há nenhuma', async () => {
        wp.responder = () => pagina([{ slug: 'kimchi', translations: traduzida }, { slug: 'so-pt' }])
        const entradas = await getLocalizedSitemapEntries('foods', 'en')
        expect(entradas.map((e) => e.loc)).toEqual([`${SITE_URL}/en/foods`, `${SITE_URL}/en/foods/kimchi`])
        wp.responder = () => pagina([])
        expect(await getLocalizedSitemapEntries('foods', 'en')).toEqual([])
    })

    it('a home do idioma entra no primeiro shard mesmo que só outro tipo tenha tradução', async () => {
        const primeiro = SHARDS_TRADUZIVEIS[0]
        wp.responder = (base) => (base === 'food' ? pagina([{ slug: 'kimchi', translations: traduzida }]) : pagina([]))
        const entradas = await getLocalizedSitemapEntries(primeiro, 'en')
        expect(entradas.map((e) => e.loc)).toEqual([`${SITE_URL}/en`])
    })

    it('idioma sem ficha nenhuma não ganha home', async () => {
        expect(await getLocalizedSitemapEntries(SHARDS_TRADUZIVEIS[0], 'en')).toEqual([])
    })
})

describe('shardsComTraducao', () => {
    it('lista, por idioma, os tipos com tradução', async () => {
        const primeiro = SHARDS_TRADUZIVEIS[0]
        wp.responder = (_base, p) => (p.get('oc_locale') === 'en' ? pagina([{ slug: 'a' }]) : pagina([]))
        const porIdioma = await shardsComTraducao()
        expect(porIdioma.en).toEqual([...SHARDS_TRADUZIVEIS])
        for (const outro of idiomas.filter((l) => l !== 'en')) expect(porIdioma[outro]).not.toContain(primeiro)
    })

    it('mantém o arquivo que carrega a home do idioma quando o primeiro tipo ainda não foi traduzido', async () => {
        wp.responder = (base, p) => (base === 'food' && p.get('oc_locale') === 'en' ? pagina([{ slug: 'kimchi' }]) : pagina([]))
        const porIdioma = await shardsComTraducao()
        expect(porIdioma.en).toEqual([SHARDS_TRADUZIVEIS[0], 'foods'])
        for (const outro of idiomas.filter((l) => l !== 'en')) expect(porIdioma[outro]).toEqual([])
    })
})

describe('lastmodDosShards', () => {
    it('data cada arquivo pela ficha mais recente e omite o que falha ou está vazio', async () => {
        wp.responder = (base, p) => {
            if (base === 'artist') return new Error('fora do ar')
            if (base === 'group') return pagina([])
            return pagina([{ date: p.get('lang') ? '2026-03-03T00:00:00' : p.get('oc_locale') ? '2026-02-02T00:00:00' : '2026-01-01T00:00:00' }])
        }
        const datas = await lastmodDosShards(['en'], { en: ['foods', 'artists'] })
        expect(datas.foods).toBe('2026-01-01')
        expect(datas['foods-en']).toBe('2026-02-02')
        expect(datas['posts-en']).toBe('2026-03-03')
        expect(datas).not.toHaveProperty('artists')
        expect(datas).not.toHaveProperty('artists-en')
        expect(datas).not.toHaveProperty('groups')
        expect(datas).not.toHaveProperty('groups-en')
    })

    it('sem o mapa por idioma, consulta todos os tipos traduzíveis', async () => {
        wp.responder = () => pagina([{ modified: '2026-01-01T00:00:00' }])
        const datas = await lastmodDosShards()
        for (const idioma of idiomas) for (const shard of SHARDS_TRADUZIVEIS) expect(datas).toHaveProperty(`${shard}-${idioma}`)
    })
})
