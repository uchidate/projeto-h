'use client'
import { storageKey } from '@/lib/constants/identidade.mjs'
/* eslint-disable react-hooks/set-state-in-effect -- theme hydrates after browser APIs become available */

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
/**
 * O site sempre ABRE no tema claro, qualquer que seja o tema do sistema ou a escolha da visita
 * anterior. O visitante pode alternar; a escolha vale só enquanto a aba estiver aberta
 * (sessionStorage), então uma nova visita volta ao claro. As chaves antigas (localStorage),
 * que guardavam o padrão e não a escolha, são descartadas.
 */
const THEME_STORAGE_KEY = storageKey('theme_choice')
const ANTIGAS = [storageKey('theme')]

function lerSessao(): string | null {
    try { return sessionStorage.getItem(THEME_STORAGE_KEY) } catch { return null }
}
function gravarSessao(valor: Theme) {
    try { sessionStorage.setItem(THEME_STORAGE_KEY, valor) } catch { /* modo privado: a escolha só não sobrevive ao recarregar */ }
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>('light')
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const saved = lerSessao()
        const initial: Theme = saved === 'dark' ? 'dark' : 'light'
        ANTIGAS.forEach(chave => localStorage.removeItem(chave))
        localStorage.removeItem(THEME_STORAGE_KEY)
        setThemeState(initial)
        document.documentElement.classList.toggle('dark', initial === 'dark')
        setIsLoaded(true)
    }, [])

    const setTheme = (t: Theme) => {
        setThemeState(t)
        gravarSessao(t)
        document.documentElement.classList.toggle('dark', t === 'dark')
    }

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

    return { theme, toggleTheme, setTheme, isDark: theme === 'dark', isLight: theme === 'light', isLoaded }
}
