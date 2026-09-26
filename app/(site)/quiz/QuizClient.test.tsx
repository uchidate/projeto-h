// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuizClient } from './QuizClient'
import type { QuizQuestion } from '@/lib/wordpress/quiz'

vi.mock('@/lib/analytics', () => ({ trackQuizStart: vi.fn(), trackQuizComplete: vi.fn() }))
vi.mock('@/components/ui/AdSlotInline', () => ({ AdSlotInline: () => null }))

function question(over: Partial<QuizQuestion> = {}): QuizQuestion {
    return {
        id: 1,
        question: 'Pergunta um?',
        options: ['Alfa', 'Bravo', 'Charlie', 'Delta'],
        correct: 0,
        explanation: 'Porque sim.',
        category: 'k-pop',
        difficulty: 'easy',
        ...over,
    }
}

// Um lote grande o bastante para o quiz montar uma partida completa.
const pool: QuizQuestion[] = Array.from({ length: 30 }, (_, i) =>
    question({
        id: i + 1,
        question: `Pergunta ${i + 1}?`,
        options: [`A${i}`, `B${i}`, `C${i}`, `D${i}`],
        difficulty: 'medium',
    }),
)

describe('QuizClient — capa', () => {
    beforeEach(() => localStorage.clear())

    it('mostra os temas com a quantidade de perguntas de cada um', () => {
        render(<QuizClient serverQuestions={pool} />)
        expect(screen.getByRole('button', { name: /K-Pop/ })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Tudo misturado/ })).toBeInTheDocument()
    })

    it('marca o tema escolhido', async () => {
        const user = userEvent.setup()
        render(<QuizClient serverQuestions={pool} />)
        const cartao = screen.getByRole('button', { name: /K-Pop/ })
        await user.click(cartao)
        expect(cartao).toHaveAttribute('aria-pressed', 'true')
    })

    it('começa a partida ao clicar em começar', async () => {
        const user = userEvent.setup()
        render(<QuizClient serverQuestions={pool} />)
        await user.click(screen.getAllByRole('button', { name: /Começar/ })[0])
        expect(screen.getByText(/pergunta 1 de/i)).toBeInTheDocument()
    })
})
