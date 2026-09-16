'use client'
/* eslint-disable react-hooks/set-state-in-effect -- idioma do navegador e dispensa só existem no cliente; ler no render quebraria a hidratação */

import { useEffect, useState } from 'react'

export type LanguageLink = {
    locale: string
    htmlLang: string
    href: string
    /** Nome do idioma no próprio idioma ("English", "Português"). */
    name: string
    /** Convite escrito no idioma de destino — quem prefere aquele idioma entende. */
    prompt: string
    open: string
}

const DISMISS_KEY = 'hh-language-notice-dismissed'

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
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border border-accent/40 bg-accent/5 px-4 py-2.5 text-[13px]">
                    <span className="text-foreground">{preferred.prompt}</span>
                    <a href={preferred.href} hrefLang={preferred.htmlLang} className="font-bold text-accent hover:underline">
                        {preferred.open} →
                    </a>
                    <button type="button" onClick={dismiss} className="ml-auto font-mono text-[11px] text-muted hover:text-foreground">
                        {dismissLabel}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="page-wrap">
            <p className="mt-3 text-right font-mono text-[11px] text-muted">
                {availableIn}{' '}
                {links.map((link, index) => (
                    <span key={link.locale}>
                        {index > 0 && ' · '}
                        <a href={link.href} hrefLang={link.htmlLang} lang={link.htmlLang} className="font-semibold text-foreground hover:text-accent">
                            {link.name}
                        </a>
                    </span>
                ))}
            </p>
        </div>
    )
}
