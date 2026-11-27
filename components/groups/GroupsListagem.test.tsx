import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config'

// Cobre o que a /groups decide: filtros que viram consulta, canonical para a página estática do tipo,
// noindex em filtro, faixas de descoberta só na página inicial, rostos das integrantes, lista vazia
// lançando (para preservar o ISR) e 404 de página inválida.
const getGroups = vi.fn()
const getAllGroups = vi.fn()
const wpFetch = vi.fn()
const getArtistsByIds = vi.fn()
const getFeaturedStoreProducts = vi.fn()
const notFound = vi.fn(() => { throw new Error('NEXT_NOT_FOUND') })

vi.mock('@/lib/wordpress/groups', () => ({
    getGroups: (...a: unknown[]) => getGroups(...a),
    getAllGroups: (...a: unknown[]) => getAllGroups(...a),
}))
vi.mock('@/lib/wordpress/client', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/wordpress/client')>()),
    wpFetch: (...a: unknown[]) => wpFetch(...a),
}))
vi.mock('@/lib/wordpress/artists', () => ({ getArtistsByIds: (...a: unknown[]) => getArtistsByIds(...a) }))
vi.mock('@/lib/wordpress/store', () => ({ getFeaturedStoreProducts: (...a: unknown[]) => getFeaturedStoreProducts(...a) }))
vi.mock('@/lib/wordpress/store-ranking', () => ({ ordenarPrateleira: (p: unknown[]) => p }))
vi.mock('@/lib/artists/aniversarios', () => ({ hojeEmSaoPaulo: () => ({ mes: 11, dia: 15 }) }))
vi.mock('@/components/features/LocalizedCatalog', () => ({ defaultCatalogLanguages: () => ({}) }))
vi.mock('@/lib/i18n/entity-translation', () => ({
    hasLocale: (g: { traduzido?: boolean }) => g.traduzido === true,
    localizeEntity: (g: object) => ({ ...g, localizado: true }),
}))
vi.mock('next/navigation', () => ({ notFound: () => notFound() }))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (k: string) => k }))
vi.mock('@/components/seo/PageBreadcrumb', () => ({ PageBreadcrumb: () => null }))
vi.mock('@/components/groups/GroupsPage', () => ({ GroupsPage: () => null }))

import { GroupsPage } from '@/components/groups/GroupsPage'
import { GroupsListagem, metadataGroupsListagem, type SearchParams } from './GroupsListagem'

const OUTRO = ACTIVE_LOCALES.find((l) => l !== DEFAULT_LOCALE)

type G = {
    id: number; slug: string; title: { rendered: string }
    acf?: { debut_date?: string; noticias_14d?: number; members?: number[] }
    featured_image_url?: string; former_member_slugs?: string[]; traduzido?: boolean
}
let seq = 0
const grupo = (extra: Partial<G> = {}, nome = `Grupo ${++seq}`): G => ({ id: seq + 100, slug: nome.toLowerCase().replace(/ /g, '-'), title: { rendered: nome }, ...extra })
const lista = (items: G[], totalPages = 1) => ({ items, total: items.length, totalPages })

type Props = Record<string, unknown> & {
    groups: G[]; emAlta: G[]; geracoes: { slug: string; fotos: G[] }[]; debutaram: { slug: string; dia: number; ano: number }[]
    letterCounts: Record<string, number>; integrantes: Record<number, { nome: string; foto: string }[]>; shopProducts: unknown[]; mesNome: string
}

async function propsDa(params: Awaited<SearchParams> = {}, locale = DEFAULT_LOCALE) {
    const el = (await GroupsListagem({ searchParams: Promise.resolve(params), locale })) as ReactElement
    const filhos = (el.props as { children: ReactElement[] }).children
    return (filhos.find((c) => c && c.type === GroupsPage) as ReactElement).props as Props
}
const meta = (params: Awaited<SearchParams> = {}, locale = DEFAULT_LOCALE) => metadataGroupsListagem({ searchParams: Promise.resolve(params), locale })

beforeEach(() => {
    for (const m of [getGroups, getAllGroups, wpFetch, getArtistsByIds, getFeaturedStoreProducts, notFound]) m.mockReset()
    notFound.mockImplementation(() => { throw new Error('NEXT_NOT_FOUND') })
    getGroups.mockResolvedValue(lista([grupo(), grupo()]))
    getAllGroups.mockResolvedValue([])
    wpFetch.mockResolvedValue({ A: 3, B: 2 })
    getArtistsByIds.mockResolvedValue([])
    getFeaturedStoreProducts.mockResolvedValue([])
})

