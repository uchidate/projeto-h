import type { WPProduction, WPTerm } from '@/lib/wordpress/types'
import { extractYoutubeId, formatDatePt, getWPTerms, stripHtml } from '@/lib/utils'
import { splitContentForAd } from '@/lib/utils/injectAd'
import { STATUS_LABELS } from '@/lib/productions/labels'
import { labelsFor } from '@/lib/i18n/labels'
import { intlLocale } from '@/lib/i18n/format'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

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
