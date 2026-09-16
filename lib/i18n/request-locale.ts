import { cache } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { DEFAULT_LOCALE, type Locale } from './config'

/**
 * Idioma da renderização atual, sem ler headers.
 *
 * O next-intl, quando ninguém define o idioma, cai em `headers()` — e isso
 * torna dinâmica toda rota que usa `useTranslations`. Medido no build de
 * 2026-09-13: as ~40 rotas de `(site)` deixaram de ser pré-renderizadas. Aqui o
 * padrão é o português (as rotas de `(site)` não precisam fazer nada) e as
 * rotas de `(intl)/[locale]` gravam o idioma em cada layout e page, que o Next
 * pode renderizar em escopos separados.
 */
const store = cache(() => ({ locale: DEFAULT_LOCALE as Locale }))

export function setPageLocale(locale: Locale) {
    store().locale = locale
    setRequestLocale(locale)
}

export function getPageLocale(): Locale {
    return store().locale
}
