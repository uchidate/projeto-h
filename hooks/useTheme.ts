'use client'
import { storageKey, legacyStorageKey } from '@/lib/constants/identidade.mjs'
/* eslint-disable react-hooks/set-state-in-effect -- theme hydrates after browser APIs become available */

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const THEME_STORAGE_KEY = storageKey('theme')
const LEGACY_THEME_STORAGE_KEY = legacyStorageKey('theme')

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>('dark')
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const current = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
        const legacy = localStorage.getItem(LEGACY_THEME_STORAGE_KEY) as Theme | null
        const saved = current ?? legacy
        const initial = saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        if (!current && legacy) localStorage.setItem(THEME_STORAGE_KEY, legacy)
        localStorage.removeItem(LEGACY_THEME_STORAGE_KEY)
        setThemeState(initial)
        document.documentElement.classList.toggle('dark', initial === 'dark')
        setIsLoaded(true)
    }, [])

    const toggleTheme = () => {
        const next: Theme = theme === 'dark' ? 'light' : 'dark'
        setThemeState(next)
        localStorage.setItem(THEME_STORAGE_KEY, next)
        document.documentElement.classList.toggle('dark', next === 'dark')
    }

    const setTheme = (t: Theme) => {
        setThemeState(t)
        localStorage.setItem(THEME_STORAGE_KEY, t)
        document.documentElement.classList.toggle('dark', t === 'dark')
    }

    return { theme, toggleTheme, setTheme, isDark: theme === 'dark', isLight: theme === 'light', isLoaded }
}
