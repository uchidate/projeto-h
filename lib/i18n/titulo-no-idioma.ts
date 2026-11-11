import { SOURCE_LOCALE, type Locale } from './config'
import titulos from './titulos.json'

type Tipo = 'production' | 'food'
const TITULOS = titulos as Record<Tipo, Record<string, Partial<Record<string, string>>>>

/**
 * Título de uma obra ou prato no idioma da página.
 *
 * As listas (filmografia, relacionados, vitrines) trazem o título em português, mesmo quando a
 * ficha tem tradução publicada, e uma obra sem ficha no idioma aparecia em português ao lado de
 * texto em japonês. Ordem: título no idioma da página, depois o título em inglês (o que as obras
 * têm quando não há outro idioma), e só então o português.
 *
 * `titulos.json` é gerado dos `_oc_i18n` publicados no WordPress (slug → idioma → título).
 */
export function tituloNoIdioma(tipo: Tipo, slug: string, renderizado: string, locale: Locale): string {
    if (locale === SOURCE_LOCALE) return renderizado
    const porIdioma = TITULOS[tipo]?.[slug]
    return porIdioma?.[locale] ?? porIdioma?.en ?? renderizado
}

/** Mesma regra para uma lista de fichas do WordPress: troca só `title.rendered`, o resto do item fica igual. */
export function comTituloNoIdioma<T extends { slug: string; title: { rendered: string } }>(itens: T[], tipo: Tipo, locale: Locale): T[] {
    if (locale === SOURCE_LOCALE) return itens
    return itens.map(item => {
        const titulo = tituloNoIdioma(tipo, item.slug, item.title.rendered, locale)
        return titulo === item.title.rendered ? item : { ...item, title: { ...item.title, rendered: titulo } }
    })
}
