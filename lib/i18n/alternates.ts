import { SITE_URL } from '@/lib/constants/site'
import { DEFAULT_LOCALE, LOCALE_META, type Locale } from './config'
import { href, type RouteName } from './routes'

type HrefArgs<R extends RouteName> = Parameters<typeof href<R>>[1]

/**
 * `alternates` do Next para uma rota — D7 em docs/I18N-ARQUITETURA.md.
 *
 * Canonical sempre auto-referente. hreflang só quando há mais de uma versão
 * real (`locales` vem de `availableLocales`), com `x-default` no português.
 * Como toda versão recebe a mesma lista, as referências são recíprocas.
 */
export function buildAlternates<R extends RouteName>(
    route: R,
    params: HrefArgs<R>,
    locale: Locale,
    locales: readonly Locale[],
): { canonical: string; languages?: Record<string, string> } {
    const url = (target: Locale) =>
        `${SITE_URL}${(href as (r: RouteName, p: unknown, l: Locale) => string)(route, params, target)}`
    const canonical = url(locale)
    if (locales.length < 2) return { canonical }

    const languages: Record<string, string> = {}
    for (const target of locales) languages[LOCALE_META[target].htmlLang] = url(target)
    if (locales.includes(DEFAULT_LOCALE)) languages['x-default'] = url(DEFAULT_LOCALE)
    return { canonical, languages }
}
