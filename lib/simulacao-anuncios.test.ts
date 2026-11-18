// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CHAVE_SIMULACAO, instalarSimulacao, lerSimulacao, tamanhoSimulado } from './simulacao-anuncios'

function memoria() {
    const m = new Map<string, string>()
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }
}

describe('lerSimulacao', () => {
    it('liga pela URL, guarda as opções na aba e desliga com =0', () => {
        const s = memoria()
        expect(lerSimulacao('', s)).toBeNull()
        expect(lerSimulacao('?hh-simular-anuncios=1&vinheta=0&preenche=0.6', s)).toEqual({ ancora: true, vinheta: false, preenche: 0.6 })
        expect(lerSimulacao('?outra=1', s)).toEqual({ ancora: true, vinheta: false, preenche: 0.6 })
        expect(lerSimulacao('?hh-simular-anuncios=0', s)).toBeNull()
        expect(s.getItem(CHAVE_SIMULACAO)).toBeNull()
    })
})

describe('tamanhoSimulado', () => {
    it('usa os tamanhos típicos e cabe no espaço', () => {
        expect(tamanhoSimulado('auto', 390, 358)).toEqual({ w: 358, h: 280 })
        expect(tamanhoSimulado('horizontal', 1366, 900)).toEqual({ w: 728, h: 90 })
        expect(tamanhoSimulado('vertical', 1366, 300)).toEqual({ w: 300, h: 600 })
        expect(tamanhoSimulado('rectangle', 390, 358)).toEqual({ w: 300, h: 250 })
    })
})

describe('instalarSimulacao', () => {
    afterEach(() => { vi.useRealTimers(); document.body.innerHTML = '' })

    it('nunca carrega o Google, preenche os espaços pedidos (inclusive os de antes) e põe a âncora', () => {
        vi.useFakeTimers()
        document.body.innerHTML = '<div data-ad-placement="a"><ins class="adsbygoogle" data-ad-format="auto"></ins></div><div data-ad-placement="b"><ins class="adsbygoogle" data-ad-format="horizontal"></ins></div>'
        const w = window as unknown as { adsbygoogle?: unknown[] }
        w.adsbygoogle = [{}] // pedido feito antes da instalação
        const desfazer = instalarSimulacao({ ancora: true, vinheta: false, preenche: 1 })
        w.adsbygoogle!.push({})
        vi.advanceTimersByTime(3000)
        const ins = [...document.querySelectorAll('[data-ad-placement] ins')]
        expect(ins.map(i => i.getAttribute('data-ad-status'))).toEqual(['filled', 'filled'])
        expect(document.querySelectorAll('[data-sim-anuncio]').length).toBe(3)
        expect(document.querySelector('body > ins.adsbygoogle[data-anchor-status="displayed"]')).not.toBeNull()
        expect(document.querySelector('script[src*="googlesyndication"]')).toBeNull()
        desfazer()
        expect(document.querySelector('[data-anchor-status]')).toBeNull()
    })

    it('com preenche=0 o espaço volta vazio, como um leilão sem anúncio', () => {
        vi.useFakeTimers()
        document.body.innerHTML = '<div data-ad-placement="a"><ins class="adsbygoogle"></ins></div>'
        instalarSimulacao({ ancora: false, vinheta: false, preenche: 0 })
        ;(window as unknown as { adsbygoogle: unknown[] }).adsbygoogle.push({})
        vi.advanceTimersByTime(3000)
        expect(document.querySelector('ins')!.getAttribute('data-ad-status')).toBe('unfilled')
    })
})
