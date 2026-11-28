// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

// Páginas da conta (minhas listas e conquistas): exigem sessão e continuam de pé quando a API do usuário falha.
const m = vi.hoisted(() => ({
    getServerSession: vi.fn(),
    getUserFavorites: vi.fn(),
    getUserWatchlist: vi.fn(),
    getUserProductionStatuses: vi.fn(),
    getUserStats: vi.fn(),
    getProductionsByIds: vi.fn(),
    redirect: vi.fn((destino: string) => { throw new Error(`redirect ${destino}`) }),
}))

vi.mock('next-auth', () => ({ getServerSession: m.getServerSession }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/auth/wpToken', () => ({ getWpToken: async () => 'token-de-teste' }))
vi.mock('next/navigation', () => ({ redirect: m.redirect }))
vi.mock('@/lib/wordpress/userApi', () => ({
    getUserFavorites: m.getUserFavorites,
    getUserWatchlist: m.getUserWatchlist,
    getUserProductionStatuses: m.getUserProductionStatuses,
    getUserStats: m.getUserStats,
}))
vi.mock('@/lib/wordpress/productions', () => ({ getProductionsByIds: m.getProductionsByIds }))
vi.mock('@/components/features/MinhasListasClient', () => ({ MinhasListasClient: () => null }))
vi.mock('next-intl/server', () => ({
    getTranslations: async () => {
        const t = (chave: string, valores?: Record<string, unknown>) => (valores ? `${chave} ${JSON.stringify(valores)}` : chave)
        return Object.assign(t, { has: () => true })
    },
}))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))

import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { buildUserAchievements } from '@/lib/userJourney'
import MinhasListasPage, { metadataDaPagina as metadataListas } from './MinhasListasPagina'
import ConquistasPage, { metadataDaPagina as metadataConquistas } from './ConquistasPagina'

const PT = DEFAULT_LOCALE
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listas = async (tab?: string) => (await MinhasListasPage({ locale: PT, searchParams: Promise.resolve({ tab }) }) as ReactElement<any>).props

beforeEach(() => {
    vi.clearAllMocks()
    m.getServerSession.mockResolvedValue({ user: {} })
    m.getUserFavorites.mockResolvedValue([])
    m.getUserWatchlist.mockResolvedValue([])
    m.getUserProductionStatuses.mockResolvedValue({ statuses: {}, counts: {} })
    m.getUserStats.mockResolvedValue({ favoritesCount: 0, watchlistCount: 0, joinDate: '' })
    m.getProductionsByIds.mockImplementation(async (ids: number[]) => ids.map(id => ({ id })))
})
afterEach(cleanup)

describe('metadata', () => {
    it('as duas páginas ficam fora do índice', async () => {
        expect((await metadataListas()).robots).toEqual({ index: false, follow: true })
        expect((await metadataConquistas()).robots).toEqual({ index: false, follow: false })
    })
})

describe('minhas listas', () => {
    it('sem sessão manda para o login com volta para as listas', async () => {
        m.getServerSession.mockResolvedValue(null)
        await expect(listas()).rejects.toThrow(`redirect ${href('login', undefined, PT)}?callbackUrl=${href('myLists', undefined, PT)}`)
        expect(m.getUserFavorites).not.toHaveBeenCalled()
    })

    it('mostra o mais recente primeiro e separa assistindo de assistidos', async () => {
        m.getUserFavorites.mockResolvedValue([1, 2])
        m.getUserWatchlist.mockResolvedValue([3, 4])
        m.getUserProductionStatuses.mockResolvedValue({ statuses: { 5: 'watching', 6: 'watched', 7: 'watching', 8: 'want', abc: 'watched' } })
        const props = await listas('assistindo')
        expect(props.initialTab).toBe('assistindo')
        expect(props.favProductions).toEqual([{ id: 2 }, { id: 1 }])
        expect(props.watchProductions).toEqual([{ id: 4 }, { id: 3 }])
        expect(props.watchingIds).toEqual([7, 5])
        expect(props.watchedIds).toEqual([6])
        expect(props.favoriteIds).toEqual([1, 2])
    })

    it('aba desconhecida cai em favoritos e lista vazia não consulta produções', async () => {
        const props = await listas('qualquer')
        expect(props.initialTab).toBe('favoritos')
        expect(m.getProductionsByIds).not.toHaveBeenCalled()
    })

    it('falha da API do usuário ou das produções deixa a lista vazia', async () => {
        m.getUserFavorites.mockResolvedValue([1])
        m.getUserWatchlist.mockRejectedValue(new Error('API'))
        m.getUserProductionStatuses.mockRejectedValue(new Error('API'))
        m.getProductionsByIds.mockRejectedValue(new Error('WP'))
        const props = await listas()
        expect(props.favProductions).toEqual([])
        expect(props.watchlistIds).toEqual([])
        expect(props.watchingIds).toEqual([])
    })
})

describe('conquistas', () => {
    const total = buildUserAchievements({ favoritesCount: 0, watchlistCount: 0 }).length

    it('sem sessão manda para o login com volta para as conquistas', async () => {
        m.getServerSession.mockResolvedValue(null)
        await expect(ConquistasPage({})).rejects.toThrow(`callbackUrl=${href('achievements', undefined, PT)}`)
        expect(m.getUserStats).not.toHaveBeenCalled()
    })

    it('com a API fora mostra tudo bloqueado e a próxima conquista', async () => {
        m.getUserStats.mockRejectedValue(new Error('API'))
        render(await ConquistasPage({}))
        expect(screen.getByText(`0/${total}`)).toBeTruthy()
        expect(screen.getByText('nextClosest')).toBeTruthy()
        expect(screen.queryByText('allDone')).toBeNull()
    })

    it('com tudo cumprido troca a próxima conquista pelo aviso de conclusão', async () => {
        const muito = 1000
        m.getUserStats.mockResolvedValue({
            favoritesCount: muito, watchlistCount: muito, joinDate: '2020-01-01',
            contentCounts: { artist: muito, group: muito },
            contentStateCounts: { saved: muito, read: muito },
            statusCounts: { watching: muito, watched: muito, want: muito },
        })
        render(await ConquistasPage({}))
        expect(screen.getByText(`${total}/${total}`)).toBeTruthy()
        expect(screen.getByText('allDone')).toBeTruthy()
        expect(screen.getAllByText('revisit')).toHaveLength(total)
    })
})
