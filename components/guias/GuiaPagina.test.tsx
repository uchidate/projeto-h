// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { getAllHubs, getHub, getRelatedHubs } from '@/lib/guias'
import { findAgencyId, getHubItems } from '@/lib/guias/hub-items'
import { getMapaDeGuias } from '@/lib/guias/i18n'
import { getGroups } from '@/lib/wordpress/groups'
import { getArtists } from '@/lib/wordpress/artists'
import { getAgencyById } from '@/lib/wordpress/agencies'
import { getPosts } from '@/lib/wordpress/posts'
import { getProductionGenres } from '@/lib/wordpress/productions'
import { getVitrineGeral, getVitrineMaratona, getVitrinePorTermos } from '@/lib/wordpress/vitrine'
import { getStoreProductsByArtistId, getStoreProductsByGroupId } from '@/lib/wordpress/store'
import { buildGuiaMetadata, CHAVES_FILTRO_GUIA, GuiaPagina, type SearchParamsGuia } from './GuiaPagina'

interface Props {
    total: number
    page: number
    totalPages: number
    rotulo: string
    introDepois: boolean
    semLista: boolean
    listaTitulo?: { eyebrow: string; title: string }
    itensBusca: { rotulo: string; href: string; tipo: string; palavras: string }[]
    destaques: { id: number }[]
    genreMap: Record<number, { name: string; slug: string }>
    activeFilters: Record<string, string | undefined>
    productions?: unknown[]
    artists?: { id: number }[]
    groups?: unknown[]
    blogPosts: unknown[]
    relatedHubs: unknown[]
}
const captura = vi.hoisted(() => ({ props: null as unknown }))
const props = () => captura.props as Props

vi.mock('next/navigation', () => ({
    notFound: () => { throw new Error('NEXT_NOT_FOUND') },
}))
vi.mock('@/lib/guias', () => ({
    getAllHubs: vi.fn(), getHub: vi.fn(), getRelatedHubs: vi.fn(), rotuloDoGuia: (s: string) => `rotulo:${s}`,
}))
vi.mock('@/lib/guias/hub-items', () => ({ findAgencyId: vi.fn(), getHubItems: vi.fn() }))
vi.mock('@/lib/guias/i18n', () => ({ getMapaDeGuias: vi.fn() }))
vi.mock('@/lib/wordpress/groups', () => ({ getGroups: vi.fn() }))
vi.mock('@/lib/wordpress/artists', () => ({ getArtists: vi.fn() }))
vi.mock('@/lib/wordpress/agencies', () => ({ getAgencyById: vi.fn() }))
vi.mock('@/lib/wordpress/posts', () => ({ getPosts: vi.fn() }))
vi.mock('@/lib/wordpress/productions', () => ({ getProductionGenres: vi.fn() }))
vi.mock('@/lib/wordpress/vitrine', () => ({
    getVitrineGeral: vi.fn(), getVitrineMaratona: vi.fn(), getVitrinePorTermos: vi.fn(),
}))
vi.mock('@/lib/wordpress/store', () => ({ getStoreProductsByArtistId: vi.fn(), getStoreProductsByGroupId: vi.fn() }))

vi.mock('@/components/features/HubPageContent', () => ({
    HubPageContent: (p: Props & { abertura?: ReactNode; lojaMeio?: ReactNode; quiz?: ReactNode }) => {
        captura.props = p
        return <div data-hub>{p.abertura}{p.lojaMeio}{p.quiz}</div>
    },
}))
vi.mock('@/components/guias/GruposDaAgencia', () => ({
    GruposDaAgencia: (p: { agencia: string; grupos: unknown[] }) => <div data-abertura="agencia" data-agencia={p.agencia} data-n={p.grupos.length} />,
}))
vi.mock('@/components/guias/SolistaDestaque', () => ({
    SolistaDestaque: (p: { artist: { slug: string }; grupo?: string; resumo?: string }) => (
        <div data-abertura="solista" data-slug={p.artist.slug} data-grupo={p.grupo ?? ''} data-resumo={p.resumo ?? ''} />
    ),
}))
vi.mock('@/components/guias/GrupoDestaque', () => ({
    GrupoDestaque: (p: { agencia?: string; exIntegrantes: string[]; integrantes: number }) => (
        <div data-abertura="grupo" data-agencia={p.agencia ?? ''} data-ex={p.exIntegrantes.join('|')} data-n={p.integrantes} />
    ),
}))
vi.mock('@/components/guias/DestaquesDaCategoria', () => ({
    DestaquesDaCategoria: (p: { artists: unknown[]; rotulo: string }) => <div data-abertura="categoria" data-n={p.artists.length} data-rotulo={p.rotulo} />,
}))
vi.mock('@/components/ui/LojaEmLinha', () => ({
    LojaEmLinha: (p: { title: string; products: { id: number }[]; contexto: string }) => (
        <div data-loja data-titulo={p.title} data-ids={p.products.map(x => x.id).join(',')} data-contexto={p.contexto} />
    ),
}))
vi.mock('@/components/ui/QuizWidget', () => ({ QuizWidget: (p: { category: string }) => <div data-quiz={p.category} /> }))

