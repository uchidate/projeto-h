// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signIn } from 'next-auth/react'
import { LoginForm } from './LoginForm'

const pushMock = vi.fn()
const refreshMock = vi.fn()
let searchParamsValue = ''

vi.mock('next-auth/react', () => ({ signIn: vi.fn() }))
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock, refresh: refreshMock }),
    useSearchParams: () => new URLSearchParams(searchParamsValue),
}))

const mockedSignIn = vi.mocked(signIn)

describe('LoginForm', () => {
    beforeEach(() => {
        pushMock.mockClear()
        refreshMock.mockClear()
        mockedSignIn.mockReset()
        searchParamsValue = ''
    })

    it('associa os labels aos inputs via htmlFor/id', () => {
        render(<LoginForm />)
        expect(screen.getByLabelText(/e-mail ou usuário/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    })

    it('alterna a visibilidade da senha ao clicar no botão de olho', async () => {
        const user = userEvent.setup()
        render(<LoginForm />)
        const pwd = screen.getByLabelText(/senha/i)
        expect(pwd).toHaveAttribute('type', 'password')

        await user.click(screen.getByRole('button', { name: '' }))
        expect(pwd).toHaveAttribute('type', 'text')
    })

    it('login bem-sucedido redireciona para o callbackUrl e chama router.refresh', async () => {
        // @ts-expect-error mock parcial suficiente pro teste
        mockedSignIn.mockResolvedValue({ error: null })
        searchParamsValue = 'callbackUrl=%2Fperfil'
        const user = userEvent.setup()
        render(<LoginForm />)

        await user.type(screen.getByLabelText(/e-mail ou usuário/i), 'user@x.com')
        await user.type(screen.getByLabelText(/senha/i), 'senha123')
        await user.click(screen.getByRole('button', { name: /entrar/i }))

        expect(mockedSignIn).toHaveBeenCalledWith('credentials', {
            username: 'user@x.com',
            password: 'senha123',
            redirect: false,
        })
        expect(pushMock).toHaveBeenCalledWith('/perfil')
        expect(refreshMock).toHaveBeenCalled()
    })

    it('login com erro mostra mensagem e não redireciona', async () => {
        // @ts-expect-error mock parcial suficiente pro teste
        mockedSignIn.mockResolvedValue({ error: 'CredentialsSignin' })
        const user = userEvent.setup()
        render(<LoginForm />)

        await user.type(screen.getByLabelText(/e-mail ou usuário/i), 'user@x.com')
        await user.type(screen.getByLabelText(/senha/i), 'senhaerrada')
        await user.click(screen.getByRole('button', { name: /entrar/i }))

        expect(screen.getByText(/e-mail ou senha incorretos/i)).toBeInTheDocument()
        expect(pushMock).not.toHaveBeenCalled()
    })

    it('usa /dashboard como callbackUrl default quando não há query param', () => {
        render(<LoginForm />)
        expect(screen.getByRole('link', { name: /criar conta/i })).toHaveAttribute(
            'href',
            `/cadastro?callbackUrl=${encodeURIComponent('/dashboard')}`,
        )
    })
})
