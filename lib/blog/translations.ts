import { SITE_URL } from '@/lib/constants/site'
import { DEFAULT_LOCALE, LOCALE_META, isActiveLocale, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'

/** Versões do post por idioma ativo, `{ pt: slug, en: slug }` do campo `translations` da REST. Ignora idioma desconhecido e slug vazio. */
export function versoesDoPost(translations: Record<string, string> | undefined | null): Partial<Record<Locale, string>> {
    const out: Partial<Record<Locale, string>> = {}
    for (const [lang, slug] of Object.entries(translations ?? {})) {
        if (isActiveLocale(lang) && typeof slug === 'string' && slug) out[lang] = slug
    }
    return out
}

/**
 * `alternates` de um post (D7): canonical auto-referente e hreflang recíproco só
 * quando há mais de uma versão. Diferente das fichas, o slug muda por idioma,
 * então cada URL é montada com o slug da própria versão.
 */
export function buildPostAlternates(
    translations: Record<string, string> | undefined | null,
    current: Locale,
    currentSlug: string,
): { canonical: string; languages?: Record<string, string> } {
    const versoes = { ...versoesDoPost(translations), [current]: currentSlug }
    const url = (locale: Locale) => `${SITE_URL}${href('post', { slug: versoes[locale]! }, locale)}`
    const canonical = url(current)
    const locales = Object.keys(versoes) as Locale[]
    if (locales.length < 2) return { canonical }
    const languages: Record<string, string> = {}
    for (const locale of locales) languages[LOCALE_META[locale].htmlLang] = url(locale)
    if (versoes[DEFAULT_LOCALE]) languages['x-default'] = url(DEFAULT_LOCALE)
    return { canonical, languages }
}

/**
 * Cartões da listagem em outro idioma: na primeira página os artigos traduzidos vêm antes
 * (senão um artigo antigo traduzido nunca teria link a partir da listagem); em toda página o
 * original de um artigo traduzido sai da lista em português, para não aparecer duas vezes.
 * Contagem e paginação continuam as do português: a primeira página pode passar de `porPagina`.
 */
export function cartoesDaListagem<T extends { slug: string }, U>(
    originais: readonly T[],
    traducoes: ReadonlyMap<string, U>,
    pagina: number,
): Array<{ original: T | null; traduzido: U | null }> {
    const restantes = originais.filter((post) => !traducoes.has(post.slug)).map((original) => ({ original, traduzido: null }))
    if (pagina > 1) return restantes
    return [...[...traducoes.values()].map((traduzido) => ({ original: null, traduzido })), ...restantes]
}
