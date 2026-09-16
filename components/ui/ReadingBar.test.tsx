// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react'
import { ReadingBar } from './ReadingBar'

type ObserverCallback = (entries: { target: { id: string }; isIntersecting: boolean }[]) => void

function setScroll(scrollTop: number, scrollHeight = 2000, clientHeight = 800) {
    Object.defineProperty(document.documentElement, 'scrollTop', { value: scrollTop, configurable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: scrollHeight, configurable: true })
    Object.defineProperty(document.documentElement, 'clientHeight', { value: clientHeight, configurable: true })
    fireEvent.scroll(window)
}

describe('ReadingBar', () => {
    let observerCallbacks: ObserverCallback[]

    beforeEach(() => {
        observerCallbacks = []
        vi.stubGlobal('IntersectionObserver', class {
            constructor(cb: ObserverCallback) { observerCallbacks.push(cb) }
            observe() {}
            disconnect() {}
        })
        Element.prototype.scrollIntoView = vi.fn()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        setScroll(0)
    })

    const baseProps = { backHref: '/blog', backLabel: 'Blog', title: 'Meu Artigo', pageUrl: 'https://x.com/a' }

    it('fica invisível (opacity-0) antes de passar do scrollThreshold', () => {
        const { container } = render(<ReadingBar {...baseProps} />)
        act(() => setScroll(50))
        expect(container.querySelector('[data-reading-bar]')).toHaveClass('opacity-0')
    })

    it('fica visível depois de passar do scrollThreshold (default 220px)', () => {
        const { container } = render(<ReadingBar {...baseProps} />)
        act(() => setScroll(300))
        expect(container.querySelector('[data-reading-bar]')).toHaveClass('opacity-100')
    })

    it('respeita um scrollThreshold customizado', () => {
        const { container } = render(<ReadingBar {...baseProps} scrollThreshold={50} />)
        act(() => setScroll(60))
        expect(container.querySelector('[data-reading-bar]')).toHaveClass('opacity-100')
    })

    it('calcula a % de progresso de leitura com base no scroll', () => {
        const { container } = render(<ReadingBar {...baseProps} />)
        // scrollTop=400, total scrollável = scrollHeight(2000) - clientHeight(800) = 1200 → 400/1200 = 33.33%
        act(() => setScroll(400))
        const bar = container.querySelector('.bg-accent') as HTMLElement
        expect(bar.style.width).toBe('33.33333333333333%')
    })

    it('progresso nunca passa de 100%', () => {
        const { container } = render(<ReadingBar {...baseProps} />)
        act(() => setScroll(999999))
        const bar = container.querySelector('.bg-accent') as HTMLElement
        expect(bar.style.width).toBe('100%')
    })

    it('mostra o link de voltar com o label passado', () => {
        render(<ReadingBar {...baseProps} />)
        expect(screen.getAllByRole('link', { name: /blog/i })).toEqual(
            expect.arrayContaining([expect.objectContaining({ href: expect.stringContaining('/blog') })]),
        )
    })

    it('não renderiza a linha de âncoras quando pageAnchors está vazio', () => {
        const { container } = render(<ReadingBar {...baseProps} />)
        expect(container.querySelectorAll('a[data-anchor]')).toHaveLength(0)
    })

    it('renderiza um link por âncora quando pageAnchors é passado', () => {
        render(<ReadingBar {...baseProps} pageAnchors={[{ href: '#intro', label: 'Introdução' }, { href: '#final', label: 'Final' }]} />)
        expect(screen.getByRole('link', { name: 'Introdução' })).toHaveAttribute('href', '#intro')
        expect(screen.getByRole('link', { name: 'Final' })).toHaveAttribute('href', '#final')
    })

    it('marca a âncora ativa quando o IntersectionObserver reporta a seção visível', () => {
        document.body.innerHTML = '<div id="intro"></div><div id="final"></div>'
        render(<ReadingBar {...baseProps} pageAnchors={[{ href: '#intro', label: 'Introdução' }, { href: '#final', label: 'Final' }]} />)

        act(() => {
            observerCallbacks[0]([{ target: { id: 'final' }, isIntersecting: true }])
        })

        expect(screen.getByRole('link', { name: 'Final' })).toHaveClass('text-accent')
        expect(screen.getByRole('link', { name: 'Introdução' })).not.toHaveClass('text-accent')
    })

    it('oferece todas as seções em um seletor compacto e navega sem radio tabs', () => {
        document.body.innerHTML = '<div id="intro"></div><div id="final"></div>'
        render(<ReadingBar {...baseProps} pageAnchors={[{ href: '#intro', label: 'Introdução' }, { href: '#final', label: 'Final' }]} />)

        fireEvent.change(screen.getByRole('combobox', { name: 'Ir para seção' }), { target: { value: '#final' } })

        expect(document.getElementById('final')?.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
        expect(window.location.hash).toBe('#final')
    })

    it('mantém uma ação única de compartilhamento na barra compacta', async () => {
        const share = vi.fn().mockResolvedValue(undefined)
        vi.stubGlobal('navigator', { ...navigator, share, clipboard: navigator.clipboard })
        render(<ReadingBar {...baseProps} />)

        fireEvent.click(screen.getByRole('button', { name: 'Compartilhar página' }))

        expect(share).toHaveBeenCalledWith({ title: 'Meu Artigo', url: 'https://x.com/a' })
        expect(await screen.findByRole('button', { name: 'Link compartilhado' })).toBeInTheDocument()
    })

    it('mostra a tag (com link) quando tagLabel e tagHref são passados', () => {
        render(<ReadingBar {...baseProps} tagLabel="K-Pop" tagHref="/blog?category=k-pop" />)
        expect(screen.getByRole('link', { name: 'K-Pop' })).toHaveAttribute('href', '/blog?category=k-pop')
    })

    it('mostra a tag como texto simples (sem link) quando só tagLabel é passado', () => {
        render(<ReadingBar {...baseProps} tagLabel="K-Pop" />)
        expect(screen.queryByRole('link', { name: 'K-Pop' })).not.toBeInTheDocument()
        expect(screen.getByText('K-Pop')).toBeInTheDocument()
    })
})
