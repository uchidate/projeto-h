// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { QuizQuestion } from '@/lib/wordpress/quiz'

vi.mock('./ShareCard', () => ({
    generateShareCard: vi.fn(async () => new Blob(['fake-png'], { type: 'image/png' })),
}))
vi.mock('@/lib/consent', () => ({
    podeGuardarHistorico: () => true,
    recusouConsentimento: () => false,
    getBannerState: () => 'oculto',
    getServerBannerState: () => 'oculto',
    subscribeBanner: () => () => {},
    subscribeConsent: () => () => {},
    resetConsent: () => {},
}))

import { ResultScreen } from './ResultScreen'

const perguntas: QuizQuestion[] = [
    { id: 1, question: 'P1?', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'exp', category: 'k-pop', difficulty: 'medium' },
    { id: 2, question: 'P2?', options: ['A', 'B', 'C', 'D'], correct: 1, explanation: 'exp', category: 'k-pop', difficulty: 'medium' },
]

function renderResult() {
    return render(
        <ResultScreen
            questions={perguntas}
            answers={[0, 1]}
            points={200}
            timeHistory={[5, 6]}
            maxTime={20}
            bestStreak={4}
            onReset={() => {}}
        />
    )
}

describe('ResultScreen: compartilhar como imagem', () => {
    beforeEach(() => { vi.restoreAllMocks() })

    it('compartilha o cartão de imagem quando o navegador suporta arquivos', async () => {
        const share = vi.fn().mockResolvedValue(undefined)
        Object.assign(navigator, { share, canShare: () => true })

        renderResult()
        fireEvent.click(screen.getByRole('button', { name: /compartilhar resultado/i }))

        await waitFor(() => expect(share).toHaveBeenCalled())
        const arg = share.mock.calls[0][0]
        expect(arg.files).toHaveLength(1)
        expect(arg.files[0].type).toBe('image/png')
    })

    it('cai para compartilhamento de texto quando não há suporte a arquivos', async () => {
        const share = vi.fn().mockResolvedValue(undefined)
        Object.assign(navigator, { share, canShare: () => false })

        renderResult()
        fireEvent.click(screen.getByRole('button', { name: /compartilhar resultado/i }))

        await waitFor(() => expect(share).toHaveBeenCalled())
        const arg = share.mock.calls[0][0]
        expect(arg.files).toBeUndefined()
        expect(arg.text).toContain('Acertei 2/2')
    })
})
