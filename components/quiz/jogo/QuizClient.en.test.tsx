// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuizClient } from './QuizClient'
import type { QuizQuestion } from '@/lib/wordpress/quiz'

// Sobrescreve o mock global (português) com as mensagens em inglês.
vi.mock('next-intl', async () => {
    const actual = await vi.importActual<typeof import('next-intl')>('next-intl')
    const client = (await import('@/messages/en/client.json')).default
    return {
        ...actual,
        useLocale: () => 'en',
        useTranslations: (namespace?: string) =>
            actual.createTranslator({ locale: 'en', messages: { client }, namespace: namespace as never }),
        NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
    }
})
vi.mock('@/lib/analytics', () => ({ trackQuizStart: vi.fn(), trackQuizComplete: vi.fn() }))
vi.mock('@/components/ui/AdSlotInline', () => ({ AdSlotInline: () => null }))

const pool: QuizQuestion[] = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1, question: `Question ${i + 1}?`, options: ['A', 'B', 'C', 'D'], correct: 0,
    explanation: 'Because.', category: i % 2 ? 'cultura' : 'k-pop', difficulty: 'medium',
}))

describe('QuizClient em inglês', () => {
    beforeEach(() => localStorage.clear())

    it('mostra a capa em inglês e só os temas que têm perguntas', () => {
        render(<QuizClient serverQuestions={pool} />)
        expect(screen.getByRole('button', { name: /Play now/ })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Mixed bag/ })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /K-Pop/ })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /K-Drama/ })).not.toBeInTheDocument()
        expect(screen.getByText(/Pick your team/)).toBeInTheDocument()
        expect(screen.queryByText(/Jogar/)).not.toBeInTheDocument()
    })
})
