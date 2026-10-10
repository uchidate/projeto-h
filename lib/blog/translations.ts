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
 * Slug público do post: o do original em português, em todos os idiomas, como nas fichas
 * (`/artists/x` e `/en/artists/x`). O post traduzido segue com slug próprio no WordPress
 * (o WP exige slug único), mas esse slug não aparece na URL. Sem original, vale o próprio.
 */
export function slugPublicoDoPost(translations: Record<string, string> | undefined | null, currentSlug: string): string {
    return versoesDoPost(translations)[DEFAULT_LOCALE] ?? currentSlug
}

/**
 * `alternates` de um post (D7): canonical auto-referente e hreflang recíproco só
 * quando há mais de uma versão. Todas as URLs usam o slug público (o do original),
 * então a troca de idioma é só o prefixo `/en`.
 */
export function buildPostAlternates(
    translations: Record<string, string> | undefined | null,
    current: Locale,
    currentSlug: string,
): { canonical: string; languages?: Record<string, string> } {
    const versoes = { ...versoesDoPost(translations), [current]: currentSlug }
    const slug = slugPublicoDoPost(translations, currentSlug)
    const url = (locale: Locale) => `${SITE_URL}${href('post', { slug }, locale)}`
    const canonical = url(current)
    const locales = Object.keys(versoes) as Locale[]
    if (locales.length < 2) return { canonical }
    const languages: Record<string, string> = {}
    for (const locale of locales) languages[LOCALE_META[locale].htmlLang] = url(locale)
    if (versoes[DEFAULT_LOCALE]) languages['x-default'] = url(DEFAULT_LOCALE)
    return { canonical, languages }
}

/**
 * Paginação da listagem em outro idioma com os artigos traduzidos primeiro: eles ocupam o começo da
 * lista combinada e os originais em português (sem os já traduzidos) vêm depois. Devolve, para a
 * página pedida, a fatia dos traduzidos e o trecho de português a buscar (`offset` e `quantidade`).
 * Total e número de páginas saem de `traduzidos + total de português sem os traduzidos`, então a
 * paginação fecha mesmo com várias traduções.
 */
export function fatiaDaListagem(traduzidos: number, pagina: number, porPagina: number) {
    const inicio = (pagina - 1) * porPagina
    const doTraduzidoIni = Math.min(inicio, traduzidos)
    const doTraduzidoFim = Math.min(inicio + porPagina, traduzidos)
    return {
        traduzidos: { inicio: doTraduzidoIni, fim: doTraduzidoFim },
        portugues: { offset: Math.max(0, inicio - traduzidos), quantidade: porPagina - (doTraduzidoFim - doTraduzidoIni) },
    }
}
