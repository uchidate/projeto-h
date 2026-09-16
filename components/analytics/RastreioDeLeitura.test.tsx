// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { RastreioDeLeitura } from './RastreioDeLeitura'
import * as analytics from '@/lib/analytics'

function visibilidade(estado: 'visible' | 'hidden') {
    Object.defineProperty(document, 'visibilityState', { value: estado, configurable: true })
}

describe('RastreioDeLeitura', () => {
    let emitido: ReturnType<typeof vi.fn<(p: { slug: string; seconds: number }) => void>>

    beforeEach(() => {
        vi.useFakeTimers()
        emitido = vi.fn<(p: { slug: string; seconds: number }) => void>()
        vi.spyOn(analytics, 'trackBlogRead').mockImplementation(emitido)
        visibilidade('visible')
        Object.defineProperty(document.documentElement, 'scrollHeight', { value: 300, configurable: true })
        Object.defineProperty(document.documentElement, 'clientHeight', { value: 300, configurable: true })
    })
    afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

    it('emite blog_read apos 30 segundos de aba visivel', () => {
        render(<RastreioDeLeitura slug="meu-artigo" caminho="/blog/meu-artigo" />)
        vi.advanceTimersByTime(29_000)
        expect(emitido).not.toHaveBeenCalled()
        vi.advanceTimersByTime(1_000)
        expect(emitido).toHaveBeenCalledWith({ slug: 'meu-artigo', seconds: 30 })
    })

    it('nao conta tempo com a aba em segundo plano — aba esquecida nao e leitura', () => {
        visibilidade('hidden')
        render(<RastreioDeLeitura slug="meu-artigo" caminho="/blog/meu-artigo" />)
        vi.advanceTimersByTime(120_000)
        expect(emitido).not.toHaveBeenCalled()
    })

    it('emite uma vez so, mesmo com leitura longa', () => {
        render(<RastreioDeLeitura slug="meu-artigo" caminho="/blog/meu-artigo" />)
        vi.advanceTimersByTime(300_000)
        expect(emitido.mock.calls).toHaveLength(1)
    })

    it('limpa o intervalo ao desmontar', () => {
        const limpar = vi.spyOn(globalThis, 'clearInterval')
        const { unmount } = render(<RastreioDeLeitura slug="a" caminho="/blog/a" />)
        unmount()
        expect(limpar).toHaveBeenCalled()
    })
})