describe('GroupsListagem — consulta', () => {
    it('filtros viram parâmetros da consulta (tipo, ativo, letra, geração)', async () => {
        await propsDa({ type: 'girl_group', active: 'true', letter: 'bts', generation: '4' })
        expect(getGroups).toHaveBeenCalledWith(expect.objectContaining({
            type: 'girl_group', active: true, letter: 'B', debutMin: '20180101', debutMax: '20221231', perPage: 48,
        }))
    })

    it('tipo inválido é ignorado e active=false vira false', async () => {
        await propsDa({ type: 'inventado', active: 'false' })
        const c = getGroups.mock.calls[0][0]
        expect(c.type).toBeUndefined()
        expect(c.active).toBe(false)
    })

    it('ordem: az = título crescente, novos = data decrescente, padrão = relevância', async () => {
        await propsDa({ order: 'az' })
        expect(getGroups.mock.calls[0][0]).toMatchObject({ orderby: 'title', order: 'asc' })
        await propsDa({ order: 'novos' })
        expect(getGroups.mock.calls[1][0]).toMatchObject({ orderby: 'date', order: 'desc' })
        await propsDa({ order: 'qualquer' })
        expect(getGroups.mock.calls[2][0]).toMatchObject({ orderby: 'relevance', order: 'desc' })
    })

    it('contagem por letra vem do endpoint do WP em PT; falha vira vazio', async () => {
        expect((await propsDa()).letterCounts).toEqual({ A: 3, B: 2 })
        wpFetch.mockRejectedValue(new Error('x'))
        expect((await propsDa()).letterCounts).toEqual({})
    })
})

describe('GroupsListagem — erros e páginas', () => {
    it('lista vazia sem filtro na página 1 lança, para preservar o ISR', async () => {
        getGroups.mockResolvedValue(lista([]))
        await expect(propsDa()).rejects.toThrow(/listagem vazia/)
    })

    it('lista vazia com filtro não lança', async () => {
        getGroups.mockResolvedValue(lista([]))
        expect((await propsDa({ search: 'zzz' })).groups).toEqual([])
    })

    it('página além do fim vira 404', async () => {
        getGroups.mockResolvedValue(lista([grupo()], 2))
        await expect(propsDa({ page: '3' })).rejects.toThrow('NEXT_NOT_FOUND')
    })
})

describe('GroupsListagem — faixas da página inicial', () => {
    it('só a página inicial sem filtro monta as faixas e a prateleira de loja', async () => {
        getFeaturedStoreProducts.mockResolvedValue([{ id: 1 }])
        getAllGroups.mockResolvedValue([grupo({ acf: { noticias_14d: 500 } })])
        getGroups.mockResolvedValue(lista([grupo()], 3))
        expect((await propsDa()).shopProducts).toHaveLength(1)
        expect(getAllGroups).toHaveBeenCalled()
        getAllGroups.mockClear()
        for (const p of [{ type: 'boy_group' }, { page: '2' }, { order: 'az' }, { search: 'x' }]) {
            const props = await propsDa(p)
            expect(props.shopProducts, JSON.stringify(p)).toEqual([])
            expect(props.emAlta).toEqual([])
        }
        expect(getAllGroups).not.toHaveBeenCalled()
    })

    it('"Em alta" traz só quem tem notícia recente, do mais noticiado ao menos', async () => {
        const a = grupo({ acf: { noticias_14d: 200 } }, 'Alfa')
        const b = grupo({ acf: { noticias_14d: 900 } }, 'Beta')
        const c = grupo({ acf: { noticias_14d: 0 } }, 'Gama')
        getAllGroups.mockResolvedValue([a, b, c])
        const p = await propsDa()
        expect(p.emAlta.map((g) => g.slug)).toEqual(['beta', 'alfa'])
    })

    it('gerações: só entram com 2+ fotos, no máximo 4, e a 1ª geração fica de fora', async () => {
        const com = (ano: number, n: number) => Array.from({ length: n }, () => grupo({ acf: { debut_date: `${ano}-05-01` }, featured_image_url: 'x.jpg' }))
        getAllGroups.mockResolvedValue([...com(2019, 6), ...com(2014, 1), ...com(1998, 5), grupo({ acf: { debut_date: '2020-01-01' } })])
        const p = await propsDa()
        expect(p.geracoes.map((g) => g.slug)).toEqual(['4'])
        expect(p.geracoes[0].fotos).toHaveLength(4)
    })

    it('estreias do mês: ordenadas por dia, a partir de hoje e voltando ao começo, no máximo 5', async () => {
        const dias = [2, 5, 14, 15, 20, 25, 28]
        getAllGroups.mockResolvedValue([
            ...dias.map((d) => grupo({ acf: { debut_date: `2015-11-${String(d).padStart(2, '0')}` } })),
            grupo({ acf: { debut_date: '2015-10-20' } }),
            grupo({ acf: { debut_date: 'sem data' } }),
        ])
        const p = await propsDa()
        expect(p.debutaram.map((d) => d.dia)).toEqual([15, 20, 25, 28, 2])
        expect(p.mesNome).toBe('novembro')
    })

    it('falha ao carregar o acervo inteiro não derruba a lista', async () => {
        getAllGroups.mockRejectedValue(new Error('WP'))
        const p = await propsDa()
        expect(p.groups).toHaveLength(2)
        expect(p.emAlta).toEqual([])
    })
})

