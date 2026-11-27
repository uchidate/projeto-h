import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

// Cobre o que a página da conta decide: redireciona quem não entrou, recorta e ordena cada faixa
// (favoritos, quero ver, assistindo, salvos, lidos, seguidos), degrada com o WordPress fora e calcula os dias de conta.
const m = vi.hoisted(() => ({
    session: null as null | { user: { name?: string | null; email?: string | null; image?: string | null } },
    stats: vi.fn(), favs: vi.fn(), watch: vi.fn(), states: vi.fn(), statuses: vi.fn(),
    prods: vi.fn(), posts: vi.fn(), artists: vi.fn(), groups: vi.fn(),
}))

vi.mock('next-auth', () => ({ getServerSession: async () => m.session }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/auth/wpToken', () => ({ getWpToken: async () => 'tok' }))
vi.mock('next/navigation', () => ({ redirect: (to: string) => { throw new Error(`REDIRECT:${to}`) } }))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (k: string) => k }))
vi.mock('@/components/features/DashboardClient', () => ({ DashboardClient: () => null }))
vi.mock('@/lib/wordpress/userApi', () => ({
    getUserStats: m.stats, getUserFavorites: m.favs, getUserWatchlist: m.watch,
    getUserContentStates: m.states, getUserProductionStatuses: m.statuses,
}))
vi.mock('@/lib/wordpress/productions', () => ({ getProductionsByIds: m.prods }))
vi.mock('@/lib/wordpress/posts', () => ({ getPosts: m.posts }))
vi.mock('@/lib/wordpress/artists', () => ({ getArtistsByIds: m.artists }))
vi.mock('@/lib/wordpress/groups', () => ({ getGroupsByIds: m.groups }))

import DashboardPage, { metadataDaPagina } from './DashboardPagina'
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config'

const OUTRO = ACTIVE_LOCALES.find((l) => l !== DEFAULT_LOCALE)

type Estado = { objectType: string; objectId: number; state: string; updatedAt?: string }
const vazioEstados = { states: [] as Estado[], counts: {}, countsByState: {} }
const item = (id: number) => ({ id })
type Lista = { id: number }[]
type PropsDoPainel = {
    user: { name: string; email: string; image: string | null }
    stats: { favoritesCount: number; watchlistCount: number; joinDate: string; daysSinceJoin: number | null }
    favProductions: Lista; watchProductions: Lista; watchingProductions: Lista
    savedPosts: Lista; readPosts: Lista; followedArtists: Lista; followedGroups: Lista; latestPosts: Lista
}
const LISTAS = ['favProductions', 'watchProductions', 'watchingProductions', 'savedPosts', 'readPosts', 'followedArtists', 'followedGroups'] as const

async function props(locale?: typeof DEFAULT_LOCALE) {
    const el = (await DashboardPage({ locale })) as unknown as { props: PropsDoPainel }
    return el.props
}
const idsDe = (lista: { id: number }[]) => lista.map((x) => x.id)

beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-27T12:00:00Z'))
    m.session = { user: { name: 'Ana', email: 'ana@x.com', image: null } }
    m.stats.mockResolvedValue({ favoritesCount: 2, watchlistCount: 1, joinDate: '2026-11-17T12:00:00Z' })
    m.favs.mockResolvedValue([])
    m.watch.mockResolvedValue([])
    m.states.mockResolvedValue(vazioEstados)
    m.statuses.mockResolvedValue({ statuses: {}, counts: {} })
    m.prods.mockImplementation(async (ids: number[]) => ids.map(item))
    m.posts.mockResolvedValue({ items: [], total: 0, totalPages: 0 })
    m.artists.mockImplementation(async (ids: number[]) => ids.map(item))
    m.groups.mockImplementation(async (ids: number[]) => ids.map(item))
})
afterEach(() => vi.useRealTimers())

describe('DashboardPagina — acesso', () => {
    it('sem sessão, manda para o login e volta ao painel depois', async () => {
        m.session = null
        await expect(DashboardPage({})).rejects.toThrow(/^REDIRECT:.*callbackUrl=/)
        expect(m.stats).not.toHaveBeenCalled()
    })

    it('repassa nome, e-mail e imagem; campos ausentes viram vazio ou nulo', async () => {
        m.session = { user: {} }
        const p = await props()
        expect(p.user).toEqual({ name: '', email: '', image: null })
    })

    it('metadados: sem indexação e com o título traduzido', async () => {
        const meta = await metadataDaPagina()
        expect(meta.title).toBe('wave')
        expect(meta.robots).toEqual({ index: false, follow: true })
    })
})

