// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GroupStatsNumbers } from './GroupStatsNumbers'

describe('GroupStatsNumbers', () => {
    beforeEach(() => {
        // dispara visible=true imediatamente (sem esperar scroll de verdade)
        vi.stubGlobal('IntersectionObserver', class {
            constructor(private cb: (entries: { isIntersecting: boolean }[]) => void) {}
            observe() { this.cb([{ isIntersecting: true }]) }
            disconnect() {}
        })
        // completa a animação de count-up numa única chamada (t=1 de cara)
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            cb(performance.now() + 10000)
            return 0
        })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('não renderiza nada quando não há stats', () => {
        const { container } = render(<GroupStatsNumbers stats={[]} accent="#000" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('usa o primeiro stat como "hero" e o resto numa grid', () => {
        const stats = [
            { label: 'Membros', value: '7' },
            { label: 'Álbuns', value: '12' },
            { label: 'Anos ativos', value: '10' },
        ]
        render(<GroupStatsNumbers stats={stats} accent="#000" />)
        expect(screen.getByText('Membros')).toBeInTheDocument()
        expect(screen.getByText('Álbuns')).toBeInTheDocument()
    })

    // o watermark decorativo do card "hero" também mostra os dígitos do valor
    // (ex: "50000"), então buscamos o valor só no <p> com .tabular-nums
    function valueText(container: HTMLElement) {
        return container.querySelector('.tabular-nums')?.textContent
    }

    it('anima (conta até) valores numéricos simples', () => {
        const { container } = render(<GroupStatsNumbers stats={[{ label: 'Membros', value: '7' }]} accent="#000" />)
        expect(valueText(container)).toBe('7')
    })

    it('não anima valores com sufixo (ex: "1.2M seguidores") — mostra o texto como está', () => {
        const { container } = render(<GroupStatsNumbers stats={[{ label: 'Seguidores', value: '1.2M' }]} accent="#000" />)
        expect(valueText(container)).toBe('1.2M')
    })

    it('não anima valores fora do range animável (>= 10000)', () => {
        const { container } = render(<GroupStatsNumbers stats={[{ label: 'Fãs', value: '50000' }]} accent="#000" />)
        expect(valueText(container)).toBe('50000')
    })

    it('mostra a descrição quando presente', () => {
        render(<GroupStatsNumbers stats={[{ label: 'Membros', value: '7', description: 'Todos ativos' }]} accent="#000" />)
        expect(screen.getByText('Todos ativos')).toBeInTheDocument()
    })
})
