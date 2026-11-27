// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PerguntaDoDia } from './PerguntaDoDia'

let consentiu = true
vi.mock('@/lib/consent', () => ({ podeGuardarHistorico: () => consentiu }))
vi.mock('@/components/consent/AvisoConsentimento', () => ({ AvisoConsentimento: () => null }))

const pergunta = { id: 1, question: 'Qual é a capital?', options: ['Seul', 'Busan', 'Daegu', 'Incheon'], correct: 0, explanation: 'Seul é a capital.' }
const botao = (nome: string) => screen.getByRole('button', { name: new RegExp(nome) })
const montar = (props: Partial<React.ComponentProps<typeof PerguntaDoDia>> = {}) =>
    render(<PerguntaDoDia pergunta={pergunta} chave="2026-11-27" dataExtenso="27 de novembro" {...props} />)
const guardado = () => JSON.parse(window.localStorage.getItem('hh:dia:v1') ?? 'null')

describe.each(['padrao', 'alegre'] as const)('PerguntaDoDia (%s)', variante => {
    beforeEach(() => {
        window.localStorage.clear()
        consentiu = true
    })

    it('guarda a primeira resposta e trava as opções', async () => {
        montar({ variante })
        expect(screen.queryByText('Seul é a capital.')).not.toBeInTheDocument()

        await userEvent.click(botao('Busan'))

        expect(screen.getByText('Seul é a capital.')).toBeInTheDocument()
        expect(guardado()).toEqual({ ultimo: '2026-11-27', resposta: 1, acertou: false, sequencia: 1 })
        for (const opcao of pergunta.options) expect(botao(opcao)).toBeDisabled()
    })

    it('continua a sequência de quem respondeu ontem', async () => {
        window.localStorage.setItem('hh:dia:v1', JSON.stringify({ ultimo: '2026-11-26', resposta: 0, acertou: true, sequencia: 4 }))
        montar({ variante })
        await userEvent.click(botao('Seul'))
        expect(guardado()).toMatchObject({ acertou: true, sequencia: 5 })
    })

    it('volta já respondida numa nova visita no mesmo dia', () => {
        window.localStorage.setItem('hh:dia:v1', JSON.stringify({ ultimo: '2026-11-27', resposta: 2, acertou: false, sequencia: 1 }))
        montar({ variante })
        expect(screen.getByText('Seul é a capital.')).toBeInTheDocument()
        expect(botao('Daegu')).toBeDisabled()
    })

    it('sem consentimento funciona na visita, sem gravar nada', async () => {
        consentiu = false
        montar({ variante })
        await userEvent.click(botao('Seul'))
        expect(screen.getByText('Seul é a capital.')).toBeInTheDocument()
        expect(guardado()).toBeNull()
    })

    it('com o armazenamento recusando gravação, a resposta vale na visita', async () => {
        const gravar = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('cota') })
        montar({ variante })
        await userEvent.click(botao('Seul'))
        expect(screen.getByText('Seul é a capital.')).toBeInTheDocument()
        gravar.mockRestore()
    })
})

describe('PerguntaDoDia: link do quiz', () => {
    beforeEach(() => {
        window.localStorage.clear()
        consentiu = true
    })

    it('aparece depois da resposta e some quando o idioma não tem quiz', async () => {
        const { unmount } = montar()
        await userEvent.click(botao('Seul'))
        expect(screen.getByRole('link')).toHaveAttribute('href', '/quiz')
        unmount()

        montar({ quizHref: null })
        expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
})
