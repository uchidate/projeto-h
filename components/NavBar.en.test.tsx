// @vitest-environment jsdom
// A Loja e o menu do WordPress só existem em português. Este arquivo sobrepõe o
// mock global de next-intl (que fixa 'pt') para provar que o cabeçalho fora do
// português não oferece rotas sem versão traduzida.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import NavBar from './NavBar'

vi.mock('next-intl', async () => {
    const actual = await vi.importActual<typeof import('next-intl')>('next-intl')
    const { createTranslator } = actual
    const messages = { client: (await import('@/messages/en/client.json')).default }
    return {
        ...actual,
        useLocale: () => 'en',
        useTranslations: (namespace?: string) =>
            createTranslator({ locale: 'en', messages, namespace: namespace as never }),
    }
})

vi.mock('next/navigation', () => ({ usePathname: () => '/en/groups/blackpink' }))
vi.mock('@/components/features/MobileMenu', () => ({ MobileMenu: () => <div data-testid="mobile-menu" /> }))
vi.mock('@/components/ui/ThemeToggle', () => ({ ThemeToggle: () => <div data-testid="theme-toggle" /> }))
vi.mock('@/components/ui/UserMenu', () => ({ UserMenu: () => <div data-testid="user-menu" /> }))
vi.mock('@/components/ui/NotificationBell', () => ({ NotificationBell: () => <div data-testid="notification-bell" /> }))
vi.mock('@/lib/hooks/useQuickSearch', () => ({ useQuickSearch: (sel: (s: unknown) => unknown) => sel({ open: vi.fn() }) }))

class MockResizeObserver {
    observe = vi.fn()
    disconnect = vi.fn()
}

describe('NavBar fora do português', () => {
    beforeEach(() => {
        // @ts-expect-error mock global
        global.ResizeObserver = MockResizeObserver
    })

    it('não mostra a Loja, que só existe em português', () => {
        render(<NavBar navLinks={[{ label: 'Groups', href: '/en/groups' }]} logoSubtitles={['Hallyu']} />)
        expect(screen.queryAllByRole('link', { name: /loja|shop/i })).toHaveLength(0)
    })

    it('usa os rótulos de busca em inglês', () => {
        render(<NavBar navLinks={[{ label: 'Groups', href: '/en/groups' }]} logoSubtitles={['Hallyu']} />)
        expect(screen.getByText('Search artists, groups, productions...')).toBeInTheDocument()
        expect(screen.getAllByRole('button', { name: 'Search' }).length).toBeGreaterThan(0)
    })
})
