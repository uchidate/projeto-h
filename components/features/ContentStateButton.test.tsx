// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { getContentState, setContentState } from '@/lib/wordpress/userApi'
import { ContentStateButton } from './ContentStateButton'

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }))
vi.mock('@/lib/wordpress/userApi', () => ({
    getContentState: vi.fn(),
    setContentState: vi.fn(),
}))

const mockedUseSession = vi.mocked(useSession)
const mockedGetContentState = vi.mocked(getContentState)
const mockedSetContentState = vi.mocked(setContentState)

describe('ContentStateButton', () => {
    beforeEach(() => {
        mockedGetContentState.mockReset()
        mockedSetContentState.mockReset()
        window.localStorage.clear()
    })

    // Até 2026-09-12 este caso esperava um LINK para /entrar: sem conta, o
    // botão não salvava nada. A inversão é deliberada — favorita primeiro, a
    // conta é oferecida depois para não perder o que já foi guardado.
    it('deixa favoritar sem sessão, guardando no dispositivo', async () => {
        mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as ReturnType<typeof useSession>)
        render(<ContentStateButton objectId={1} objectType="artist" />)

        const botao = await screen.findByRole('button', { name: /seguir/i })
        expect(botao).toHaveAttribute('aria-pressed', 'false')
        await userEvent.click(botao)

        expect(await screen.findByRole('button', { name: /seguindo/i })).toHaveAttribute('aria-pressed', 'true')
        expect(window.localStorage.getItem('hh-estado-pendente-v1')).toContain('"objectId":1')
        // Nada vai para o WordPress sem conta: não há a quem atribuir.
        expect(setContentState).not.toHaveBeenCalled()
    })

    it('só convida a criar conta DEPOIS do primeiro clique', async () => {
        mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as ReturnType<typeof useSession>)
        render(<ContentStateButton objectId={1} objectType="artist" />)

        const botao = await screen.findByRole('button', { name: /seguir/i })
        expect(screen.queryByRole('link')).not.toBeInTheDocument()

        await userEvent.click(botao)
        expect(await screen.findByRole('link', { name: /entre para não perder/i })).toBeInTheDocument()
    })

    it('reidrata o que foi salvo sem sessão numa visita anterior', async () => {
        window.localStorage.setItem('hh-estado-pendente-v1',
            JSON.stringify([{ objectType: 'artist', objectId: 1, state: 'following' }]))
        mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as ReturnType<typeof useSession>)
        render(<ContentStateButton objectId={1} objectType="artist" />)
        expect(await screen.findByRole('button', { name: /seguindo/i })).toHaveAttribute('aria-pressed', 'true')
    })

    it('não chama getContentState quando não há sessão', async () => {
        mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as ReturnType<typeof useSession>)
        render(<ContentStateButton objectId={1} objectType="artist" />)
        await screen.findByRole('button', { name: /seguir/i })
        expect(getContentState).not.toHaveBeenCalled()
    })

    it('mostra o botão "Seguir" (estado inativo) quando logado e sem estado salvo', async () => {
        mockedUseSession.mockReturnValue({
            data: { user: { id: '1' } }, status: 'authenticated',
        } as unknown as ReturnType<typeof useSession>)
        mockedGetContentState.mockResolvedValue({ objectId: 1, objectType: 'artist', state: '' })

        render(<ContentStateButton objectId={1} objectType="artist" />)
        const button = await screen.findByRole('button', { name: /seguir/i })
        expect(button).toHaveAttribute('aria-pressed', 'false')
    })

    it('mostra "Seguindo" (estado ativo) quando getContentState retorna o estado já salvo', async () => {
        mockedUseSession.mockReturnValue({
            data: { user: { id: '1' } }, status: 'authenticated',
        } as unknown as ReturnType<typeof useSession>)
        mockedGetContentState.mockResolvedValue({ objectId: 1, objectType: 'artist', state: 'following' })

        render(<ContentStateButton objectId={1} objectType="artist" state="following" activeLabel="Seguindo" />)
        const button = await screen.findByRole('button', { name: /seguindo/i })
        expect(button).toHaveAttribute('aria-pressed', 'true')
    })

    it('ao clicar, alterna de inativo pra ativo e dispara o evento oc-content-state:changed', async () => {
        mockedUseSession.mockReturnValue({
            data: { user: { id: '1' } }, status: 'authenticated',
        } as unknown as ReturnType<typeof useSession>)
        mockedGetContentState.mockResolvedValue({ objectId: 1, objectType: 'artist', state: '' })
        mockedSetContentState.mockResolvedValue({
            objectId: 1, objectType: 'artist', state: 'following',
            counts: { production: 0, artist: 0, group: 0, post: 0 },
            countsByState: { favorite: 0, following: 1, saved: 0, read: 0 },
        })

        const user = userEvent.setup()
        const listener = vi.fn()
        window.addEventListener('oc-content-state:changed', listener)

        render(<ContentStateButton objectId={1} objectType="artist" state="following" />)
        const button = await screen.findByRole('button', { name: /seguir/i })
        await user.click(button)

        await waitFor(() => expect(setContentState).toHaveBeenCalledWith(null, 'artist', 1, 'following', 'following'))
        await waitFor(() => expect(listener).toHaveBeenCalledTimes(1))

        window.removeEventListener('oc-content-state:changed', listener)
    })

    it('mostra mensagem de erro quando setContentState falha', async () => {
        mockedUseSession.mockReturnValue({
            data: { user: { id: '1' } }, status: 'authenticated',
        } as unknown as ReturnType<typeof useSession>)
        mockedGetContentState.mockResolvedValue({ objectId: 1, objectType: 'artist', state: '' })
        mockedSetContentState.mockRejectedValue(new Error('falhou'))

        const user = userEvent.setup()
        render(<ContentStateButton objectId={1} objectType="artist" />)
        const button = await screen.findByRole('button', { name: /seguir/i })
        await user.click(button)

        expect(await screen.findByRole('status')).toHaveTextContent(/não foi possível sincronizar/i)
    })

    it('reage ao evento oc-content-state:changed disparado por outro componente (sync entre instâncias)', async () => {
        mockedUseSession.mockReturnValue({
            data: { user: { id: '1' } }, status: 'authenticated',
        } as unknown as ReturnType<typeof useSession>)
        mockedGetContentState.mockResolvedValue({ objectId: 1, objectType: 'artist', state: '' })

        render(<ContentStateButton objectId={1} objectType="artist" state="following" activeLabel="Seguindo" />)
        await screen.findByRole('button', { name: /seguir/i })

        window.dispatchEvent(new CustomEvent('oc-content-state:changed', {
            detail: { objectId: 1, objectType: 'artist', state: 'following' },
        }))

        expect(await screen.findByRole('button', { name: /seguindo/i })).toHaveAttribute('aria-pressed', 'true')
    })

    it('ignora evento oc-content-state:changed de outro objectId/objectType', async () => {
        mockedUseSession.mockReturnValue({
            data: { user: { id: '1' } }, status: 'authenticated',
        } as unknown as ReturnType<typeof useSession>)
        mockedGetContentState.mockResolvedValue({ objectId: 1, objectType: 'artist', state: '' })

        render(<ContentStateButton objectId={1} objectType="artist" state="following" />)
        await screen.findByRole('button', { name: /seguir/i })

        window.dispatchEvent(new CustomEvent('oc-content-state:changed', {
            detail: { objectId: 999, objectType: 'group', state: 'following' },
        }))

        expect(await screen.findByRole('button', { name: /seguir/i })).toHaveAttribute('aria-pressed', 'false')
    })
})
