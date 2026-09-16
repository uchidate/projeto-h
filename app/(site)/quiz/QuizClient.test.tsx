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

// A isca prefere o nível iniciante; esta é a única `easy`, então é sempre ela.
const teaser = question({ id: 999, question: 'Qual é a isca?', options: ['Certa', 'Errada', 'Outra', 'Mais'], correct: 0, difficulty: 'easy' })

describe('QuizClient — pergunta de capa', () => {
    beforeEach(() => localStorage.clear())

    it('mostra uma pergunta jogável antes de a pessoa começar a partida', () => {
        render(<QuizClient serverQuestions={[teaser, ...pool]} />)
        expect(screen.getByText('Qual é a isca?')).toBeInTheDocument()
        expect(screen.getByText(/sem cronômetro, sem pontos/i)).toBeInTheDocument()
    })

    it('revela a explicação ao responder, sem iniciar a partida', async () => {
        const user = userEvent.setup()
        render(<QuizClient serverQuestions={[teaser, ...pool]} />)

        await user.click(screen.getByRole('button', { name: /Errada/ }))
        expect(screen.getByText(/não foi dessa vez/i)).toBeInTheDocument()
        expect(screen.getByText('Porque sim.')).toBeInTheDocument()
        // Ainda na capa: a partida só começa no clique seguinte.
        expect(screen.getByText('Qual é a isca?')).toBeInTheDocument()
    })

    it('não repete na partida a pergunta já respondida na capa', async () => {
        const user = userEvent.setup()
        render(<QuizClient serverQuestions={[teaser, ...pool]} />)

        await user.click(screen.getByRole('button', { name: /Certa/ }))
        await user.click(screen.getByRole('button', { name: /valendo pontos/i }))

        // Repetir a isca como primeira pergunta valendo pontos entregaria um
        // acerto de graça — e a pessoa já sabe a resposta.
        expect(screen.queryByText('Qual é a isca?')).not.toBeInTheDocument()
        expect(screen.getByText(/pergunta 1 de/i)).toBeInTheDocument()
    })
})
