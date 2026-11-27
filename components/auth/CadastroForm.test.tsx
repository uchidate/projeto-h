// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signIn } from 'next-auth/react'
import { CadastroForm } from './CadastroForm'

const pushMock = vi.fn()
const refreshMock = vi.fn()
let searchParamsValue = ''

vi.mock('next-auth/react', () => ({ signIn: vi.fn() }))
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock, refresh: refreshMock }),
    useSearchParams: () => new URLSearchParams(searchParamsValue),
}))
const registrar = vi.fn()
vi.mock('@/lib/wordpress/userApi', () => ({ registerUser: (...args: unknown[]) => registrar(...args) }))

const mockedSignIn = vi.mocked(signIn)

async function enviar(senha = 'senha-longa') {
    const user = userEvent.setup()
    render(<CadastroForm />)
    await user.type(screen.getByPlaceholderText('Seu nome'), 'Ana')
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'ana@exemplo.com')
    await user.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), senha)
    await user.click(screen.getByRole('button', { name: /criar/i }))
}

describe('CadastroForm', () => {
    beforeEach(() => {
        pushMock.mockClear()
        refreshMock.mockClear()
        mockedSignIn.mockReset().mockResolvedValue({ error: null, ok: true, status: 200, url: null })
        registrar.mockReset().mockResolvedValue({})
        searchParamsValue = ''
    })

    it('recusa senha curta sem chamar o servidor', async () => {
        await enviar('1234567')
        expect(screen.getByText(/8 caracteres/i)).toBeInTheDocument()
        expect(registrar).not.toHaveBeenCalled()
    })

    it('cria a conta, entra e volta para a página de origem', async () => {
        searchParamsValue = 'callbackUrl=%2Fartists%2Fiu'
        await enviar()
        expect(registrar).toHaveBeenCalledWith({ name: 'Ana', email: 'ana@exemplo.com', password: 'senha-longa' })
        expect(pushMock).toHaveBeenCalledWith('/artists/iu')
        expect(refreshMock).toHaveBeenCalled()
    })

    it('não leva a outro site', async () => {
        searchParamsValue = 'callbackUrl=https%3A%2F%2Foutro.com%2Fentrar'
        await enviar()
        expect(pushMock).toHaveBeenCalledWith('/dashboard')
    })

    it('mostra a mensagem do servidor', async () => {
        registrar.mockRejectedValue(new Error('E-mail já cadastrado.'))
        await enviar()
        expect(screen.getByText('E-mail já cadastrado.')).toBeInTheDocument()
        expect(pushMock).not.toHaveBeenCalled()
    })

    it.each([new TypeError('Failed to fetch'), new Error('')])('usa o texto genérico quando não há mensagem (%s)', async erro => {
        registrar.mockRejectedValue(erro)
        await enviar()
        expect(screen.getByText('Erro ao criar conta.')).toBeInTheDocument()
    })

    it.each(['recusado', 'rede'])('conta criada e login %s: manda para a tela de entrar', async motivo => {
        if (motivo === 'rede') mockedSignIn.mockRejectedValue(new TypeError('Failed to fetch'))
        else mockedSignIn.mockResolvedValue({ error: 'CredentialsSignin', ok: false, status: 401, url: null })
        await enviar()
        expect(pushMock).toHaveBeenCalledWith(`/entrar?callbackUrl=${encodeURIComponent('/dashboard')}`)
        expect(screen.queryByText('Erro ao criar conta.')).not.toBeInTheDocument()
    })
})
