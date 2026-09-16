// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { UserMenu } from './UserMenu'

vi.mock('next-auth/react', () => ({ useSession: vi.fn(), signOut: vi.fn() }))
vi.mock('next/navigation', () => ({ usePathname: vi.fn() }))

const mockedUseSession = vi.mocked(useSession)
const mockedUsePathname = vi.mocked(usePathname)

function mockAuthenticated(overrides: Partial<{ name: string; email: string; image: string | null }> = {}) {
    mockedUseSession.mockReturnValue({
        data: { user: { name: 'Jimin Fan', email: 'fan@example.com', image: null, ...overrides } },
        status: 'authenticated',
    } as unknown as ReturnType<typeof useSession>)
}

describe('UserMenu', () => {
    beforeEach(() => {
        mockedUsePathname.mockReturnValue('/artists/jimin')
        vi.mocked(signOut).mockReset()
    })

    it('mostra um skeleton (placeholder) enquanto a sessão está carregando', () => {
        mockedUseSession.mockReturnValue({ data: null, status: 'loading' } as unknown as ReturnType<typeof useSession>)
        const { container } = render(<UserMenu />)
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('sem sessão, mostra link de entrar com callbackUrl codificando o pathname atual', () => {
        mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as unknown as ReturnType<typeof useSession>)
        render(<UserMenu />)
        const link = screen.getByRole('link', { name: 'Entrar na sua conta' })
        expect(link).toHaveAttribute('href', '/entrar?callbackUrl=%2Fartists%2Fjimin')
    })

    it('sem sessão na home ("/"), não anexa callbackUrl (evita redirect circular óbvio)', () => {
        mockedUsePathname.mockReturnValue('/')
        mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as unknown as ReturnType<typeof useSession>)
        render(<UserMenu />)
        expect(screen.getByRole('link', { name: 'Entrar na sua conta' })).toHaveAttribute('href', '/entrar')
    })

    it('autenticado sem foto, mostra a inicial do nome maiúscula', () => {
        mockAuthenticated({ name: 'jimin' })
        render(<UserMenu />)
        expect(screen.getByText('J')).toBeInTheDocument()
    })

    it('mostra "?" quando não há nome nem inicial disponível', () => {
        mockAuthenticated({ name: undefined as unknown as string })
        render(<UserMenu />)
        expect(screen.getByText('?')).toBeInTheDocument()
    })

    it('o painel do menu não aparece até clicar no botão do avatar', () => {
        mockAuthenticated()
        render(<UserMenu />)
        expect(screen.queryByText('Minha Onda')).not.toBeInTheDocument()
    })

    it('clicar no avatar abre o painel com nome/email e os links de navegação', async () => {
        mockAuthenticated()
        const user = userEvent.setup()
        render(<UserMenu />)
        await user.click(screen.getByRole('button', { name: /menu do usuário/i }))
        expect(screen.getByText('Jimin Fan')).toBeInTheDocument()
        expect(screen.getByText('fan@example.com')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /minha onda/i })).toBeInTheDocument()
    })

    it('clicar de novo no avatar fecha o painel (toggle)', async () => {
        mockAuthenticated()
        const user = userEvent.setup()
        render(<UserMenu />)
        const btn = screen.getByRole('button', { name: /menu do usuário/i })
        await user.click(btn)
        expect(screen.getByText('Jimin Fan')).toBeInTheDocument()
        await user.click(btn)
        expect(screen.queryByText('Jimin Fan')).not.toBeInTheDocument()
    })

    it('clicar fora do painel fecha o menu', async () => {
        mockAuthenticated()
        const user = userEvent.setup()
        render(
            <div>
                <div data-testid="outside">fora</div>
                <UserMenu />
            </div>
        )
        await user.click(screen.getByRole('button', { name: /menu do usuário/i }))
        expect(screen.getByText('Jimin Fan')).toBeInTheDocument()
        await user.click(screen.getByTestId('outside'))
        expect(screen.queryByText('Jimin Fan')).not.toBeInTheDocument()
    })

    it('clicar em "Sair" fecha o menu e chama signOut', async () => {
        mockAuthenticated()
        const user = userEvent.setup()
        render(<UserMenu />)
        await user.click(screen.getByRole('button', { name: /menu do usuário/i }))
        await user.click(screen.getByRole('button', { name: /sair/i }))
        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' })
        expect(screen.queryByText('Jimin Fan')).not.toBeInTheDocument()
    })

    it('clicar num link de navegação do menu fecha o painel', async () => {
        mockAuthenticated()
        const user = userEvent.setup()
        render(<UserMenu />)
        await user.click(screen.getByRole('button', { name: /menu do usuário/i }))
        await user.click(screen.getByRole('link', { name: /perfil/i }))
        expect(screen.queryByText('Jimin Fan')).not.toBeInTheDocument()
    })
})
