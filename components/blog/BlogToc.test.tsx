// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { BlogToc } from './BlogToc'

type ObserverCallback = (entries: { target: { id: string }; isIntersecting: boolean }[]) => void

function heading(id: string, text: string, level: 2 | 3 = 2) {
    return { id, text, level }
}

describe('BlogToc', () => {
    let observerCallbacks: ObserverCallback[]

    beforeEach(() => {
        observerCallbacks = []
        vi.stubGlobal('CSS', { escape: (s: string) => s })
        vi.stubGlobal('IntersectionObserver', class {
            constructor(cb: ObserverCallback) { observerCallbacks.push(cb) }
            observe() {}
            disconnect() {}
        })
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0 })
        vi.stubGlobal('cancelAnimationFrame', () => {})
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    function renderWithVisibleHeadings(headings: ReturnType<typeof heading>[]) {
        // simula os headings existindo no DOM com offsetHeight > 0 (visíveis)
        for (const h of headings) {
            const el = document.createElement('h2')
            el.id = h.id
            Object.defineProperty(el, 'offsetHeight', { value: 20, configurable: true })
            document.body.appendChild(el)
        }
        return render(<BlogToc headings={headings} />)
    }

    // Com >5 headings, o componente também renderiza "progress dots" cujo
    // aria-label repete o texto do heading — desambigua pegando só o link
    // cujo texto visível (não aria-label) é o esperado.
    function getTextLink(name: string) {
        const links = screen.getAllByRole('link', { name })
        const match = links.find(l => l.textContent === name)
        if (!match) throw new Error(`Nenhum link de texto (não-dot) encontrado com nome "${name}"`)
        return match
    }
    function queryTextLink(name: string) {
        const links = screen.queryAllByRole('link', { name })
        return links.find(l => l.textContent === name) ?? null
    }

    it('não renderiza nada com menos de 2 headings', () => {
        const { container } = render(<BlogToc headings={[heading('a', 'Intro')]} />)
        expect(container).toBeEmptyDOMElement()
    })

    it('não renderiza nada sem nenhum heading', () => {
        const { container } = render(<BlogToc headings={[]} />)
        expect(container).toBeEmptyDOMElement()
    })

    it('mostra todos os headings quando o total é menor ou igual à janela (5)', () => {
        const headings = [heading('a', 'A'), heading('b', 'B'), heading('c', 'C')]
        renderWithVisibleHeadings(headings)
        expect(screen.getByRole('link', { name: 'A' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'B' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'C' })).toBeInTheDocument()
    })

    it('marca o primeiro heading como ativo por padrão (activeIdx inicial = 0)', () => {
        const headings = [heading('a', 'A'), heading('b', 'B')]
        renderWithVisibleHeadings(headings)
        expect(screen.getByRole('link', { name: 'A' })).toHaveClass('text-accent')
        expect(screen.getByRole('link', { name: 'B' })).not.toHaveClass('text-accent')
    })

    it('com mais de 5 headings, trunca a janela e mostra o contador "N seções abaixo"', () => {
        const headings = Array.from({ length: 8 }, (_, i) => heading(`h${i}`, `Heading ${i}`))
        renderWithVisibleHeadings(headings)
        // janela inicial: activeIdx=0, half=2, start=max(0,-2)=0, end=min(8,5)=5
        expect(getTextLink('Heading 0')).toBeInTheDocument()
        expect(getTextLink('Heading 4')).toBeInTheDocument()
        expect(queryTextLink('Heading 5')).toBeNull()
        expect(screen.getByText(/3 seções abaixo/i)).toBeInTheDocument()
    })

    it('atualiza a janela quando o IntersectionObserver reporta um heading diferente como ativo', () => {
        const headings = Array.from({ length: 8 }, (_, i) => heading(`h${i}`, `Heading ${i}`))
        renderWithVisibleHeadings(headings)

        act(() => {
            observerCallbacks[0]([{ target: { id: 'h6' }, isIntersecting: true }])
        })

        // activeIdx=6, half=2, start=max(0,4)=4, end=min(8,9)=8 → shift start=max(0,8-5)=3
        expect(getTextLink('Heading 6')).toHaveClass('text-accent')
        expect(screen.getByText(/3 seções acima/i)).toBeInTheDocument()
        expect(screen.queryByText(/seções abaixo/i)).not.toBeInTheDocument()
    })

    it('contador usa singular ("1 seção acima") quando só falta 1', () => {
        const headings = Array.from({ length: 6 }, (_, i) => heading(`h${i}`, `Heading ${i}`))
        renderWithVisibleHeadings(headings)
        act(() => {
            observerCallbacks[0]([{ target: { id: 'h5' }, isIntersecting: true }])
        })
        expect(screen.getByText(/1 seção acima/i)).toBeInTheDocument()
    })
})