type Obj = Record<string, unknown>

function guia(over: Obj = {}, filter: Obj = {}) {
    return {
        slug: 'melhores-artistas', title: 'Guia dos artistas', shortTitle: 'Artistas',
        description: 'Descrição do guia', keywords: ['artistas coreanos'], kind: 'artists',
        seoTitle: '', seoDescription: '', filter, ...over,
    }
}
const artista = (id: number, slug = `a${id}`) => ({ id, slug, title: { rendered: `Artista ${id}` } })
const grupo = (id: number, titulo = `Grupo ${id}`, acf: Obj = {}) => ({ id, slug: `g${id}`, title: { rendered: titulo }, acf })
const producao = (id: number, rating?: number) => ({ id, acf: rating === undefined ? {} : { rating } })
const prod = (id: number) => ({ id })

function configurar(hub: unknown, resultado: Obj = { kind: 'artists', items: [], total: 0 }) {
    vi.mocked(getHub).mockResolvedValue(hub as never)
    vi.mocked(getHubItems).mockResolvedValue(resultado as never)
}

async function montar(slug = 'melhores-artistas', sp: SearchParamsGuia = {}) {
    return render(await GuiaPagina({ slug, sp }))
}
const loja = (c: HTMLElement) => c.querySelector('[data-loja]')!
const abertura = (c: HTMLElement) => c.querySelector('[data-abertura]')

beforeEach(() => {
    captura.props = null
    configurar(guia())
    vi.mocked(getAllHubs).mockResolvedValue([])
    vi.mocked(getRelatedHubs).mockResolvedValue([])
    vi.mocked(getPosts).mockResolvedValue({ items: [] } as never)
    vi.mocked(getProductionGenres).mockResolvedValue([])
    vi.mocked(getGroups).mockResolvedValue({ items: [] } as never)
    vi.mocked(getArtists).mockResolvedValue({ items: [] } as never)
    vi.mocked(getVitrinePorTermos).mockResolvedValue([])
    vi.mocked(getVitrineGeral).mockResolvedValue([prod(900)] as never)
    vi.mocked(getVitrineMaratona).mockResolvedValue([prod(800)] as never)
    vi.mocked(getStoreProductsByArtistId).mockResolvedValue([])
    vi.mocked(getStoreProductsByGroupId).mockResolvedValue([])
    vi.mocked(findAgencyId).mockResolvedValue(null as never)
    vi.mocked(getAgencyById).mockResolvedValue(null as never)
    vi.mocked(getMapaDeGuias).mockResolvedValue({ alternativas: () => null } as never)
})
afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

describe('buildGuiaMetadata', () => {
    const meta = () => buildGuiaMetadata({ params: Promise.resolve({ slug: 'melhores-artistas' }) })

    it('guia inexistente devolve vazio', async () => {
        vi.mocked(getHub).mockResolvedValue(null as never)
        expect(await meta()).toEqual({})
    })

    it('usa título e descrição do guia, com canonical e palavras-chave', async () => {
        const m = await meta()
        expect(m.title).toBe('Guia dos artistas')
        expect(m.description).toBe('Descrição do guia')
        expect(m.keywords).toEqual(['artistas coreanos'])
        expect(m.alternates?.canonical).toMatch(/\/guias\/melhores-artistas$/)
    })

    it('Rank Math do guia tem prioridade', async () => {
        configurar(guia({ seoTitle: 'Título SEO', seoDescription: 'Desc SEO' }))
        const m = await meta()
        expect(m.title).toBe('Título SEO')
        expect(m.description).toBe('Desc SEO')
    })

    it('hreflang só quando há versões traduzidas', async () => {
        expect((await meta()).alternates).not.toHaveProperty('languages')
        vi.mocked(getMapaDeGuias).mockResolvedValue({ alternativas: () => ({ en: '/en/guides/x' }) } as never)
        expect((await meta()).alternates?.languages).toEqual({ en: '/en/guides/x' })
    })
})

