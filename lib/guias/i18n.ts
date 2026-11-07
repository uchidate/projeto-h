import { SOURCE_LOCALE, type Locale } from '@/lib/i18n/config'
import en from './traducoes/en.json'
import type { ArchiveHub } from './types'

/**
 * Guias traduzidos. O texto de cada guia vive em `traducoes/<idioma>.json`, indexado pelo slug em português;
 * o filtro (gênero, plataforma, tipo…) continua sendo o do guia original. Guia sem entrada aqui não existe no idioma.
 */
export type TraducaoDoGuia = {
    /** Slug do guia na URL do idioma. */
    slug: string
    title: string
    shortTitle: string
    description: string
    intro: string[]
    whatYouWillFind?: string
    faq: Array<{ question: string; answer: string }>
    /** `to` é o slug (em português) de outro guia; só aparece se esse guia também estiver traduzido. */
    relatedSearches?: Array<{ label: string; to: string }>
}

const TRADUCOES: Partial<Record<Locale, Record<string, TraducaoDoGuia>>> = { en: en as Record<string, TraducaoDoGuia> }

export function traducoesDoIdioma(locale: Locale): Record<string, TraducaoDoGuia> {
    return locale === SOURCE_LOCALE ? {} : TRADUCOES[locale] ?? {}
}

/** Slugs (em português) dos guias traduzidos no idioma. */
export function slugsPtTraduzidos(locale: Locale): string[] {
    return Object.keys(traducoesDoIdioma(locale))
}

/** Slug do guia na URL do idioma; em português, o próprio. Sem tradução, `undefined`. */
export function slugPublicoDoGuia(slugPt: string, locale: Locale): string | undefined {
    if (locale === SOURCE_LOCALE) return slugPt
    return traducoesDoIdioma(locale)[slugPt]?.slug
}

/** Slug em português do guia cuja URL no idioma é `slugPublico`. */
export function slugPtDoGuia(slugPublico: string, locale: Locale): string | undefined {
    if (locale === SOURCE_LOCALE) return slugPublico
    return Object.entries(traducoesDoIdioma(locale)).find(([, t]) => t.slug === slugPublico)?.[0]
}

/** O guia com o texto no idioma, ou `null` se não há tradução. Palavras-chave ficam vazias (as do original são em português). */
export function localizarGuia(hub: ArchiveHub, locale: Locale): ArchiveHub | null {
    const tr = traducoesDoIdioma(locale)[hub.slug]
    if (!tr) return null
    return { ...hub, title: tr.title, shortTitle: tr.shortTitle, description: tr.description, intro: tr.intro, whatYouWillFind: tr.whatYouWillFind, faq: tr.faq, keywords: [], relatedSearches: undefined }
}
