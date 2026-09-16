// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NavBar from './NavBar'

let pathnameValue = '/'

vi.mock('next/navigation', () => ({ usePathname: () => pathnameValue }))
vi.mock('@/components/features/MobileMenu', () => ({ MobileMenu: () => <div data-testid="mobile-menu" /> }))
vi.mock('@/components/ui/ThemeToggle', () => ({ ThemeToggle: () => <div data-testid="theme-toggle" /> }))
vi.mock('@/components/features/QuickSearch', () => ({ QuickSearch: () => <div data-testid="quick-search" /> }))
vi.mock('@/components/ui/UserMenu', () => ({ UserMenu: () => <div data-testid="user-menu" /> }))
vi.mock('@/components/ui/NotificationBell', () => ({ NotificationBell: () => <div data-testid="notification-bell" /> }))

const openSearchMock = vi.fn()
vi.mock('@/lib/hooks/useQuickSearch', () => ({ useQuickSearch: (sel: (s: unknown) => unknown) => sel({ open: openSearchMock }) }))

class MockResizeObserver {
    observe = vi.fn()
    disconnect = vi.fn()
}

const navLinks = [
    { label: 'Artistas', href: '/artists' },
    { label: 'Produções', href: '/productions' },
]

describe('NavBar', () => {
    beforeEach(() => {
        pathnameValue = '/'
        openSearchMock.mockClear()
        // @ts-expect-error mock global
        global.ResizeObserver = MockResizeObserver
    })

    it('renderiza todos os links de navegação (mobile + desktop)', () => {
        render(<NavBar navLinks={navLinks} logoSubtitles={['Hallyu']} />)
        expect(screen.getAllByRole('link', { name: 'Artistas' }).length).toBeGreaterThan(0)
        expect(screen.getAllByRole('link', { name: 'Produções' }).length).toBeGreaterThan(0)
    })

    it('marca o link ativo via correspondência exata do pathname', () => {
        pathnameValue = '/artists'
        render(<NavBar navLinks={navLinks} logoSubtitles={['Hallyu']} />)
        const links = screen.getAllByRole('link', { name: 'Artistas' })
        expect(links.some(l => l.classList.contains('is-active'))).toBe(true)
    })

    it('marca o link ativo por prefixo (subpáginas)', () => {
        pathnameValue = '/artists/bts'
        render(<NavBar navLinks={navLinks} logoSubtitles={['Hallyu']} />)
        const links = screen.getAllByRole('link', { name: 'Artistas' })
        expect(links.some(l => l.classList.contains('is-active'))).toBe(true)
    })

    it('não marca outros links como ativos', () => {
        pathnameValue = '/artists'
        render(<NavBar navLinks={navLinks} logoSubtitles={['Hallyu']} />)
        const links = screen.getAllByRole('link', { name: 'Produções' })
        expect(links.every(l => l.classList.contains('is-inactive'))).toBe(true)
    })

    it('clicar no botão de busca desktop abre a busca via store e dispara evento customizado', async () => {
        const user = userEvent.setup()
        const eventSpy = vi.fn()
        window.addEventListener('quick-search:open', eventSpy)
        render(<NavBar navLinks={navLinks} logoSubtitles={['Hallyu']} />)

        await user.click(screen.getByRole('button', { name: /abrir busca/i }))
        expect(openSearchMock).toHaveBeenCalled()
        expect(eventSpy).toHaveBeenCalled()
        window.removeEventListener('quick-search:open', eventSpy)
    })

    it('adiciona sombra ao nav quando a página tem scroll', () => {
        const { container } = render(<NavBar navLinks={navLinks} logoSubtitles={['Hallyu']} />)
        const nav = container.querySelector('nav')!
        expect(nav.className).not.toContain('shadow-')

        Object.defineProperty(window, 'scrollY', { value: 100, configurable: true })
        fireEvent.scroll(window)
        expect(nav.className).toContain('shadow-')
    })

    it('define a variável CSS --site-header-h baseada na altura do nav', () => {
        render(<NavBar navLinks={navLinks} logoSubtitles={['Hallyu']} />)
        expect(document.documentElement.style.getPropertyValue('--site-header-h')).toMatch(/px$/)
    })
})
