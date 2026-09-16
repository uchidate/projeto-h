// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

const { trackTempoEngajado, rota } = vi.hoisted(() => ({ trackTempoEngajado: vi.fn(), rota: { atual: '/blog/um-post' } }))
vi.mock('@/lib/analytics', () => ({ trackTempoEngajado, trackWebVital: vi.fn() }))
vi.mock('next/web-vitals', () => ({ useReportWebVitals: () => {} }))
vi.mock('next/navigation', () => ({ usePathname: () => rota.atual }))

import { RastreioDeExperiencia } from './RastreioDeExperiencia'

function definirVisibilidade(estado: 'visible' | 'hidden') {
    Object.defineProperty(document, 'visibilityState', { value: estado, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
}

describe('RastreioDeExperiencia — tempo engajado', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        trackTempoEngajado.mockClear()
        rota.atual = '/blog/um-post'
        Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    })
    afterEach(() => vi.useRealTimers())

    it('envia o tempo visível ao esconder a aba, com o tipo da página', () => {
        render(<RastreioDeExperiencia />)
        vi.advanceTimersByTime(20_000)
        definirVisibilidade('hidden')
        expect(trackTempoEngajado).toHaveBeenCalledOnce()
        expect(trackTempoEngajado).toHaveBeenCalledWith({ segundos: 20, tipoPagina: 'artigo' })
    })

    // Aba esquecida aberta não é atenção.
    it('não conta o tempo com a aba escondida', () => {
        const { unmount } = render(<RastreioDeExperiencia />)
        vi.advanceTimersByTime(10_000)
        definirVisibilidade('hidden')
        trackTempoEngajado.mockClear()
        vi.advanceTimersByTime(600_000)
        unmount()
        expect(trackTempoEngajado).not.toHaveBeenCalled()
    })

    it('ignora passagem rápida demais para ser atenção', () => {
        const { unmount } = render(<RastreioDeExperiencia />)
        vi.advanceTimersByTime(1_000)
        unmount()
        expect(trackTempoEngajado).not.toHaveBeenCalled()
    })
})
