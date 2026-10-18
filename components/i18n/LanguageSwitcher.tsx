'use client'
/* eslint-disable react-hooks/set-state-in-effect -- idioma do navegador e dispensa só existem no cliente; ler no render quebraria a hidratação */

import { useEffect, useState } from 'react'

import type { LanguageLink } from '@/lib/i18n/language-links'

export type { LanguageLink }

const DISMISS_KEY = 'hh-language-notice-dismissed'

function Globo() {
    return (
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.4 4 5.5 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.5-4-9s1.4-6.6 4-9z" />
        </svg>
    )
}

/**
 * Link para as outras versões da página — D1 em docs/I18N-ARQUITETURA.md.
 *
 * Nunca redireciona: o Googlebot rastreia sem Accept-Language e redirecionar
 * esconderia versões. Quando o navegador prefere um dos idiomas disponíveis, o
 * link vira um convite no idioma de destino, dispensável e lembrado no aparelho.
 */
export function LanguageSwitcher({ availableIn, dismissLabel, links }: {
    availableIn: string
    dismissLabel: string
    links: LanguageLink[]
}) {
    const [preferred, setPreferred] = useState<LanguageLink | null>(null)

    useEffect(() => {
        try {
            if (localStorage.getItem(DISMISS_KEY)) return
        } catch {
            // Armazenamento bloqueado: mostra o convite, só não lembra a dispensa.
        }
        const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
        const match = languages
            .map((lang) => lang.toLowerCase().split('-')[0])
            .map((base) => links.find((link) => link.locale === base))
            .find(Boolean)
        if (match) setPreferred(match)
    }, [links])

    if (links.length === 0) return null

    const dismiss = () => {
        setPreferred(null)
        try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* sem armazenamento */ }
    }

    if (preferred) {
        return (
            <div lang={preferred.htmlLang} role="note" className="page-wrap">
                {/* Uma linha só, também no celular: o convite entra depois da hidratação e
                    empurra o hero, então precisa custar o mínimo de altura. */}
                <div className="mt-2 flex items-center gap-3 border border-accent/40 bg-accent/5 px-3 py-1.5 text-[12px] sm:text-[13px]">
                    <span className="min-w-0 truncate text-foreground">{preferred.prompt}</span>
                    <a href={preferred.href} hrefLang={preferred.htmlLang} className="inline-flex shrink-0 items-center gap-1.5 bg-accent px-2.5 py-1 font-bold text-[#0d0b0f] hover:opacity-90">
                        <Globo />{preferred.open} →
                    </a>
                    <button type="button" onClick={dismiss} className="ml-auto shrink-0 font-mono text-[11px] text-muted hover:text-foreground">
                        {dismissLabel}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="page-wrap">
            <nav aria-label={availableIn} className="mt-3 flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 text-[12px]">
                <span className="text-muted">{availableIn}</span>
                {links.map((link) => (
                    <a key={link.locale} href={link.href} hrefLang={link.htmlLang} lang={link.htmlLang}
                        className="inline-flex items-center gap-1.5 border border-accent-a11y/60 bg-accent/5 px-2.5 py-1 font-bold text-accent-a11y transition-colors hover:bg-accent hover:text-[#0d0b0f]">
                        <Globo />{link.name} →
                    </a>
                ))}
            </nav>
        </div>
    )
}
