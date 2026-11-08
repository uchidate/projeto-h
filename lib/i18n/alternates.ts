import { SITE_URL } from '@/lib/constants/site'
import { ACTIVE_LOCALES, DEFAULT_LOCALE, LOCALE_META, type Locale } from './config'
import { href, type RouteName } from './routes'

type HrefArgs<R extends RouteName> = Parameters<typeof href<R>>[1]

/**
 * `alternates` do Next para uma rota — D7 em docs/I18N-ARQUITETURA.md.
 *
 * Canonical sempre auto-referente. hreflang só quando há mais de uma versão
 * real (`locales` vem de `availableLocales`), com `x-default` no português.
 * Como toda versão recebe a mesma lista, as referências são recíprocas.
 */
/**
 * Ponto único que monta o mapa hreflang: um endereço por idioma, na ordem dada, mais
 * `x-default` no idioma padrão quando ele está na lista. Todas as páginas que declaram
 * versões (home, catálogos, blog, guias, fichas) passam por aqui; o que muda de uma para
 * outra é só QUAIS idiomas entram (`idiomasComConteudo`) e o endereço de cada um.
 */
export function hreflangDe(locales: readonly Locale[], urlDe: (locale: Locale) => string): Record<string, string> {
    const languages: Record<string, string> = {}
    for (const locale of locales) languages[LOCALE_META[locale].htmlLang] = urlDe(locale)
    if (locales.includes(DEFAULT_LOCALE)) languages['x-default'] = urlDe(DEFAULT_LOCALE)
    return languages
}

/** Idiomas candidatos que de fato têm conteúdo: a versão vazia é `noindex` e não deve ser apontada. */
export async function idiomasComConteudo(
    candidatos: readonly Locale[],
    temConteudo: (locale: Locale) => boolean | Promise<boolean>,
): Promise<Locale[]> {
    const marcados = await Promise.all(candidatos.map(async (locale) => ((await temConteudo(locale)) ? locale : null)))
    return marcados.filter((locale): locale is Locale => locale !== null)
}

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

    return { canonical, languages: hreflangDe(locales, url) }
}

/**
 * Para página institucional traduzida por inteiro: declara todos os idiomas
 * ativos. Idioma novo entra sozinho aqui, sem lista própria em cada página —
 * lista fixa foi o que deixou o ES de fora do seletor do hub de cultura.
 */
export function buildAlternatesAtivos<R extends RouteName>(
    route: R,
    params: HrefArgs<R>,
    locale: Locale,
) {
    return buildAlternates(route, params, locale, ACTIVE_LOCALES)
}
