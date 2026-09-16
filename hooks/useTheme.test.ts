// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from './useTheme'

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

describe('useTheme', () => {
    beforeEach(() => {
        localStorage.clear()
        document.documentElement.classList.remove('dark')
        mockMatchMedia(false)
    })

    it('usa o tema salvo no localStorage quando presente', () => {
        localStorage.setItem('portal_theme', 'light')
        const { result } = renderHook(() => useTheme())
        expect(result.current.theme).toBe('light')
        expect(result.current.isLoaded).toBe(true)
    })

    it('migra a preferência salva pela chave legada', () => {
        localStorage.setItem('portal_legado_theme', 'light')
        const { result } = renderHook(() => useTheme())
        expect(result.current.theme).toBe('light')
        expect(localStorage.getItem('portal_theme')).toBe('light')
        expect(localStorage.getItem('portal_legado_theme')).toBeNull()
    })

    it('sem tema salvo, usa prefers-color-scheme do sistema (dark)', () => {
        mockMatchMedia(true)
        const { result } = renderHook(() => useTheme())
        expect(result.current.theme).toBe('dark')
        expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('sem tema salvo e sem preferência dark do sistema, usa light', () => {
        mockMatchMedia(false)
        const { result } = renderHook(() => useTheme())
        expect(result.current.theme).toBe('light')
        expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('toggleTheme alterna entre dark e light, persiste e atualiza a classe do html', () => {
        localStorage.setItem('portal_theme', 'light')
        const { result } = renderHook(() => useTheme())

        act(() => result.current.toggleTheme())
        expect(result.current.theme).toBe('dark')
        expect(localStorage.getItem('portal_theme')).toBe('dark')
        expect(document.documentElement.classList.contains('dark')).toBe(true)

        act(() => result.current.toggleTheme())
        expect(result.current.theme).toBe('light')
        expect(localStorage.getItem('portal_theme')).toBe('light')
        expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('setTheme define um tema específico e persiste', () => {
        localStorage.setItem('portal_theme', 'light')
        const { result } = renderHook(() => useTheme())

        act(() => result.current.setTheme('dark'))
        expect(result.current.theme).toBe('dark')
        expect(localStorage.getItem('portal_theme')).toBe('dark')
    })

    it('isDark/isLight refletem o tema atual', () => {
        localStorage.setItem('portal_theme', 'dark')
        const { result } = renderHook(() => useTheme())
        expect(result.current.isDark).toBe(true)
        expect(result.current.isLight).toBe(false)
    })
})
