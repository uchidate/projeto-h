// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const sessao = vi.hoisted(() => ({ data: null as { user: { name: string } } | null, status: 'unauthenticated' as 'authenticated' | 'unauthenticated' }))
vi.mock('next-auth/react', () => ({ useSession: () => sessao }))

type EstadoConteudo = { objectId: number; objectType: string; state: string }
const userApi = vi.hoisted(() => ({
    getUserContentStates: vi.fn(async () => ({ states: [] as EstadoConteudo[], counts: { production: 0, artist: 0, group: 0, post: 0 }, countsByState: { favorite: 0, following: 0, saved: 0, read: 0 } })),
    setContentState: vi.fn(async (_t: unknown, _type: string, objectId: number, state: string) => ({ objectId, state })),
}))
vi.mock('@/lib/wordpress/userApi', () => userApi)

import { EspacoDoFa, type CartaoTorcida } from './EspacoDoFa'

const cartoes: CartaoTorcida[] = [
    { slug: 'army', nome: 'ARMY', cor: '#c6a852', grupos: ['BTS'], grupoSlug: 'bts', grupoId: 47, foto: null, ano: 2013, encerrado: false, diasProximaData: null },
    { slug: 'blink', nome: 'BLINK', cor: '#ff5fa2', grupos: ['BLACKPINK'], grupoSlug: 'blackpink', grupoId: 46, foto: null, ano: 2016, encerrado: false, diasProximaData: null },
]

describe('EspacoDoFa', () => {
    beforeEach(() => {
        localStorage.clear()
        sessao.data = null
        sessao.status = 'unauthenticated'
        userApi.getUserContentStates.mockClear()
        userApi.setContentState.mockClear()
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ artigos: [] }) })))
    })

    it('sem conta, marcar guarda como pendente no navegador e abre o painel', async () => {
        render(<EspacoDoFa cartoes={cartoes} />)
        await userEvent.click(screen.getAllByRole('button', { name: /Sou dessa/ })[0])
        expect(await screen.findByRole('heading', { name: /Sua torcida/ })).toBeInTheDocument()
        expect(localStorage.getItem('hh-estado-pendente-v1')).toContain('"objectId":47')
        expect(screen.getByText(/Entre na sua conta/)).toBeInTheDocument()
    })

    it('com conta, marcar chama setContentState (seguir o grupo) e mostra o link pro perfil', async () => {
        sessao.data = { user: { name: 'Ana' } }
        sessao.status = 'authenticated'
        render(<EspacoDoFa cartoes={cartoes} />)
        await userEvent.click(screen.getAllByRole('button', { name: /Sou dessa/ })[0])
        await waitFor(() => expect(userApi.setContentState).toHaveBeenCalledWith(null, 'group', 47, 'following', 'following'))
        expect(await screen.findByRole('link', { name: /Ver no seu perfil/ })).toHaveAttribute('href', '/perfil')
    })

    it('com conta, carrega os grupos já seguidos como torcidas escolhidas', async () => {
        sessao.data = { user: { name: 'Ana' } }
        sessao.status = 'authenticated'
        userApi.getUserContentStates.mockResolvedValueOnce({
            states: [{ objectId: 47, objectType: 'group', state: 'following' }],
            counts: { production: 0, artist: 0, group: 1, post: 0 },
            countsByState: { favorite: 0, following: 1, saved: 0, read: 0 },
        })
        render(<EspacoDoFa cartoes={cartoes} />)
        expect(await screen.findByText('ARMY', { selector: 'p' })).toBeInTheDocument()
    })

    it('mostra o selo de data quando a torcida tem estreia comemorada perto', () => {
        const comData: CartaoTorcida[] = [{ ...cartoes[0], diasProximaData: 3 }, cartoes[1]]
        render(<EspacoDoFa cartoes={comData} />)
        expect(screen.getAllByText(/em 3d/).length).toBeGreaterThan(0)
    })

    it('não mostra selo de data quando não há estreia comemorada perto', () => {
        render(<EspacoDoFa cartoes={cartoes} />)
        expect(screen.queryByText(/🎂/)).not.toBeInTheDocument()
    })
})
