/**
 * Idiomas do site — ver docs/I18N-ARQUITETURA.md.
 *
 * `LOCALES` lista todo idioma que o código conhece; `ACTIVE_LOCALES` é o que o
 * público vê. Inglês ativo desde 2026-09-15 (Fase 4, piloto): ficha em `/en`
 * só existe com tradução `published` (sophia-katseye e katseye no piloto);
 * as demais continuam 404 em inglês.
 */
export const LOCALES = ['pt', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'pt'

export const ACTIVE_LOCALES: readonly Locale[] = ['pt', 'en']

interface LocaleMeta {
    /** Valor de `<html lang>`, hreflang e `inLanguage` do JSON-LD. */
    htmlLang: string
    /** Open Graph exige idioma_REGIÃO. */
    ogLocale: string
    /** Locale passado às APIs `Intl`. */
    intl: string
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
    pt: { htmlLang: 'pt-BR', ogLocale: 'pt_BR', intl: 'pt-BR' },
    en: { htmlLang: 'en', ogLocale: 'en_US', intl: 'en' },
}

export function isLocale(value: string): value is Locale {
    return (LOCALES as readonly string[]).includes(value)
}

export function isActiveLocale(value: string): value is Locale {
    return isLocale(value) && ACTIVE_LOCALES.includes(value)
}

/** Separa o prefixo de idioma do caminho. PT não tem prefixo. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
    const match = pathname.match(/^\/([a-z]{2})(?=\/|$)(.*)$/)
    if (match && match[1] !== DEFAULT_LOCALE && isLocale(match[1])) {
        return { locale: match[1], path: match[2] || '/' }
    }
    return { locale: DEFAULT_LOCALE, path: pathname }
}
