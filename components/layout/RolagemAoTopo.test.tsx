// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

let caminho = '/artists'
vi.mock('next/navigation', () => ({ usePathname: () => caminho }))

import { RolagemAoTopo } from './RolagemAoTopo'

describe('RolagemAoTopo', () => {
    const scrollTo = vi.fn()
    beforeEach(() => {
        scrollTo.mockReset()
        caminho = '/artists'
        window.scrollTo = scrollTo as unknown as typeof window.scrollTo
        window.history.replaceState(null, '', '/artists')
    })

    it('não rola na primeira renderização', () => {
        render(<RolagemAoTopo />)
        expect(scrollTo).not.toHaveBeenCalled()
    })

    it('sobe ao topo quando o caminho muda', () => {
        const { rerender } = render(<RolagemAoTopo />)
        caminho = '/artists/iu'
        rerender(<RolagemAoTopo />)
        expect(scrollTo).toHaveBeenCalledWith(0, 0)
    })

    it('mantém a posição quando só a query muda (mesmo caminho)', () => {
        const { rerender } = render(<RolagemAoTopo />)
        rerender(<RolagemAoTopo />)
        expect(scrollTo).not.toHaveBeenCalled()
    })

    it('não mexe ao voltar no histórico nem com âncora', () => {
        const { rerender } = render(<RolagemAoTopo />)
        act(() => { window.dispatchEvent(new PopStateEvent('popstate')) })
        caminho = '/blog'
        rerender(<RolagemAoTopo />)
        expect(scrollTo).not.toHaveBeenCalled()
        window.history.replaceState(null, '', '/guias#secao')
        caminho = '/guias'
        rerender(<RolagemAoTopo />)
        expect(scrollTo).not.toHaveBeenCalled()
    })
})