describe('GuiaPagina: parâmetros e paginação', () => {
    it('guia inexistente cai em notFound', async () => {
        vi.mocked(getHub).mockResolvedValue(null as never)
        await expect(GuiaPagina({ slug: 'x', sp: {} })).rejects.toThrow('NEXT_NOT_FOUND')
    })

    it('as chaves de filtro são as que mudam o conteúdo', () => {
        expect([...CHAVES_FILTRO_GUIA]).toEqual(['page', 'genre', 'platform', 'network', 'type', 'year'])
    })

    it('lê filtros da query e repassa à busca', async () => {
        await montar('melhores-artistas', { page: '3', genre: 'romance', platform: 'netflix', network: 'tvn', type: 'drama', year: '2024' })
        expect(getHubItems).toHaveBeenCalledWith(expect.anything(), { page: 3, genre: 'romance', platform: 'netflix', network: 'tvn', type: 'drama', year: 2024 })
        expect(props().activeFilters).toEqual({ genre: 'romance', platform: 'netflix', network: 'tvn', type: 'drama', year: '2024' })
        expect(props().page).toBe(3)
    })

    it('página inválida ou negativa vira 1; array e ano inválido são ignorados', async () => {
        await montar('melhores-artistas', { page: '-4', genre: ['a', 'b'], year: 'abc' })
        expect(getHubItems).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ page: 1, genre: undefined, year: undefined }))
    })

    it('o tipo do guia vale quando a query não traz tipo', async () => {
        configurar(guia({}, { type: 'movie' }))
        await montar()
        expect(props().activeFilters.type).toBe('movie')
    })

    it('48 por página: total de páginas, mapa de gêneros e rótulo', async () => {
        configurar(guia(), { kind: 'artists', items: [], total: 97 })
        vi.mocked(getProductionGenres).mockResolvedValue([{ id: 5, name: 'Romance', slug: 'romance' }] as never)
        await montar()
        expect(props().totalPages).toBe(3)
        expect(props().genreMap).toEqual({ 5: { name: 'Romance', slug: 'romance' } })
        expect(props().rotulo).toBe('rotulo:melhores-artistas')
    })

    it('busca interna lista todos os guias com o tipo em português', async () => {
        vi.mocked(getAllHubs).mockResolvedValue([
            { slug: 'a', shortTitle: 'A', kind: 'productions', keywords: ['x', 'y'] },
            { slug: 'b', shortTitle: 'B', kind: 'artists', keywords: [] },
            { slug: 'c', shortTitle: 'C', kind: 'groups', keywords: [] },
        ] as never)
        await montar()
        expect(props().itensBusca).toEqual([
            { rotulo: 'A', href: '/guias/a', tipo: 'Produções', palavras: 'x y' },
            { rotulo: 'B', href: '/guias/b', tipo: 'Artistas', palavras: '' },
            { rotulo: 'C', href: '/guias/c', tipo: 'Grupos', palavras: '' },
        ])
    })

    it('entrega só o tipo de resultado do guia', async () => {
        configurar(guia({ kind: 'productions' }), { kind: 'productions', items: [producao(1)], total: 1 })
        await montar('dorama-x')
        expect(props().productions).toHaveLength(1)
        expect(props().artists).toBeUndefined()
        expect(props().groups).toBeUndefined()
    })
})

describe('GuiaPagina: comece por aqui (produções)', () => {
    const lista = [producao(1, 9.9), producao(2, 7.4), producao(3, 7.5), producao(4), producao(5, 9.7), producao(6, 8), producao(7, 8), producao(8, 8), producao(9, 8), producao(10, 8)]

    it('só nota de 7,5 a 9,8, na ordem da página, no máximo 6', async () => {
        configurar(guia({ kind: 'productions' }), { kind: 'productions', items: lista, total: 10 })
        await montar('dorama-x')
        expect(props().destaques.map(p => p.id)).toEqual([3, 5, 6, 7, 8, 9])
    })

    it('some com filtro ativo ou depois da primeira página', async () => {
        configurar(guia({ kind: 'productions' }), { kind: 'productions', items: lista, total: 10 })
        await montar('dorama-x', { genre: 'romance' })
        expect(props().destaques).toEqual([])
        await montar('dorama-x', { page: '2' })
        expect(props().destaques).toEqual([])
    })
})

