import type { WPProduction, WPTerm } from '@/lib/wordpress/types'
import { extractYoutubeId, formatDatePt, getWPTerms, stripHtml } from '@/lib/utils'
import { splitContentForAd } from '@/lib/utils/injectAd'
import { STATUS_LABELS } from '@/lib/productions/labels'
import { labelsFor } from '@/lib/i18n/labels'
import { intlLocale } from '@/lib/i18n/format'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

/**
 * Sinopse de verdade para o resumo da página.
 *
 * O `excerpt` das produções é uma frase padrão ("Conheça tudo sobre X. Sinopse,
 * elenco…") em todas elas: serve de meta description, não de apresentação. A
 * sinopse real está nos primeiros parágrafos do conteúdo, depois de uma linha de
 * ficha ("X (2020) é uma série sul-coreana de 16 episódios…") e antes da lista de
 * elenco. Pega o primeiro parágrafo que não seja nenhum dos dois; sem ele, devolve
 * vazio, e o resumo omite o trecho em vez de mostrar texto genérico.
 */
export function sinopseResumo(contentHtml: string): string {
    const paragrafos = [...contentHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(m => stripHtml(m[1]).replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 4)
    const real = paragrafos.find(p =>
        p.length >= 80
        && !/^(no elenco|elenco|cast|com )/i.test(p)
        && !/^.{0,90}\(\d{4}\)\s+é\s+(uma?|o|a)\s/i.test(p))
    return real ? real.slice(0, 420) : ''
}

export function buildProductionProfileModel(production: WPProduction, locale: Locale = DEFAULT_LOCALE) {
    const labels = labelsFor(locale)
    const acf = production.acf ?? {}
    const title = stripHtml(production.title.rendered)
    const genres = getWPTerms(production._embedded, 'production_genre') as WPTerm[]
    const platforms = getWPTerms(production._embedded, 'production_platform') as WPTerm[]
    const [contentBefore, contentAfter] = splitContentForAd(production.content.rendered, 2)
    const galleryUrls = acf.gallery_urls ?? []
    const facts = acf.curiosidades ?? []

    return {
        title,
        acf,
        genres,
        platforms,
        contentBefore,
        contentAfter,
        synopsis: stripHtml(production.excerpt.rendered),
        sinopseResumo: sinopseResumo(production.content.rendered),
        displayType: acf.type === 'drama' ? labels.productionType('dramaDisplay') : acf.type ? labels.productionType(acf.type) : '',
        schemaType: acf.type === 'movie' ? 'Movie' as const : 'TVSeries' as const,
        galleryUrls,
        backdropUrl: acf.backdrop_url || galleryUrls[0],
        facts,
        castRoles: new Map((production.production_cast ?? []).map(item => [item.slug, item.role])),
        statusInfo: acf.status_production && STATUS_LABELS[acf.status_production]
            ? { ...STATUS_LABELS[acf.status_production], label: labels.productionStatus(acf.status_production) ?? STATUS_LABELS[acf.status_production].label }
            : null,
        hasTrailer: !!(acf.trailer_url && extractYoutubeId(acf.trailer_url)),
        primaryPlatform: platforms[0]?.name,
        releaseLabel: acf.release_date ? formatDatePt(acf.release_date, intlLocale(locale)) : acf.year ? String(acf.year) : null,
    }
}

export type ProductionProfileModel = ReturnType<typeof buildProductionProfileModel>
