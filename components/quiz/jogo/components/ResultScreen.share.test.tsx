// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react'
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

// Prepara o compartilhamento e devolve o que cada plano alternativo faria: baixar a imagem e copiar o texto.
function preparar(share: ReturnType<typeof vi.fn> | undefined, comArquivo: boolean) {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { share, canShare: () => comArquivo })
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    URL.createObjectURL = vi.fn(() => 'blob:cartao')
    URL.revokeObjectURL = vi.fn()
    const baixar = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderResult()
    fireEvent.click(screen.getByRole('button', { name: /compartilhar resultado/i }))
    return { writeText, baixar }
}
const cancelado = () => new DOMException('cancelado', 'AbortError')
const esperarOsPlanos = () => new Promise((r) => setTimeout(r, 0))

describe('ResultScreen: cancelar e planos alternativos', () => {
    beforeEach(() => { cleanup(); vi.restoreAllMocks() })

    it.each([['com imagem', true], ['só texto', false]])('cancelar o compartilhamento %s encerra ali', async (_, comArquivo) => {
        const share = vi.fn().mockRejectedValue(cancelado())
        const { writeText, baixar } = preparar(share, comArquivo)

        await waitFor(() => expect(share).toHaveBeenCalled())
        await esperarOsPlanos()
        expect(share).toHaveBeenCalledTimes(1)
        expect(baixar).not.toHaveBeenCalled()
        expect(writeText).not.toHaveBeenCalled()
    })

    it('falha que não é cancelamento tenta o texto', async () => {
        const share = vi.fn().mockRejectedValueOnce(new Error('imagem recusada')).mockResolvedValue(undefined)
        const { writeText, baixar } = preparar(share, true)

        await waitFor(() => expect(share).toHaveBeenCalledTimes(2))
        await esperarOsPlanos()
        expect(share.mock.calls[1][0].files).toBeUndefined()
        expect(baixar).not.toHaveBeenCalled()
        expect(writeText).not.toHaveBeenCalled()
    })

    it('sem compartilhamento no navegador, baixa a imagem e copia o texto', async () => {
        const { writeText, baixar } = preparar(undefined, false)

        await waitFor(() => expect(writeText).toHaveBeenCalled())
        expect(baixar).toHaveBeenCalledTimes(1)
        expect(writeText.mock.calls[0][0]).toContain('Acertei 2/2')
    })
})