describe('DashboardPagina — faixas de produções', () => {
    it('favoritos e quero ver: os 6 últimos, do mais recente ao mais antigo', async () => {
        m.favs.mockResolvedValue([1, 2, 3, 4, 5, 6, 7, 8])
        m.watch.mockResolvedValue([10, 11])
        const p = await props()
        expect(idsDe(p.favProductions)).toEqual([8, 7, 6, 5, 4, 3])
        expect(idsDe(p.watchProductions)).toEqual([11, 10])
    })

    it('"assistindo" só pega o status watching, ignora id inválido e limita a 6', async () => {
        m.statuses.mockResolvedValue({
            statuses: { 1: 'watching', 2: 'watched', 3: 'want', 4: 'watching', abc: 'watching', 5: 'watching', 6: 'watching', 7: 'watching', 8: 'watching', 9: 'watching' },
            counts: {},
        })
        const p = await props()
        // as chaves numéricas vêm em ordem crescente; o recorte pega do fim para o começo e cai em 6
        expect(idsDe(p.watchingProductions)).toEqual([9, 8, 7, 6, 5, 4])
    })

    it('sem ids, não busca produção nenhuma', async () => {
        const p = await props()
        expect(m.prods).not.toHaveBeenCalled()
        expect(p.favProductions).toEqual([])
    })

    it('falha na busca de produções vira lista vazia, sem derrubar a página', async () => {
        m.favs.mockResolvedValue([1])
        m.prods.mockRejectedValue(new Error('wp fora'))
        const p = await props()
        expect(p.favProductions).toEqual([])
    })
})

describe('DashboardPagina — posts salvos e lidos', () => {
    const estados: Estado[] = [
        { objectType: 'post', objectId: 1, state: 'saved', updatedAt: '2026-11-01' },
        { objectType: 'post', objectId: 2, state: 'saved', updatedAt: '2026-11-20' },
        { objectType: 'post', objectId: 3, state: 'read', updatedAt: '2026-11-10' },
        { objectType: 'post', objectId: 4, state: 'read', updatedAt: '2026-11-25' },
        { objectType: 'artist', objectId: 99, state: 'saved', updatedAt: '2026-11-26' },
    ]

    it('busca por ids na ordem do estado mais recente, mesmo que o WP devolva embaralhado', async () => {
        m.states.mockResolvedValue({ ...vazioEstados, states: estados })
        m.posts.mockImplementation(async (args: { includeIds?: number[] }) => ({ items: args.includeIds ? [...args.includeIds].reverse().map(item) : [], total: 0, totalPages: 0 }))
        const p = await props()
        expect(idsDe(p.savedPosts)).toEqual([2, 1])
        expect(idsDe(p.readPosts)).toEqual([4, 3])
    })

    it('só entram posts: outros tipos com o mesmo estado ficam de fora', async () => {
        m.states.mockResolvedValue({ ...vazioEstados, states: estados })
        await props()
        const chamadaSalvos = m.posts.mock.calls.find(([a]) => a.includeIds?.includes(2))![0]
        expect(chamadaSalvos.includeIds).toEqual([2, 1])
        expect(chamadaSalvos.perPage).toBe(2)
    })

    it('um post salvo não repete em "lidos"', async () => {
        m.states.mockResolvedValue({
            ...vazioEstados,
            states: [
                { objectType: 'post', objectId: 1, state: 'saved', updatedAt: '2026-11-02' },
                { objectType: 'post', objectId: 1, state: 'read', updatedAt: '2026-11-03' },
                { objectType: 'post', objectId: 2, state: 'read', updatedAt: '2026-11-01' },
            ],
        })
        await props()
        const leitura = m.posts.mock.calls.map(([a]) => a.includeIds).filter(Boolean)
        expect(leitura).toEqual([[1], [2]])
    })

    it('limita a 4 salvos e 4 lidos', async () => {
        const muitos: Estado[] = Array.from({ length: 6 }, (_, i) => ({ objectType: 'post', objectId: 100 + i, state: 'saved', updatedAt: `2026-11-0${i + 1}` }))
        m.states.mockResolvedValue({ ...vazioEstados, states: muitos })
        await props()
        const chamada = m.posts.mock.calls.find(([a]) => a.includeIds)![0]
        expect(chamada.includeIds).toEqual([105, 104, 103, 102])
    })

    it('estado sem data vai para o fim', async () => {
        m.states.mockResolvedValue({
            ...vazioEstados,
            states: [
                { objectType: 'post', objectId: 1, state: 'saved' },
                { objectType: 'post', objectId: 2, state: 'saved', updatedAt: '2026-11-01' },
            ],
        })
        await props()
        expect(m.posts.mock.calls.find(([a]) => a.includeIds)![0].includeIds).toEqual([2, 1])
    })

    it('falha na busca de posts salvos vira lista vazia', async () => {
        m.states.mockResolvedValue({ ...vazioEstados, states: estados })
        m.posts.mockImplementation(async (args: { includeIds?: number[] }) => {
            if (args.includeIds) throw new Error('wp fora')
            return { items: [item(50)], total: 1, totalPages: 1 }
        })
        const p = await props()
        expect(p.savedPosts).toEqual([])
        expect(p.readPosts).toEqual([])
        expect(idsDe(p.latestPosts)).toEqual([50])
    })
})

