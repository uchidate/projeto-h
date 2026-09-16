import { DEFAULT_LOCALE, LOCALE_META, type Locale } from './config'

/**
 * Formatação dependente de idioma. Substitui os `'pt-BR'` fixos espalhados em
 * `toLocale*String` e `Intl.*` — ver D4 em docs/I18N-ARQUITETURA.md.
 */

/** Locale para `Intl.*`, `toLocale*String` e `localeCompare`. */
export function intlLocale(locale: Locale = DEFAULT_LOCALE): string {
    return LOCALE_META[locale].intl
}

/** Valor de `<html lang>`, `inLanguage` (JSON-LD), manifest e RSS. */
export function htmlLang(locale: Locale = DEFAULT_LOCALE): string {
    return LOCALE_META[locale].htmlLang
}

export function formatDate(
    value: Date | string | number,
    options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
    locale: Locale = DEFAULT_LOCALE,
): string {
    return new Intl.DateTimeFormat(LOCALE_META[locale].intl, options).format(new Date(value))
}

export function formatNumber(
    value: number,
    options?: Intl.NumberFormatOptions,
    locale: Locale = DEFAULT_LOCALE,
): string {
    return new Intl.NumberFormat(LOCALE_META[locale].intl, options).format(value)
}

export function toLowerLocale(value: string, locale: Locale = DEFAULT_LOCALE): string {
    return value.toLocaleLowerCase(LOCALE_META[locale].intl)
}
