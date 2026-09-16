// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import {
    getProductionStatus,
    getUserFavorites,
    getUserWatchlist,
    setProductionStatus,
    toggleFavorite,
} from '@/lib/wordpress/userApi'
import { ProductionActions } from './ProductionActions'

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }))
vi.mock('@/lib/wordpress/userApi', () => ({
    getUserFavorites: vi.fn(),
    getUserWatchlist: vi.fn(),
    getProductionStatus: vi.fn(),
    toggleFavorite: vi.fn(),
    setProductionStatus: vi.fn(),
}))

const mockedUseSession = vi.mocked(useSession)

function mockAuthenticated() {
    mockedUseSession.mockReturnValue({
        data: { user: { id: '1' } }, status: 'authenticated',
    } as unknown as ReturnType<typeof useSession>)
}

describe('ProductionActions', () => {
    beforeEach(() => {
        vi.mocked(getUserFavorites).mockReset().mockResolvedValue([])
        vi.mocked(getUserWatchlist).mockReset().mockResolvedValue([])
        vi.mocked(getProductionStatus).mockReset().mockResolvedValue({ productionId: 1, status: '' })
        vi.mocked(toggleFavorite).mockReset()
        vi.mocked(setProductionStatus).mockReset()
        localStorage.clear()
    })

    describe('usuário autenticado', () => {
        it('carrega o estado inicial (favorito/lista) das APIs do usuário', async () => {
            mockAuthenticated()
            vi.mocked(getUserFavorites).mockResolvedValue([42])
            render(<ProductionActions productionId={42} />)
            expect(await screen.findByRole('button', { name: /remover dos favoritos/i })).toBeInTheDocument()
        })

        it('favoritar chama toggleFavorite e atualiza o botão', async () => {
            mockAuthenticated()
            vi.mocked(toggleFavorite).mockResolvedValue({ action: 'added', total: 1 })
            const user = userEvent.setup()
            render(<ProductionActions productionId={42} />)

            const favBtn = await screen.findByRole('button', { name: /adicionar aos favoritos/i })
            await user.click(favBtn)

            await waitFor(() => expect(toggleFavorite).toHaveBeenCalledWith(null, 42))
            expect(await screen.findByRole('button', { name: /remover dos favoritos/i })).toBeInTheDocument()
            expect(await screen.findByText(/adicionado aos favoritos/i)).toBeInTheDocument()
        })

        it('os botões de status (want/watching/watched) são mutuamente exclusivos', async () => {
            mockAuthenticated()
            vi.mocked(getProductionStatus).mockResolvedValue({ productionId: 42, status: 'want' })
            vi.mocked(setProductionStatus).mockResolvedValue({
                productionId: 42, status: 'watching', counts: { want: 0, watching: 1, watched: 0 },
            })
            const user = userEvent.setup()
            render(<ProductionActions productionId={42} />)

            const wantBtn = await screen.findByRole('button', { name: 'Quero ver' })
            expect(wantBtn).toHaveAttribute('aria-pressed', 'true')

            const watchingBtn = screen.getByRole('button', { name: 'Assistindo' })
            await user.click(watchingBtn)

            await waitFor(() => expect(setProductionStatus).toHaveBeenCalledWith(null, 42, 'watching'))
            expect(await screen.findByText(/marcado como assistindo/i)).toBeInTheDocument()
        })

        it('clicar de novo no status ativo remove o status (toggle off)', async () => {
            mockAuthenticated()
            vi.mocked(getProductionStatus).mockResolvedValue({ productionId: 42, status: 'watched' })
            vi.mocked(setProductionStatus).mockResolvedValue({
                productionId: 42, status: '', counts: { want: 0, watching: 0, watched: 0 },
            })
            const user = userEvent.setup()
            render(<ProductionActions productionId={42} />)

            const watchedBtn = await screen.findByRole('button', { name: 'Assistido' })
            expect(watchedBtn).toHaveAttribute('aria-pressed', 'true')
            await user.click(watchedBtn)

            await waitFor(() => expect(setProductionStatus).toHaveBeenCalledWith(null, 42, ''))
            expect(await screen.findByText(/status removido/i)).toBeInTheDocument()
        })

        it('mostra mensagem de erro quando a sincronização falha', async () => {
            mockAuthenticated()
            vi.mocked(toggleFavorite).mockRejectedValue(new Error('offline'))
            const user = userEvent.setup()
            render(<ProductionActions productionId={42} />)

            const favBtn = await screen.findByRole('button', { name: /adicionar aos favoritos/i })
            await user.click(favBtn)

            expect(await screen.findByText(/não foi possível sincronizar/i)).toBeInTheDocument()
        })
    })

    describe('usuário anônimo (localStorage)', () => {
        it('favoritar sem sessão salva no localStorage, não chama a API', async () => {
            mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as unknown as ReturnType<typeof useSession>)
            const user = userEvent.setup()
            render(<ProductionActions productionId={7} />)

            const favBtn = await screen.findByRole('button', { name: /adicionar aos favoritos/i })
            await user.click(favBtn)

            expect(toggleFavorite).not.toHaveBeenCalled()
            expect(JSON.parse(localStorage.getItem('oc_favorites') ?? '[]')).toEqual([7])
            expect(await screen.findByText(/favorito salvo neste dispositivo/i)).toBeInTheDocument()
        })

        it('lê favoritos/watchlist já salvos no localStorage ao montar', async () => {
            localStorage.setItem('oc_favorites', JSON.stringify([7]))
            mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as unknown as ReturnType<typeof useSession>)
            render(<ProductionActions productionId={7} />)

            expect(await screen.findByRole('button', { name: /remover dos favoritos/i })).toBeInTheDocument()
        })

        it('não mostra os botões de status (want/watching/watched) pra usuário anônimo', async () => {
            mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as unknown as ReturnType<typeof useSession>)
            render(<ProductionActions productionId={7} />)
            await screen.findByRole('button', { name: /adicionar aos favoritos/i })
            expect(screen.queryByRole('button', { name: 'Assistindo' })).not.toBeInTheDocument()
        })
    })

    describe('mode', () => {
        it('mode="favorite" esconde o botão de lista (Quero ver)', async () => {
            // sem token: some com os pills de status (want/watching/watched),
            // que também têm accessible name "Quero ver" e colidiriam com a query
            mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as unknown as ReturnType<typeof useSession>)
            render(<ProductionActions productionId={1} mode="favorite" />)
            await screen.findByRole('button', { name: /adicionar aos favoritos/i })
            // accessible name do botão principal vem do aria-label, não do texto visível
            expect(screen.queryByRole('button', { name: 'Adicionar à lista' })).not.toBeInTheDocument()
        })

        it('mode="watch" esconde o botão de favoritar', async () => {
            mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as unknown as ReturnType<typeof useSession>)
            render(<ProductionActions productionId={1} mode="watch" />)
            await screen.findByRole('button', { name: 'Adicionar à lista' })
            expect(screen.queryByRole('button', { name: /adicionar aos favoritos/i })).not.toBeInTheDocument()
        })
    })
})
