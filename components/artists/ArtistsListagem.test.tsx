import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config'

// Cobre o que a /artists decide: ordenação, filtro por grupo (?group=), faixas da página inicial
// (aniversários, Em alta, Por grupo), nome do grupo no cartão, lista vazia lançando (ISR) e metadados.
const getArtists = vi.fn()
const getArtistsByIds = vi.fn()
const getGroups = vi.fn()
const getGroupsByIds = vi.fn()
const getGroupBySlug = vi.fn()
const wpFetch = vi.fn()
const getFeaturedStoreProducts = vi.fn()
const aniversariosDaSemana = vi.fn()
const notFound = vi.fn(() => { throw new Error('NEXT_NOT_FOUND') })

vi.mock('@/lib/wordpress/artists', () => ({
    getArtists: (...a: unknown[]) => getArtists(...a),
    getArtistsByIds: (...a: unknown[]) => getArtistsByIds(...a),
}))
vi.mock('@/lib/wordpress/groups', () => ({
    getGroups: (...a: unknown[]) => getGroups(...a),
    getGroupsByIds: (...a: unknown[]) => getGroupsByIds(...a),
    getGroupBySlug: (...a: unknown[]) => getGroupBySlug(...a),
}))
vi.mock('@/lib/wordpress/client', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/wordpress/client')>()),
    wpFetch: (...a: unknown[]) => wpFetch(...a),
}))
vi.mock('@/lib/wordpress/store', () => ({ getFeaturedStoreProducts: (...a: unknown[]) => getFeaturedStoreProducts(...a) }))
vi.mock('@/lib/wordpress/store-ranking', () => ({ ordenarPrateleira: (p: unknown[]) => p }))
vi.mock('@/lib/artists/aniversarios', () => ({
    hojeEmSaoPaulo: () => ({ mes: 11, dia: 15 }),
    mesesDaJanela: () => [11, 12],
    aniversariosDaSemana: (...a: unknown[]) => aniversariosDaSemana(...a),
    TEXTOS_ANIVERSARIO_PT: { hoje: 'hoje', idade: 'anos', meses: [] },
}))
vi.mock('@/components/features/LocalizedCatalog', () => ({ defaultCatalogLanguages: () => ({}) }))
vi.mock('@/lib/i18n/entity-translation', () => ({
    hasLocale: (e: { traduzido?: boolean }) => e.traduzido === true,
    localizeEntity: (e: object) => ({ ...e, localizado: true }),
}))
vi.mock('next/navigation', () => ({ notFound: () => notFound() }))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (k: string) => k }))
vi.mock('@/components/seo/PageBreadcrumb', () => ({ PageBreadcrumb: () => null }))
vi.mock('@/components/artists/ArtistsPage', () => ({ ArtistsPage: () => null }))

import { ArtistsPage } from '@/components/artists/ArtistsPage'
import { ArtistsListagem, metadataArtistsListagem, type SearchParams } from './ArtistsListagem'

const OUTRO = ACTIVE_LOCALES.find((l) => l !== DEFAULT_LOCALE)

type A = { id: number; slug: string; title: { rendered: string }; acf?: { groups?: number[]; noticias_14d?: number }; traduzido?: boolean }
let seq = 0
const artista = (extra: Partial<A> = {}, nome = `Artista ${++seq}`): A => ({ id: seq + 1000, slug: nome.toLowerCase().replace(/ /g, '-'), title: { rendered: nome }, ...extra })
const lista = (items: A[], totalPages = 1) => ({ items, total: items.length, totalPages })

type Props = Record<string, unknown> & {
    artists: A[]; emAlta: A[]; sortBy: string; aniversarios: unknown[]; shopProducts: unknown[]
    grupos: Record<number, string>; gruposEmAlta: { slug: string; nome: string }[]; grupoAtivo?: { slug: string; nome: string }
    letterCounts: Record<string, number>
}

async function propsDa(params: Awaited<SearchParams> = {}, locale = DEFAULT_LOCALE) {
    const el = (await ArtistsListagem({ searchParams: Promise.resolve(params), locale })) as ReactElement
    const filhos = (el.props as { children: ReactElement[] }).children
    return (filhos.find((c) => c && c.type === ArtistsPage) as ReactElement).props as Props
}
const meta = (params: Awaited<SearchParams> = {}, locale = DEFAULT_LOCALE) => metadataArtistsListagem({ searchParams: Promise.resolve(params), locale })

beforeEach(() => {
    for (const m of [getArtists, getArtistsByIds, getGroups, getGroupsByIds, getGroupBySlug, wpFetch, getFeaturedStoreProducts, aniversariosDaSemana, notFound]) m.mockReset()
    notFound.mockImplementation(() => { throw new Error('NEXT_NOT_FOUND') })
    getArtists.mockResolvedValue(lista([artista(), artista()]))
    getArtistsByIds.mockResolvedValue([])
    getGroups.mockResolvedValue(lista([]))
    getGroupsByIds.mockResolvedValue([])
    getGroupBySlug.mockResolvedValue(null)
    wpFetch.mockResolvedValue({ A: 4 })
    getFeaturedStoreProducts.mockResolvedValue([])
    aniversariosDaSemana.mockReturnValue([])
})

