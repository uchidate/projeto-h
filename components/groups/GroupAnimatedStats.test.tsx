// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { GroupAnimatedStats } from './GroupAnimatedStats'

let observerInstances: { callback: IntersectionObserverCallback; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = []

class MockIntersectionObserver {
    callback: IntersectionObserverCallback
    observe = vi.fn()
    disconnect = vi.fn()
    constructor(callback: IntersectionObserverCallback) {
        this.callback = callback
        observerInstances.push(this)
    }
}

function triggerIntersection(index = 0, isIntersecting = true) {
    act(() => {
        observerInstances[index].callback(
            [{ isIntersecting } as IntersectionObserverEntry],
            observerInstances[index] as unknown as IntersectionObserver,
        )
    })
}

describe('GroupAnimatedStats', () => {
    beforeEach(() => {
        observerInstances = []
        // @ts-expect-error mock global
        global.IntersectionObserver = MockIntersectionObserver
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
            cb(1000) // salta direto pro fim da animação (progress = 1)
            return 0
        })
        vi.spyOn(performance, 'now').mockReturnValue(0)
    })

    it('não renderiza nada com array de stats vazio', () => {
        const { container } = render(<GroupAnimatedStats stats={[]} accent="#000" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('mostra o valor bruto (sem animar) antes de entrar em viewport', () => {
        render(<GroupAnimatedStats stats={[{ label: 'Membros', value: '7' }]} accent="#000" />)
        expect(screen.getByText('7')).toBeInTheDocument()
    })

    it('anima o valor numérico até o alvo quando entra em viewport', () => {
        render(<GroupAnimatedStats stats={[{ label: 'Seguidores', value: '1500' }]} accent="#000" />)
        triggerIntersection(0, true)
        expect(screen.getByText('1.500')).toBeInTheDocument()
    })

    it('preserva o sufixo não-numérico (ex: "1500+" ou "50M")', () => {
        render(<GroupAnimatedStats stats={[{ label: 'Views', value: '50M' }]} accent="#000" />)
        triggerIntersection(0, true)
        expect(screen.getByText('50M')).toBeInTheDocument()
    })

    it('não anima anos (valores entre 1900-2100 sem sufixo) — mostra o ano cru', () => {
        render(<GroupAnimatedStats stats={[{ label: 'Fundação', value: '2013' }]} accent="#000" />)
        triggerIntersection(0, true)
        expect(screen.getByText('2013')).toBeInTheDocument()
    })

    it('não anima valores muito grandes (>= 100000) — mostra o valor cru', () => {
        render(<GroupAnimatedStats stats={[{ label: 'Streams', value: '150000' }]} accent="#000" />)
        triggerIntersection(0, true)
        expect(screen.getByText('150000')).toBeInTheDocument()
    })

    it('limita a exibição a no máximo 4 stats', () => {
        const stats = Array.from({ length: 6 }, (_, i) => ({ label: `Stat ${i}`, value: `${i}` }))
        render(<GroupAnimatedStats stats={stats} accent="#000" />)
        expect(screen.getByText('Stat 3')).toBeInTheDocument()
        expect(screen.queryByText('Stat 4')).not.toBeInTheDocument()
    })

    it('quando não está intersecting, mantém o valor não-animado', () => {
        render(<GroupAnimatedStats stats={[{ label: 'Membros', value: '7'}]} accent="#000" />)
        triggerIntersection(0, false)
        expect(screen.getByText('7')).toBeInTheDocument()
    })
})
