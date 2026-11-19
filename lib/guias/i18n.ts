import { ACTIVE_LOCALES, SOURCE_LOCALE, type Locale } from '@/lib/i18n/config'
import { SITE_URL } from '@/lib/constants/site'
import { href } from '@/lib/i18n/routes'
import { hreflangDe } from '@/lib/i18n/alternates'
import { getAllHubs } from './index'
import type { ArchiveHub, TraducaoWPDoGuia } from './types'

/**
 * Guias em outros idiomas. Tudo vem da tradução publicada no WordPress (`_oc_i18n` do CPT guia, em `hub.traducoes`):
 * o texto e o slug da URL no idioma (`fields.slug`). O filtro (gênero, plataforma, tipo…) é sempre o do guia original.
 *
 * - Guia sem tradução com slug não existe no idioma.
 * - Tradução desatualizada (`stale`): a URL continua valendo, mas a página mostra o texto em português, fora do índice,
 *   e o guia sai de sitemap, hreflang e listagens do idioma (como as fichas).
 */
export type GuiaNoIdioma = ArchiveHub & { desatualizado?: boolean }

const textoOk = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''
const outrosIdiomas = (): Locale[] => ACTIVE_LOCALES.filter((l) => l !== SOURCE_LOCALE)
const SLUG_DO_HREF = /^\/guias\/([a-z0-9-]+)\/?$/

export type MapaDeGuias = ReturnType<typeof montarMapaDeGuias>

/** Índice dos guias por idioma, a partir dos guias já mesclados com o WordPress (getAllHubs). */
export function montarMapaDeGuias(hubs: ArchiveHub[]) {
    const porSlug = new Map(hubs.map((h) => [h.slug, h]))
    const tr = (slugPt: string, locale: Locale): TraducaoWPDoGuia | undefined => {
        const t = porSlug.get(slugPt)?.traducoes?.[locale]
        return t && textoOk(t.slug) ? t : undefined
    }
    const emDia = (slugPt: string, locale: Locale) => {
        const t = tr(slugPt, locale)
        return !!t && !t.stale && textoOk(t.title) && textoOk(t.excerpt) && (t.acf?.intro ?? []).some(textoOk)
    }

    /** Slug do guia na URL do idioma (em português, o próprio). Sem tradução, `undefined`. */
    function slugPublico(slugPt: string, locale: Locale): string | undefined {
        if (locale === SOURCE_LOCALE) return porSlug.has(slugPt) ? slugPt : undefined
        return tr(slugPt, locale)?.slug
    }

    /** Slug em português do guia cuja URL no idioma é `slugDoIdioma`. */
    function slugPt(slugDoIdioma: string, locale: Locale): string | undefined {
        if (locale === SOURCE_LOCALE) return porSlug.has(slugDoIdioma) ? slugDoIdioma : undefined
        return hubs.find((h) => tr(h.slug, locale)?.slug === slugDoIdioma)?.slug
    }

    /** Slugs (em português) dos guias com tradução em dia no idioma: os que entram em listagens, sitemap e hreflang. */
    function traduzidos(locale: Locale): string[] {
        return hubs.filter((h) => emDia(h.slug, locale)).map((h) => h.slug)
    }

    /** hreflang do guia: o português e cada idioma com a tradução em dia, recíprocos. Sem nenhum, `undefined`. */
    function alternativas(slug: string): Record<string, string> | undefined {
        const idiomas = outrosIdiomas().filter((l) => emDia(slug, l))
        if (!idiomas.length) return undefined
        return hreflangDe([SOURCE_LOCALE, ...idiomas], (l) => l === SOURCE_LOCALE ? `${SITE_URL}/guias/${slug}` : `${SITE_URL}${href('guide', { slug: slugPublico(slug, l)! }, l)}`)
    }

    /** hreflang do índice de guias: idiomas com ao menos um guia em dia. */
    function alternativasDoIndice(): Record<string, string> | undefined {
        const idiomas = outrosIdiomas().filter((l) => traduzidos(l).length > 0)
        if (!idiomas.length) return undefined
        return hreflangDe([SOURCE_LOCALE, ...idiomas], (l) => l === SOURCE_LOCALE ? `${SITE_URL}/guias` : `${SITE_URL}${href('guides', undefined, l)}`)
    }

    /**
     * O guia com o texto do idioma, ou `null` se ele não existe no idioma. Desatualizado: o texto em português com
     * `desatualizado: true`. As buscas relacionadas são as do português, só para guias em dia no idioma, com o título
     * curto traduzido do destino. Palavras-chave ficam vazias (as do original são em português).
     */
    function localizar(hub: ArchiveHub, locale: Locale): GuiaNoIdioma | null {
        if (locale === SOURCE_LOCALE) return hub
        const t = tr(hub.slug, locale)
        if (!t) return null
        const base = { ...hub, keywords: [], seoTitle: undefined, seoDescription: undefined, traducoes: undefined }
        if (!emDia(hub.slug, locale)) return { ...base, relatedSearches: undefined, desatualizado: true }
        const acf = t.acf ?? {}
        const relacionados = (hub.relatedSearches ?? []).flatMap((r) => {
            const destino = SLUG_DO_HREF.exec(r.href)?.[1]
            const alvo = destino && emDia(destino, locale) ? porSlug.get(destino)?.traducoes?.[locale] : undefined
            return alvo ? [{ label: textoOk(alvo.acf?.short_title) ? alvo.acf.short_title : alvo.title!, href: href('guide', { slug: alvo.slug! }, locale) }] : []
        })
        return {
            ...base,
            title: t.title!,
            shortTitle: textoOk(acf.short_title) ? acf.short_title : t.title!,
            description: t.excerpt!,
            intro: (acf.intro ?? []).filter(textoOk),
            whatYouWillFind: textoOk(acf.what_you_will_find) ? acf.what_you_will_find : undefined,
            faq: (acf.faq ?? []).filter((f): f is { question: string; answer: string } => textoOk(f?.question) && textoOk(f?.answer)),
            relatedSearches: relacionados.length ? relacionados : undefined,
            ...(textoOk(t.seo_title) && { seoTitle: t.seo_title }),
            ...(textoOk(t.seo_description) && { seoDescription: t.seo_description }),
        }
    }

    return { hubs, slugPublico, slugPt, traduzidos, alternativas, alternativasDoIndice, localizar }
}

/** O mapa dos guias com as traduções do WordPress (a busca do WordPress é deduplicada e cacheada pelo fetch). */
export async function getMapaDeGuias(): Promise<MapaDeGuias> {
    return montarMapaDeGuias(await getAllHubs())
}