describe('GuiaPagina: posts do blog', () => {
    it('guia de um artista busca posts que o citam', async () => {
        configurar(guia({}, { artistSlug: 'iu' }), { kind: 'artists', items: [artista(1, 'iu')], total: 1 })
        await montar()
        expect(getPosts).toHaveBeenCalledWith({ mentionsType: 'artist', mentionsSlug: 'iu', perPage: 3, includeContent: false })
    })

    it('guia de integrantes busca posts do grupo', async () => {
        configurar(guia({}, { groupSlug: 'twice' }))
        await montar()
        expect(getPosts).toHaveBeenCalledWith({ mentionsType: 'group', mentionsSlug: 'twice', perPage: 3, includeContent: false })
    })

    it('demais guias buscam pela primeira palavra-chave', async () => {
        await montar()
        expect(getPosts).toHaveBeenCalledWith({ search: 'artistas coreanos', perPage: 3, includeContent: false })
    })
})

describe('GuiaPagina: vitrine por tipo de guia', () => {
    it('guia de dorama usa quiz de k-drama e petisco para maratonar', async () => {
        configurar(guia({ slug: 'melhores-doramas', shortTitle: 'Doramas de romance', kind: 'productions' }), { kind: 'productions', items: [], total: 0 })
        const { container } = await montar('melhores-doramas')
        expect(container.querySelector('[data-quiz]')!.getAttribute('data-quiz')).toBe('k-drama')
        expect(loja(container).getAttribute('data-titulo')).toBe('Para maratonar doramas de romance')
        expect(loja(container).getAttribute('data-ids')).toBe('800')
        expect(getVitrinePorTermos).not.toHaveBeenCalled()
        expect(getVitrineMaratona).toHaveBeenCalledWith('guia:melhores-doramas', 6)
    })

    it('guia de K-pop sem casamento cai em merch geral', async () => {
        const { container } = await montar()
        expect(container.querySelector('[data-quiz]')!.getAttribute('data-quiz')).toBe('k-pop')
        expect(loja(container).getAttribute('data-titulo')).toBe('Achados de K-pop')
        expect(getVitrineGeral).toHaveBeenCalledWith('guia:melhores-artistas', 6, 'merch')
    })

    it('com 3 produtos casados a faixa vira temática e não usa a reserva', async () => {
        vi.mocked(getVitrinePorTermos).mockResolvedValue([prod(1), prod(2), prod(3)] as never)
        const { container } = await montar()
        expect(loja(container).getAttribute('data-titulo')).toBe('Na loja: Artistas')
        expect(loja(container).getAttribute('data-ids')).toBe('1,2,3')
        expect(getVitrineGeral).not.toHaveBeenCalled()
    })

    it('com menos de 3 casados usa a reserva; falha na busca também', async () => {
        vi.mocked(getVitrinePorTermos).mockResolvedValue([prod(1), prod(2)] as never)
        expect(loja((await montar()).container).getAttribute('data-ids')).toBe('900')
        cleanup()
        vi.mocked(getVitrinePorTermos).mockRejectedValue(new Error('wp'))
        expect(loja((await montar()).container).getAttribute('data-ids')).toBe('900')
    })

    it('termos de busca tiram palavras genéricas e as curtas', async () => {
        configurar(guia({ title: 'Melhores grupos de K-pop', shortTitle: 'Girl groups', keywords: ['k-pop', 'BTS famosos', 'ab'] }))
        await montar()
        expect(vi.mocked(getVitrinePorTermos).mock.calls[0][0]).toEqual(['Girl groups', 'BTS'])
        expect(vi.mocked(getVitrinePorTermos).mock.calls[0][1]).toBe('guia:melhores-artistas')
    })
})

