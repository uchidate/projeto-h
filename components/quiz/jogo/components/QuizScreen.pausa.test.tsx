// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import type { QuizQuestion } from '@/lib/wordpress/quiz'

const banner = vi.hoisted(() => ({ estado: 'oculto' as 'oculto' | 'perguntar' }))
vi.mock('@/lib/consent', () => ({
    getBannerState: () => banner.estado,
    getServerBannerState: () => 'oculto',
    subscribeBanner: () => () => {},
}))
vi.mock('@/lib/analytics', () => ({ trackQuizStart: vi.fn(), trackQuizComplete: vi.fn() }))

import { QuizScreen } from './QuizScreen'

const perguntas: QuizQuestion[] = [{
    id: 1, question: 'Pergunta um?', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'Porque sim.', category: 'k-pop', difficulty: 'medium',
}]

describe('QuizScreen: relógio e aviso de cookies', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('o tempo corre normalmente sem o aviso', () => {
        banner.estado = 'oculto'
        render(<QuizScreen questions={perguntas} difficulty="medium" onFinish={() => {}} />)
        for (let i = 0; i < 3; i++) act(() => { vi.advanceTimersByTime(1000) })
        expect(screen.getByText('12s')).toBeInTheDocument()
    })

    it('o tempo para enquanto o aviso de cookies está aberto', () => {
        banner.estado = 'perguntar'
        render(<QuizScreen questions={perguntas} difficulty="medium" onFinish={() => {}} />)
        for (let i = 0; i < 5; i++) act(() => { vi.advanceTimersByTime(1000) })
        expect(screen.getByText('15s')).toBeInTheDocument()
    })
})