describe('GroupsListagem — rostos das integrantes', () => {
    const artista = (id: number, nome: string, foto?: string) => ({ id, slug: nome.toLowerCase(), title: { rendered: nome }, featured_image_url: foto })

    it('guarda até 4 rostos, pula ex-integrante e quem não tem foto, e só mostra com 2 ou mais', async () => {
        const g = grupo({ acf: { members: [1, 2, 3, 4, 5, 6, 7] }, former_member_slugs: ['bia'] }, 'Trio')
        getGroups.mockResolvedValue(lista([g]))
        getArtistsByIds.mockResolvedValue([
            artista(1, 'Ana', 'a.jpg'), artista(2, 'Bia', 'b.jpg'), artista(3, 'Cris', 'c.jpg'), artista(4, 'Dani'), artista(5, 'Eva', 'e.jpg'),
        ])
        const p = await propsDa({ search: 'trio' })
        expect(p.integrantes[g.id].map((x) => x.nome)).toEqual(['Ana', 'Cris', 'Eva'])
    })

    it('com menos de 2 rostos o grupo fica sem hover', async () => {
        const g = grupo({ acf: { members: [1, 2] } })
        getGroups.mockResolvedValue(lista([g]))
        getArtistsByIds.mockResolvedValue([artista(1, 'Ana', 'a.jpg'), artista(2, 'Bia')])
        expect((await propsDa({ search: 'x' })).integrantes).toEqual({})
    })

    it('busca de artistas em lotes de 100 e falha não derruba a lista', async () => {
        const g = grupo({ acf: { members: Array.from({ length: 6 }, (_, i) => i + 1) } })
        getGroups.mockResolvedValue(lista([g]))
        await propsDa({ search: 'x' })
        expect(getArtistsByIds).toHaveBeenCalledTimes(1)
        getArtistsByIds.mockRejectedValue(new Error('WP'))
        expect((await propsDa({ search: 'x' })).groups).toHaveLength(1)
    })
})

describe.skipIf(!OUTRO)('GroupsListagem — outro idioma', () => {
    it('só entram grupos traduzidos, localizados; sem endpoint de letras nem prateleira', async () => {
        getGroups.mockResolvedValue(lista([grupo({ traduzido: true }), grupo({ traduzido: false })]))
        getAllGroups.mockResolvedValue([grupo({ traduzido: true }, 'Alfa'), grupo({ traduzido: true }, 'Beta'), grupo({ traduzido: true }, 'Bravo'), grupo({ traduzido: true }, '3Ball'), grupo({ traduzido: false }, 'Zeta')])
        const p = await propsDa({ search: undefined }, OUTRO!)
        expect(p.groups).toHaveLength(1)
        expect(p.groups[0]).toMatchObject({ localizado: true })
        expect(wpFetch).not.toHaveBeenCalled()
        expect(p.letterCounts).toEqual({ A: 1, B: 2, Z: 1 })
        expect(p.shopProducts).toEqual([])
    })

    it('lista traduzida vazia não lança (idioma novo)', async () => {
        getGroups.mockResolvedValue(lista([]))
        expect((await propsDa({}, OUTRO!)).groups).toEqual([])
    })
})

describe('metadataGroupsListagem', () => {
    it('sem filtro: indexável, canônica /groups', async () => {
        const m = await meta()
        expect(m.robots).toBeUndefined()
        expect(String(m.alternates?.canonical)).toMatch(/\/groups$/)
    })

    it('só o tipo: canônica aponta para a página estática e não consulta a lista', async () => {
        const m = await meta({ type: 'girl_group' })
        expect(String(m.alternates?.canonical)).toMatch(/\/groups\/girl-groups$/)
        expect(getGroups).not.toHaveBeenCalled()
    })

    it('tipo com outro filtro ou página não usa a estática e não é indexado', async () => {
        const m = await meta({ type: 'girl_group', active: 'true' })
        expect(String(m.alternates?.canonical)).not.toContain('/girl-groups')
        expect(m.robots).toBeDefined()
        expect(getGroups).toHaveBeenCalled()
    })

    it('busca, letra, geração e ordem não são indexadas', async () => {
        for (const p of [{ search: 'x' }, { letter: 'a' }, { generation: '4' }, { order: 'az' }]) {
            expect((await meta(p)).robots, JSON.stringify(p)).toBeDefined()
        }
    })

    it('página 2 leva prev e next e canônica com page=2', async () => {
        getGroups.mockResolvedValue(lista([grupo()], 3))
        const m = await meta({ page: '2' })
        const { prev, next } = m.alternates as { prev?: string; next?: string }
        expect(String(m.alternates?.canonical)).toContain('page=2')
        expect(String(next)).toContain('page=3')
        expect(prev).toBeDefined()
    })
})
