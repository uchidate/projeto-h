// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useScrollDepth } from './useScrollDepth'
import * as analytics from '@/lib/analytics'

function paginaCom(alturaTotal: number, alturaVisivel: number, posicao: number) {
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: alturaTotal, configurable: true })
    Object.defineProperty(document.documentElement, 'clientHeight', { value: alturaVisivel, configurable: true })
    Object.defineProperty(window, 'scrollY', { value: posicao, configurable: true, writable: true })
}

describe('useScrollDepth', () => {
    let emitido: ReturnType<typeof vi.fn<(p: { depth: number; path: string }) => void>>

    beforeEach(() => {
        emitido = vi.fn<(p: { depth: number; path: string }) => void>()
        vi.spyOn(analytics, 'trackScrollDepth').mockImplementation(emitido)
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0 })
    })
    afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

    it('ignora pagina que nao rola — 100% seria trivialmente verdadeiro', () => {
        paginaCom(700, 600, 0)
        renderHook(() => useScrollDepth('/curta'))
        expect(emitido).not.toHaveBeenCalled()
    })

    it('emite os marcos cruzados numa pagina longa', () => {
        paginaCom(4000, 800, 1400) // (1400+800)/4000 = 55%
        renderHook(() => useScrollDepth('/artigo'))
        const marcos = emitido.mock.calls.map((c) => c[0].depth)
        expect(marcos).toEqual([25, 50])
    })

    it('nao repete um marco ja atingido', () => {
        paginaCom(4000, 800, 1400)
        renderHook(() => useScrollDepth('/artigo'))
        const antes = emitido.mock.calls.length
        window.dispatchEvent(new Event('scroll'))
        expect(emitido.mock.calls.length).toBe(antes)
    })

    it('inclui o caminho, para separar artigos no relatorio', () => {
        paginaCom(4000, 800, 4000)
        renderHook(() => useScrollDepth('/blog/meu-artigo'))
        expect(emitido.mock.calls[0][0].path).toBe('/blog/meu-artigo')
    })

    it('remove os listeners ao desmontar', () => {
        paginaCom(4000, 800, 0)
        const remove = vi.spyOn(window, 'removeEventListener')
        const { unmount } = renderHook(() => useScrollDepth('/artigo'))
        unmount()
        expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
        expect(remove).toHaveBeenCalledWith('resize', expect.any(Function))
    })
})
