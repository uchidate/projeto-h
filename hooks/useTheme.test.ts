// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from './useTheme'

describe('useTheme', () => {
    beforeEach(() => {
        localStorage.clear()
        sessionStorage.clear()
        document.documentElement.classList.remove('dark')
    })

    it('sem escolha salva abre no claro, mesmo com o sistema em tema escuro', () => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: () => ({ matches: true, media: '', addListener() {}, removeListener() {} }),
        })
        const { result } = renderHook(() => useTheme())
        expect(result.current.theme).toBe('light')
        expect(result.current.isLoaded).toBe(true)
        expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('uma escolha feita em visita anterior (localStorage) não vale: abre no claro', () => {
        localStorage.setItem('portal_theme_choice', 'dark')
        const { result } = renderHook(() => useTheme())
        expect(result.current.theme).toBe('light')
    })

    it('usa a escolha feita nesta visita (aba)', () => {
        sessionStorage.setItem('portal_theme_choice', 'dark')
        const { result } = renderHook(() => useTheme())
        expect(result.current.theme).toBe('dark')
        expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('descarta a chave antiga, que guardava o padrão e não a escolha', () => {
        localStorage.setItem('portal_theme', 'dark')
        const { result } = renderHook(() => useTheme())
        expect(result.current.theme).toBe('light')
        expect(localStorage.getItem('portal_theme')).toBeNull()
    })

    it('toggleTheme alterna, persiste a escolha e atualiza a classe do html', () => {
        const { result } = renderHook(() => useTheme())

        act(() => result.current.toggleTheme())
        expect(result.current.theme).toBe('dark')
        expect(sessionStorage.getItem('portal_theme_choice')).toBe('dark')
        expect(document.documentElement.classList.contains('dark')).toBe(true)

        act(() => result.current.toggleTheme())
        expect(result.current.theme).toBe('light')
        expect(sessionStorage.getItem('portal_theme_choice')).toBe('light')
        expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('setTheme define um tema específico e persiste', () => {
        const { result } = renderHook(() => useTheme())
        act(() => result.current.setTheme('dark'))
        expect(result.current.theme).toBe('dark')
        expect(sessionStorage.getItem('portal_theme_choice')).toBe('dark')
    })

    it('isDark/isLight refletem o tema atual', () => {
        sessionStorage.setItem('portal_theme_choice', 'dark')
        const { result } = renderHook(() => useTheme())
        expect(result.current.isDark).toBe(true)
        expect(result.current.isLight).toBe(false)
    })
})
