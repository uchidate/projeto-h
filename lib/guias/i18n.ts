import { ACTIVE_LOCALES, SOURCE_LOCALE, type Locale } from '@/lib/i18n/config'
import { SITE_URL } from '@/lib/constants/site'
import { href } from '@/lib/i18n/routes'
import { hreflangDe } from '@/lib/i18n/alternates'
import en from './traducoes/en.json'
import es from './traducoes/es.json'
import ja from './traducoes/ja.json'
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

const TRADUCOES: Partial<Record<Locale, Record<string, TraducaoDoGuia>>> = { en: en as Record<string, TraducaoDoGuia>, es: es as Record<string, TraducaoDoGuia>, ja: ja as Record<string, TraducaoDoGuia> }

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

const textoOk = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''

/**
 * O guia com o texto no idioma, ou `null` se o guia não existe no idioma (sem entrada em traducoes/<idioma>.json,
 * que guarda o slug do idioma). A tradução publicada no WordPress (`hub.traducoes`, vinda de getHub/getAllHubs) vale
 * por cima do JSON, campo a campo, se não estiver `stale`. Palavras-chave ficam vazias (as do original são em português).
 */
export function localizarGuia(hub: ArchiveHub, locale: Locale): ArchiveHub | null {
    const tr = traducoesDoIdioma(locale)[hub.slug]
    if (!tr) return null
    const base: ArchiveHub = { ...hub, title: tr.title, shortTitle: tr.shortTitle, description: tr.description, intro: tr.intro, whatYouWillFind: tr.whatYouWillFind, faq: tr.faq, keywords: [], relatedSearches: undefined, seoTitle: undefined, seoDescription: undefined, traducoes: undefined }
    const wp = hub.traducoes?.[locale]
    if (!wp || wp.stale) return base
    const acf = wp.acf ?? {}
    const intro = Array.isArray(acf.intro) ? acf.intro.filter(textoOk) : []
    const faq = Array.isArray(acf.faq) ? acf.faq.filter((f) => textoOk(f?.question) && textoOk(f?.answer)) as ArchiveHub['faq'] : []
    return {
        ...base,
        ...(textoOk(wp.title) && { title: wp.title }),
        ...(textoOk(wp.excerpt) && { description: wp.excerpt }),
        ...(textoOk(acf.short_title) && { shortTitle: acf.short_title }),
        ...(intro.length && { intro }),
        ...(textoOk(acf.what_you_will_find) && { whatYouWillFind: acf.what_you_will_find }),
        ...(faq.length && { faq }),
        ...(textoOk(wp.seo_title) && { seoTitle: wp.seo_title }),
        ...(textoOk(wp.seo_description) && { seoDescription: wp.seo_description }),
    }
}

const outrosIdiomas = (): Locale[] => ACTIVE_LOCALES.filter(l => l !== SOURCE_LOCALE)

/**
 * hreflang do guia: o idioma-fonte e todo idioma ativo com o texto traduzido, recíprocos entre si
 * (o seletor de idioma do cabeçalho lê estas tags). Sem tradução em nenhum idioma, `undefined`.
 */
export function alternativasDoGuia(slugPt: string): Record<string, string> | undefined {
    const traduzidos = outrosIdiomas().filter(l => slugPublicoDoGuia(slugPt, l))
    if (!traduzidos.length) return undefined
    return hreflangDe([SOURCE_LOCALE, ...traduzidos], l => l === SOURCE_LOCALE ? `${SITE_URL}/guias/${slugPt}` : `${SITE_URL}${href('guide', { slug: slugPublicoDoGuia(slugPt, l)! }, l)}`)
}

/** hreflang do índice de guias: idiomas ativos com ao menos um guia traduzido. */
export function alternativasDoIndice(): Record<string, string> | undefined {
    const traduzidos = outrosIdiomas().filter(l => slugsPtTraduzidos(l).length > 0)
    if (!traduzidos.length) return undefined
    return hreflangDe([SOURCE_LOCALE, ...traduzidos], l => l === SOURCE_LOCALE ? `${SITE_URL}/guias` : `${SITE_URL}${href('guides', undefined, l)}`)
}
