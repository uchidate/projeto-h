import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactElement } from 'react'

const m = vi.hoisted(() => ({ sessao: vi.fn(), token: vi.fn(), stats: vi.fn(), estados: vi.fn(), fandoms: vi.fn() }))

vi.mock('next-auth', () => ({ getServerSession: m.sessao }))
vi.mock('@/lib/auth/wpToken', () => ({ getWpToken: m.token }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`) } }))
vi.mock('@/lib/wordpress/userApi', () => ({ getUserStats: m.stats, getUserContentStates: m.estados }))
vi.mock('@/lib/wordpress/fandoms', () => ({ getAllFandoms: m.fandoms }))
vi.mock('@/components/features/PerfilClient', () => ({ PerfilClient: () => null }))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (k: string) => k }))

import PerfilPage, { metadataDaPagina } from './PerfilPagina'

type Props = { user: Record<string, unknown>; stats: unknown; torcidas: unknown[] }
const abrir = async () => (await PerfilPage({ locale: 'pt' }) as ReactElement<Props>).props
const torcida = (slug: string, grupoId: number, color?: string) =>
    ({ slug, name: slug.toUpperCase(), color, groups: [{ id: grupoId, title: { rendered: `Grupo ${grupoId}` } }] })

beforeEach(() => {
    m.sessao.mockReset().mockResolvedValue({ user: { name: 'Pessoa', email: 'pessoa@exemplo.test', image: null, bio: 'oi' } })
    m.token.mockReset().mockResolvedValue('tk')
    m.stats.mockReset().mockResolvedValue({ favoritesCount: 2 })
    m.estados.mockReset().mockResolvedValue({ states: [] })
    m.fandoms.mockReset().mockResolvedValue([])
})

describe('PerfilPagina', () => {
    it('fica fora do índice', async () => {
        expect(await metadataDaPagina()).toEqual({ title: 'profile', robots: { index: false, follow: true } })
    })

    it('sem sessão manda ao login com retorno ao perfil', async () => {
        m.sessao.mockResolvedValue(null)
        await expect(PerfilPage({ locale: 'pt' })).rejects.toThrow(/redirect:.+\?callbackUrl=.+/)
        expect(m.stats).not.toHaveBeenCalled()
    })

    it('entrega usuário e números; campos ausentes viram vazio', async () => {
        m.sessao.mockResolvedValue({ user: {} })
        const props = await abrir()
        expect(props.user).toEqual({ name: '', email: '', image: null, bio: '' })
        expect(props.stats).toEqual({ favoritesCount: 2 })
        expect(m.stats).toHaveBeenCalledWith('tk')
    })

    it('lista só as torcidas de grupos que a pessoa segue', async () => {
        m.estados.mockResolvedValue({ states: [
            { objectType: 'group', state: 'following', objectId: 1 },
            { objectType: 'group', state: 'following', objectId: 3 },
            { objectType: 'group', state: 'favorite', objectId: 2 },
            { objectType: 'artist', state: 'following', objectId: 2 },
        ] })
        m.fandoms.mockResolvedValue([torcida('a', 1, '#112233'), torcida('b', 2), torcida('c', 3)])
        expect((await abrir()).torcidas).toEqual([
            { slug: 'a', nome: 'A', cor: '#112233', grupo: 'Grupo 1' },
            { slug: 'c', nome: 'C', cor: '#c39bff', grupo: 'Grupo 3' },
        ])
    })

    it('com o WordPress fora mostra o perfil zerado em vez de quebrar', async () => {
        m.stats.mockRejectedValue(new Error('fora'))
        m.estados.mockRejectedValue(new Error('fora'))
        m.fandoms.mockRejectedValue(new Error('fora'))
        const props = await abrir()
        expect(props.stats).toEqual({ favoritesCount: 0, watchlistCount: 0, joinDate: '' })
        expect(props.torcidas).toEqual([])
    })
})