describe('DashboardPagina — artistas e grupos seguidos', () => {
    const seguindo = (tipo: string, id: number, data: string): Estado => ({ objectType: tipo, objectId: id, state: 'following', updatedAt: data })

    it('só entram os que estão em "seguindo", do mais recente ao mais antigo, e na ordem mesmo com resposta embaralhada', async () => {
        m.states.mockResolvedValue({
            ...vazioEstados,
            states: [seguindo('artist', 1, '2026-11-01'), seguindo('artist', 2, '2026-11-09'), { objectType: 'artist', objectId: 3, state: 'favorite', updatedAt: '2026-11-20' }, seguindo('group', 7, '2026-11-02'), seguindo('group', 8, '2026-11-05')],
        })
        m.artists.mockImplementation(async (ids: number[]) => [...ids].reverse().map(item))
        const p = await props()
        expect(idsDe(p.followedArtists)).toEqual([2, 1])
        expect(idsDe(p.followedGroups)).toEqual([8, 7])
    })

    it('limita a 6 de cada', async () => {
        m.states.mockResolvedValue({ ...vazioEstados, states: Array.from({ length: 9 }, (_, i) => seguindo('artist', i + 1, `2026-11-${10 + i}`)) })
        const p = await props()
        expect(p.followedArtists).toHaveLength(6)
        expect(m.groups).not.toHaveBeenCalled()
    })

    it('falha ao buscar artistas ou grupos vira lista vazia', async () => {
        m.states.mockResolvedValue({ ...vazioEstados, states: [seguindo('artist', 1, '2026-11-01'), seguindo('group', 2, '2026-11-01')] })
        m.artists.mockRejectedValue(new Error('x'))
        m.groups.mockRejectedValue(new Error('x'))
        const p = await props()
        expect(p.followedArtists).toEqual([])
        expect(p.followedGroups).toEqual([])
    })
})

describe('DashboardPagina — estatísticas e degradação', () => {
    it('calcula os dias desde a entrada', async () => {
        const p = await props()
        expect(p.stats.daysSinceJoin).toBe(10)
        expect(p.stats.favoritesCount).toBe(2)
    })

    it('data de entrada no futuro não dá dias negativos', async () => {
        m.stats.mockResolvedValue({ favoritesCount: 0, watchlistCount: 0, joinDate: '2026-12-25T00:00:00Z' })
        expect((await props()).stats.daysSinceJoin).toBe(0)
    })

    it('sem data de entrada, os dias ficam nulos', async () => {
        m.stats.mockResolvedValue({ favoritesCount: 0, watchlistCount: 0, joinDate: '' })
        expect((await props()).stats.daysSinceJoin).toBeNull()
    })

    it('com todo o WordPress fora, a página sai vazia em vez de quebrar', async () => {
        for (const f of [m.stats, m.favs, m.watch, m.states, m.statuses, m.posts]) f.mockRejectedValue(new Error('wp fora'))
        const p = await props()
        expect(p.stats).toEqual({ favoritesCount: 0, watchlistCount: 0, joinDate: '', daysSinceJoin: null })
        expect(p.latestPosts).toEqual([])
        for (const k of LISTAS) expect(p[k]).toEqual([])
    })

    it('as últimas do blog são 4, no idioma padrão sem filtro de idioma', async () => {
        await props()
        expect(m.posts).toHaveBeenCalledWith({ perPage: 4, lang: undefined })
    })
})

describe.skipIf(!OUTRO)('DashboardPagina — outro idioma', () => {
    it('pede as últimas do blog no idioma da página', async () => {
        await props(OUTRO as never)
        expect(m.posts).toHaveBeenCalledWith({ perPage: 4, lang: OUTRO })
    })
})
