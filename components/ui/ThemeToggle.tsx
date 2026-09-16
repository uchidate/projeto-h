'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { trackTema } from '@/lib/analytics'

export function ThemeToggle() {
    const { theme, toggleTheme, isLoaded } = useTheme()

    return (
        <button
            type="button"
            onClick={() => { trackTema(theme === 'dark' ? 'light' : 'dark'); toggleTheme() }}
            className="flex h-9 w-9 items-center justify-center text-muted transition-colors hover:bg-surface hover:text-foreground"
            aria-label={`Mudar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
            title={`Modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
        >
            {/* Mantém o espaço durante SSR para evitar layout shift */}
            {!isLoaded ? (
                <span className="h-5 w-5" />
            ) : theme === 'dark' ? (
                <Sun className="h-5 w-5 transition-transform duration-500 hover:rotate-180" />
            ) : (
                <Moon className="h-5 w-5 transition-transform duration-300 hover:-rotate-12" />
            )}
        </button>
    )
}