describe('GuiaPagina: guia de grupo', () => {
    const twice = grupo(7, 'TWICE', { agency: 11 })

    beforeEach(() => {
        configurar(
            guia({}, { groupSlug: 'twice' }),
            { kind: 'artists', items: [artista(1), artista(2), artista(3), artista(4), artista(5)], total: 5 },
        )
        vi.mocked(getGroups).mockResolvedValue({ items: [{ ...twice, former_member_slugs: ['x|Ex Um', 'ex-dois'] }] } as never)
        vi.mocked(getAgencyById).mockResolvedValue({ title: { rendered: 'JYP' } } as never)
    })

    it('abre com o grupo, agência, ex-integrantes e número de integrantes', async () => {
        const { container } = await montar()
        expect(getGroups).toHaveBeenCalledWith({ slug: 'twice', perPage: 1 })
        const a = abertura(container)!
        expect(a.getAttribute('data-abertura')).toBe('grupo')
        expect(a.getAttribute('data-agencia')).toBe('JYP')
        expect(a.getAttribute('data-ex')).toBe('Ex Um|ex dois')
        expect(a.getAttribute('data-n')).toBe('5')
        expect(props().listaTitulo).toEqual({ eyebrow: '5 integrantes', title: 'Integrantes' })
        expect(props().introDepois).toBe(true)
    })

    it('produtos do grupo e dos 4 primeiros integrantes, intercalados e sem repetir', async () => {
        vi.mocked(getStoreProductsByGroupId).mockResolvedValue([prod(1), prod(2)] as never)
        vi.mocked(getStoreProductsByArtistId).mockImplementation((async (id: number) => (id === 1 ? [prod(1), prod(10)] : id === 2 ? [prod(20)] : [])) as never)
        const { container } = await montar()
        expect(getStoreProductsByArtistId).toHaveBeenCalledTimes(4)
        expect(loja(container).getAttribute('data-ids')).toBe('1,20,2,10')
        expect(loja(container).getAttribute('data-titulo')).toBe('Na loja: TWICE')
    })

    it('grupo sem produto deixa a faixa vazia, sem cair em outro grupo', async () => {
        const { container } = await montar()
        expect(loja(container).getAttribute('data-ids')).toBe('')
        expect(getVitrineGeral).not.toHaveBeenCalled()
        expect(getVitrinePorTermos).not.toHaveBeenCalled()
    })

    it('falha ao buscar o grupo ou a agência não derruba a página', async () => {
        vi.mocked(getAgencyById).mockRejectedValue(new Error('wp'))
        expect(abertura((await montar()).container)!.getAttribute('data-agencia')).toBe('')
        cleanup()
        vi.mocked(getGroups).mockRejectedValue(new Error('wp'))
        const { container } = await montar()
        expect(abertura(container)).toBeNull()
        expect(loja(container).getAttribute('data-titulo')).toBe('Achados de K-pop')
    })
})

describe('GuiaPagina: guia de um artista', () => {
    beforeEach(() => {
        configurar(
            guia({ description: 'Perfil completo de IU: cantora e atriz' }, { artistSlug: 'iu' }),
            { kind: 'artists', items: [artista(1, 'iu'), artista(2), artista(3)], total: 3 },
        )
    })

    it('o artista abre a página e a lista traz só os demais', async () => {
        const { container } = await montar()
        const a = abertura(container)!
        expect(a.getAttribute('data-abertura')).toBe('solista')
        expect(a.getAttribute('data-slug')).toBe('iu')
        expect(a.getAttribute('data-grupo')).toBe('do grupo')
        expect(a.getAttribute('data-resumo')).toBe('Cantora e atriz')
        expect(props().artists!.map(x => x.id)).toEqual([2, 3])
        expect(props().total).toBe(2)
        expect(props().listaTitulo).toEqual({ eyebrow: '2 artistas', title: 'Do mesmo grupo' })
        expect(props().semLista).toBe(false)
    })

    it('solista sozinho: sem lista e sem rótulo de grupo', async () => {
        configurar(guia({}, { artistSlug: 'iu' }), { kind: 'artists', items: [artista(1, 'iu')], total: 1 })
        const { container } = await montar()
        expect(abertura(container)!.getAttribute('data-grupo')).toBe('')
        expect(props().semLista).toBe(true)
    })

    it('produtos do artista e de até 3 do grupo; sem eles a faixa fica vazia', async () => {
        vi.mocked(getStoreProductsByArtistId).mockImplementation((async (id: number) => (id === 1 ? [prod(1)] : id === 2 ? [prod(2)] : [])) as never)
        const { container } = await montar()
        expect(loja(container).getAttribute('data-ids')).toBe('1,2')
        expect(loja(container).getAttribute('data-titulo')).toBe('Na loja: Artista 1')
        cleanup()
        vi.mocked(getStoreProductsByArtistId).mockRejectedValue(new Error('wp'))
        expect(loja((await montar()).container).getAttribute('data-ids')).toBe('')
    })
})

