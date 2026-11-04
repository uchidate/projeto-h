import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE, isActiveLocale, type Locale } from './config'
import { setPageLocale } from './request-locale'

/**
 * Porta de entrada de toda página de `app/[locale]`: valida o idioma da URL e o fixa para a renderização.
 *
 * Substitui o par de linhas que cada página repetia (`if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE)
 * notFound()` + `setPageLocale(locale)`), com uma diferença deliberada: o português é recusado por padrão.
 * Durante a migração para a árvore única, uma página só aceita `pt` se declarar `servePt: true`, o que quer
 * dizer que ela já foi migrada e o rewrite de `next.config.mjs` a serve sem prefixo. Página esquecida não
 * vaza como `/pt/...`. Quando a migração acabar, o padrão passa a aceitar todo idioma ativo.
 */
type Opcoes = {
    /** A página já serve o idioma padrão (português) por rewrite. */
    servePt?: boolean
}

/** Idioma válido para esta página, ou `false` (idioma desligado, inexistente ou português em página não migrada). */
export function idiomaValido(locale: string, { servePt = false }: Opcoes = {}): locale is Locale {
    return isActiveLocale(locale) && (servePt || locale !== DEFAULT_LOCALE)
}

/** Para o corpo da página: 404 se o idioma não vale; senão fixa o idioma da renderização e estreita o tipo. */
export function entrarNaPagina(locale: string, opcoes: Opcoes = {}): asserts locale is Locale {
    if (!idiomaValido(locale, opcoes)) notFound()
    setPageLocale(locale)
}