// A consulta principal é a chamada com perPage 48 (as faixas usam 60 e 100).
const consultaPrincipal = () => getArtists.mock.calls.map(([o]) => o).find((o) => o.perPage === 48)

describe('ArtistsListagem — consulta', () => {
    it('ordenação: em alta = relevância, popular = popularidade, nome = título crescente, novos = data', async () => {
        const casos: [string | undefined, string, string][] = [
            [undefined, 'relevance', 'desc'], ['popular', 'popularity', 'desc'], ['name', 'title', 'asc'], ['newest', 'date', 'desc'], ['lixo', 'relevance', 'desc'],
        ]
        for (const [sortBy, orderby, order] of casos) {
            getArtists.mockClear()
            await propsDa({ sortBy })
            expect(consultaPrincipal(), String(sortBy)).toMatchObject({ orderby, order })
        }
    })

    it('filtros viram parâmetros; afiliação inválida é ignorada; letra vira maiúscula de 1 caractere', async () => {
        await propsDa({ role: 'actor', affiliation: 'solo', letter: 'kim', search: 'iu' })
        expect(consultaPrincipal()).toMatchObject({ role: 'actor', affiliation: 'solo', letter: 'K', search: 'iu' })
        getArtists.mockClear()
        await propsDa({ affiliation: 'outra' })
        expect(consultaPrincipal()?.affiliation).toBeUndefined()
    })

    it('contagem por letra vem do WP em PT; falha vira vazio', async () => {
        expect((await propsDa()).letterCounts).toEqual({ A: 4 })
        wpFetch.mockRejectedValue(new Error('x'))
        expect((await propsDa()).letterCounts).toEqual({})
    })
})

describe('ArtistsListagem — erros e páginas', () => {
    it('lista vazia sem filtro na página 1 lança, para preservar o ISR', async () => {
        getArtists.mockResolvedValue(lista([]))
        await expect(propsDa()).rejects.toThrow(/listagem vazia/)
    })

    it('lista vazia com filtro não lança', async () => {
        getArtists.mockResolvedValue(lista([]))
        expect((await propsDa({ search: 'zzz' })).artists).toEqual([])
    })

    it('página além do fim vira 404', async () => {
        getArtists.mockResolvedValue(lista([artista()], 2))
        await expect(propsDa({ page: '4' })).rejects.toThrow('NEXT_NOT_FOUND')
    })
})

describe('ArtistsListagem — ?group=', () => {
    const grupo = (members: number[] = [1, 2]) => ({ id: 9, slug: 'aespa', title: { rendered: 'aespa' }, acf: { members } })

    it('a lista vira os integrantes do grupo, numa página só, com o grupo ativo', async () => {
        getGroupBySlug.mockResolvedValue(grupo([1, 2, 3]))
        getArtistsByIds.mockResolvedValue([artista(), artista(), artista()])
        const p = await propsDa({ group: 'aespa' })
        expect(getArtistsByIds).toHaveBeenCalledWith([1, 2, 3])
        expect(consultaPrincipal()).toBeUndefined()
        expect(p.artists).toHaveLength(3)
        expect(p.grupoAtivo).toEqual({ slug: 'aespa', nome: 'aespa' })
    })

    it('página 2 do grupo vira 404', async () => {
        getGroupBySlug.mockResolvedValue(grupo())
        getArtistsByIds.mockResolvedValue([artista()])
        await expect(propsDa({ group: 'aespa', page: '2' })).rejects.toThrow('NEXT_NOT_FOUND')
    })

    it('slug desconhecido, sem integrantes ou inválido cai na lista normal', async () => {
        await propsDa({ group: 'nao-existe' })
        expect(consultaPrincipal()).toBeDefined()
        getArtists.mockClear()
        getGroupBySlug.mockResolvedValue(grupo([]))
        await propsDa({ group: 'vazio' })
        expect(consultaPrincipal()).toBeDefined()
        getGroupBySlug.mockClear()
        await propsDa({ group: 'ABC; DROP' })
        expect(getGroupBySlug).not.toHaveBeenCalled()
    })

    it('falha ao buscar o grupo não derruba a lista', async () => {
        getGroupBySlug.mockRejectedValue(new Error('WP'))
        expect((await propsDa({ group: 'aespa' })).grupoAtivo).toBeUndefined()
    })
})