describe('GuiaPagina: guia de agência', () => {
    beforeEach(() => {
        configurar(guia({ shortTitle: 'JYP' }, { agencyName: 'JYP Entertainment' }), { kind: 'artists', items: [artista(1)], total: 1 })
        vi.mocked(findAgencyId).mockResolvedValue(11 as never)
    })

    it('os grupos vêm primeiro, por popularidade', async () => {
        vi.mocked(getGroups).mockResolvedValue({ items: [grupo(1), grupo(2)] } as never)
        const { container } = await montar()
        const a = abertura(container)!
        expect(a.getAttribute('data-abertura')).toBe('agencia')
        expect(a.getAttribute('data-n')).toBe('2')
        expect(getGroups).toHaveBeenCalledWith({ agency: 11, perPage: 24, orderby: 'popularity', order: 'desc' })
        expect(getGroups).toHaveBeenCalledTimes(1)
    })

    it('sem leitura de popularidade tenta por título', async () => {
        vi.mocked(getGroups).mockImplementation((async (a: { orderby?: string }) => ({ items: a.orderby === 'title' ? [grupo(3)] : [] })) as never)
        expect(abertura((await montar()).container)!.getAttribute('data-n')).toBe('1')
        expect(getGroups).toHaveBeenLastCalledWith({ agency: 11, perPage: 24, orderby: 'title', order: 'asc' })
    })

    it('agência desconhecida, filtro ou página 2 não mostram grupos', async () => {
        vi.mocked(findAgencyId).mockResolvedValue(null as never)
        expect(abertura((await montar()).container)).toBeNull()
        cleanup()
        vi.mocked(findAgencyId).mockResolvedValue(11 as never)
        vi.mocked(getGroups).mockResolvedValue({ items: [grupo(1)] } as never)
        expect(abertura((await montar('melhores-artistas', { page: '2' })).container)).toBeNull()
    })

    it('os nomes dos grupos entram nos termos da vitrine', async () => {
        vi.mocked(getGroups).mockResolvedValue({ items: [grupo(1, 'TWICE'), grupo(2, 'Stray Kids')] } as never)
        await montar()
        const termos = vi.mocked(getVitrinePorTermos).mock.calls[0][0]
        expect(termos).toEqual(expect.arrayContaining(['TWICE', 'Stray Kids']))
    })

    it('falha ao buscar os grupos não derruba a página', async () => {
        vi.mocked(getGroups).mockRejectedValue(new Error('wp'))
        expect(abertura((await montar()).container)).toBeNull()
    })
})

describe('GuiaPagina: guia por categoria', () => {
    beforeEach(() => {
        configurar(guia({ shortTitle: 'Atrizes' }, { role: 'actress', gender: 'female' }), { kind: 'artists', items: [], total: 120 })
        vi.mocked(getArtists).mockResolvedValue({ items: [artista(1), artista(2)] } as never)
    })

    it('os 12 de maior peso abrem a página, antes da lista de A a Z', async () => {
        const { container } = await montar()
        const a = abertura(container)!
        expect(a.getAttribute('data-abertura')).toBe('categoria')
        expect(a.getAttribute('data-n')).toBe('2')
        expect(a.getAttribute('data-rotulo')).toBe('Atrizes')
        expect(getArtists).toHaveBeenCalledWith({ role: 'actress', gender: 'female', perPage: 12, orderby: 'popularity', order: 'desc' })
        expect(props().listaTitulo).toEqual({ eyebrow: '120 artistas', title: 'Todos, de A a Z' })
    })

    it('com filtro ativo, de agência ou de grupo não há destaque', async () => {
        expect(abertura((await montar('melhores-artistas', { genre: 'x' })).container)).toBeNull()
        cleanup()
        configurar(guia({}, { role: 'actress', agencyName: 'JYP' }))
        expect(abertura((await montar()).container)).toBeNull()
        expect(getArtists).not.toHaveBeenCalled()
    })

    it('falha ao buscar destaques não derruba a página', async () => {
        vi.mocked(getArtists).mockRejectedValue(new Error('wp'))
        const { container } = await montar()
        expect(abertura(container)).toBeNull()
        expect(props().listaTitulo).toBeUndefined()
    })
})
