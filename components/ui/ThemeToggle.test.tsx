// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './ThemeToggle'

function mockMatchMedia(matches: boolean) {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches,
            media: query,
            addListener: vi.fn(),
            removeListener: vi.fn(),
        })),
    })
}

describe('ThemeToggle', () => {
    beforeEach(() => {
        localStorage.clear()
        sessionStorage.clear()
        document.documentElement.classList.remove('dark')
        mockMatchMedia(false)
    })

    it('mostra ícone de lua e label "Mudar para modo escuro" quando o tema é light', () => {
        sessionStorage.setItem('portal_theme_choice', 'light')
        render(<ThemeToggle />)
        expect(screen.getByRole('button', { name: /mudar para modo escuro/i })).toBeInTheDocument()
    })

    it('mostra ícone de sol e label "Mudar para modo claro" quando o tema é dark', () => {
        sessionStorage.setItem('portal_theme_choice', 'dark')
        render(<ThemeToggle />)
        expect(screen.getByRole('button', { name: /mudar para modo claro/i })).toBeInTheDocument()
    })

    it('clicar alterna o tema e atualiza o aria-label', async () => {
        sessionStorage.setItem('portal_theme_choice', 'light')
        const user = userEvent.setup()
        render(<ThemeToggle />)

        const button = screen.getByRole('button', { name: /mudar para modo escuro/i })
        await user.click(button)

        expect(screen.getByRole('button', { name: /mudar para modo claro/i })).toBeInTheDocument()
        expect(sessionStorage.getItem('portal_theme_choice')).toBe('dark')
    })
})