describe('ArtistsListagem — faixas', () => {
    it('página inicial: aniversários, Em alta, atalhos por grupo e loja', async () => {
        const nome = (n: string, noticias: number) => artista({ acf: { noticias_14d: noticias } }, n)
        getArtists.mockImplementation(async (o) => (o.perPage === 60 ? lista(o.page === 1 ? [nome('Baixa', 0), nome('Alta', 900)] : [nome('Media', 300)]) : lista([artista(), artista()])))
        getGroups.mockResolvedValue(lista([{ slug: 'aespa', title: { rendered: 'aespa' } }] as never))
        getFeaturedStoreProducts.mockResolvedValue([{ id: 1 }])
        aniversariosDaSemana.mockReturnValue([{ slug: 'x' }])
        const p = await propsDa()
        expect(p.emAlta.map((a) => a.slug)).toEqual(['alta', 'media'])
        expect(p.gruposEmAlta).toEqual([{ slug: 'aespa', nome: 'aespa' }])
        expect(p.aniversarios).toHaveLength(1)
        expect(p.shopProducts).toHaveLength(1)
        expect(getArtists.mock.calls.filter(([o]) => o.birthMonth).map(([o]) => o.birthMonth)).toEqual([11, 12])
    })

    it('com filtro, página 2 ou outra ordenação as faixas somem', async () => {
        getArtists.mockResolvedValue(lista([artista()], 3))
        for (const params of [{ search: 'x' }, { page: '2' }, { role: 'actor' }]) {
            const p = await propsDa(params)
            expect(p.emAlta, JSON.stringify(params)).toEqual([])
            expect(p.aniversarios).toEqual([])
            expect(p.shopProducts).toEqual([])
        }
        getArtists.mockClear()
        const p = await propsDa({ sortBy: 'name' })
        expect(p.emAlta).toEqual([])
        expect(p.aniversarios).toEqual([])
        expect(getArtists.mock.calls.filter(([o]) => o.perPage === 60)).toHaveLength(0)
    })

    it('falha nas faixas não derruba a lista', async () => {
        getArtists.mockImplementation(async (o) => { if (o.perPage === 48) return lista([artista()]); throw new Error('WP') })
        getGroups.mockRejectedValue(new Error('WP'))
        const p = await propsDa()
        expect(p.artists).toHaveLength(1)
        expect(p.emAlta).toEqual([])
        expect(p.gruposEmAlta).toEqual([])
    })

    it('o nome do grupo de cada artista vem de uma busca única, sem repetir ids', async () => {
        getArtists.mockResolvedValue(lista([artista({ acf: { groups: [7, 8] } }), artista({ acf: { groups: [7] } })]))
        getGroupsByIds.mockResolvedValue([{ id: 7, title: { rendered: 'aespa' } }, { id: 8, title: { rendered: '<b>IVE</b>' } }])
        const p = await propsDa({ search: 'x' })
        expect(getGroupsByIds).toHaveBeenCalledWith([7, 8])
        expect(p.grupos).toEqual({ 7: 'aespa', 8: 'IVE' })
    })
})

describe.skipIf(!OUTRO)('ArtistsListagem — outro idioma', () => {
    it('só artistas traduzidos, localizados; sem contagem de letras nem loja', async () => {
        getArtists.mockResolvedValue(lista([artista({ traduzido: true }), artista({ traduzido: false })]))
        const p = await propsDa({}, OUTRO!)
        expect(p.artists).toHaveLength(1)
        expect(p.artists[0]).toMatchObject({ localizado: true })
        expect(wpFetch).not.toHaveBeenCalled()
        expect(p.letterCounts).toEqual({})
        expect(p.shopProducts).toEqual([])
        expect(consultaPrincipal()).toMatchObject({ locale: OUTRO })
    })

    it('lista traduzida vazia não lança (idioma novo)', async () => {
        getArtists.mockResolvedValue(lista([]))
        expect((await propsDa({}, OUTRO!)).artists).toEqual([])
    })
})

describe('metadataArtistsListagem', () => {
    it('sem filtro: indexável e canônica /artists', async () => {
        const m = await meta()
        expect(m.robots).toBeUndefined()
        expect(String(m.alternates?.canonical)).toMatch(/\/artists$/)
    })

    it('busca, ordenação e grupo não são indexados', async () => {
        for (const p of [{ search: 'x' }, { sortBy: 'name' }, { group: 'aespa' }, { role: 'actor' }, { letter: 'a' }, { affiliation: 'solo' }]) {
            expect((await meta(p)).robots, JSON.stringify(p)).toBeDefined()
        }
    })

    it('página 2 leva prev e next e canônica com page=2', async () => {
        getArtists.mockResolvedValue(lista([artista()], 3))
        const m = await meta({ page: '2' })
        const { prev, next } = m.alternates as { prev?: string; next?: string }
        expect(String(m.alternates?.canonical)).toContain('page=2')
        expect(String(next)).toContain('page=3')
        expect(prev).toBeDefined()
    })
})
