// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuizEmbed } from './QuizEmbed'
import type { QuizQuestion } from '@/lib/wordpress/quiz'

// accessible name do botão de opção é "<letra> <texto>" (ex: "A BTS"),
// já que o span da letra e o span do texto ficam dentro do mesmo <button>
function optionButton(text: string) {
    return screen.getByRole('button', { name: new RegExp(`${text}$`) })
}

function question(overrides: Partial<QuizQuestion> = {}): QuizQuestion {
    return {
        id: 1,
        question: 'Quem lançou "Dynamite"?',
        options: ['BTS', 'BLACKPINK', 'EXO', 'TWICE'],
        correct: 0,
        explanation: 'BTS lançou Dynamite em 2020.',
        category: 'k-pop',
        difficulty: 'easy',
        ...overrides,
    }
}

describe('QuizEmbed', () => {
    it('começa na tela idle mostrando o botão de iniciar', () => {
        render(<QuizEmbed questions={[question()]} category="k-pop" />)
        expect(screen.getByRole('button', { name: /começar o mini quiz/i })).toBeInTheDocument()
    })

    it('clicar em começar mostra a primeira pergunta', async () => {
        const user = userEvent.setup()
        render(<QuizEmbed questions={[question()]} category="k-pop" />)
        await user.click(screen.getByRole('button', { name: /começar o mini quiz/i }))
        expect(screen.getByText('Quem lançou "Dynamite"?')).toBeInTheDocument()
    })

    it('ao responder, revela a explicação e desabilita as opções (não deixa trocar de resposta)', async () => {
        const user = userEvent.setup()
        render(<QuizEmbed questions={[question()]} category="k-pop" />)
        await user.click(screen.getByRole('button', { name: /começar o mini quiz/i }))

        await user.click(optionButton('BTS'))
        expect(screen.getByText(/dynamite em 2020/i)).toBeInTheDocument()
        expect(optionButton('BTS')).toBeDisabled()
        expect(optionButton('BLACKPINK')).toBeDisabled()
    })

    it('clicar numa opção depois de revelado não muda a resposta selecionada', async () => {
        const user = userEvent.setup()
        render(<QuizEmbed questions={[question()]} category="k-pop" />)
        await user.click(screen.getByRole('button', { name: /começar o mini quiz/i }))
        await user.click(optionButton('BTS'))
        // botão desabilitado — userEvent.click não dispara onClick em elemento disabled
        await user.click(optionButton('EXO'))
        await user.click(screen.getByRole('button', { name: /ver resultado/i }))
        expect(screen.getByText('1')).toBeInTheDocument() // score continua 1/1 (resposta não mudou pra errada)
    })

    it('com múltiplas perguntas, avança pra próxima ao clicar em "Próxima"', async () => {
        const user = userEvent.setup()
        const questions = [question({ id: 1, question: 'Pergunta 1' }), question({ id: 2, question: 'Pergunta 2' })]
        render(<QuizEmbed questions={questions} category="k-pop" />)
        await user.click(screen.getByRole('button', { name: /começar o mini quiz/i }))
        await user.click(optionButton('BTS'))
        await user.click(screen.getByRole('button', { name: /próxima/i }))
        expect(screen.getByText('Pergunta 2')).toBeInTheDocument()
    })

    it('na última pergunta, o botão diz "Ver resultado" em vez de "Próxima"', async () => {
        const user = userEvent.setup()
        render(<QuizEmbed questions={[question()]} category="k-pop" />)
        await user.click(screen.getByRole('button', { name: /começar o mini quiz/i }))
        await user.click(optionButton('BTS'))
        expect(screen.getByRole('button', { name: /ver resultado/i })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /^próxima/i })).not.toBeInTheDocument()
    })

    it('calcula o score corretamente (acertos vs erros) na tela final', async () => {
        const user = userEvent.setup()
        const questions = [
            question({ id: 1, options: ['certo', 'errado'], correct: 0 }),
            question({ id: 2, options: ['certo', 'errado'], correct: 0 }),
        ]
        render(<QuizEmbed questions={questions} category="k-pop" />)
        await user.click(screen.getByRole('button', { name: /começar o mini quiz/i }))
        await user.click(optionButton('certo')) // acerta
        await user.click(screen.getByRole('button', { name: /próxima/i }))
        await user.click(optionButton('errado')) // erra
        await user.click(screen.getByRole('button', { name: /ver resultado/i }))
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('/2')).toBeInTheDocument()
    })

    it('mostra mensagem "Perfeito!" quando acerta tudo', async () => {
        const user = userEvent.setup()
        render(<QuizEmbed questions={[question({ options: ['certo', 'errado'], correct: 0 })]} category="k-pop" />)
        await user.click(screen.getByRole('button', { name: /começar o mini quiz/i }))
        await user.click(optionButton('certo'))
        await user.click(screen.getByRole('button', { name: /ver resultado/i }))
        expect(screen.getByText('Perfeito!')).toBeInTheDocument()
    })

    it('mostra mensagem "Continue praticando" quando o score é baixo', async () => {
        const user = userEvent.setup()
        render(<QuizEmbed questions={[question({ options: ['certo', 'errado'], correct: 0 })]} category="k-pop" />)
        await user.click(screen.getByRole('button', { name: /começar o mini quiz/i }))
        await user.click(optionButton('errado'))
        await user.click(screen.getByRole('button', { name: /ver resultado/i }))
        expect(screen.getByText(/continue praticando/i)).toBeInTheDocument()
    })

    it('"Repetir" volta pro início zerando o progresso', async () => {
        const user = userEvent.setup()
        render(<QuizEmbed questions={[question({ options: ['certo', 'errado'], correct: 0 })]} category="k-pop" />)
        await user.click(screen.getByRole('button', { name: /começar o mini quiz/i }))
        await user.click(optionButton('errado'))
        await user.click(screen.getByRole('button', { name: /ver resultado/i }))
        await user.click(screen.getByRole('button', { name: /repetir/i }))
        expect(screen.getByRole('button', { name: /começar o mini quiz/i })).toBeInTheDocument()
    })
})
