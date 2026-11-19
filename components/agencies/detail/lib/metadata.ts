import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getAgencyBySlug } from '@/lib/wordpress/agencies'
import { buildOgImageUrl, SITE_URL } from '@/lib/constants/site'
import { getWPImage, stripHtml } from '@/lib/utils'
import { buildWordPressMetadata } from '@/lib/seo/wordpress'
import { metaDescription } from '@/lib/seo/metaDescription'
import { DEFAULT_LOCALE, LOCALE_META, type Locale } from '@/lib/i18n/config'
import { buildAlternates } from '@/lib/i18n/alternates'
import { availableLocales, localizeEntity, semTraducao } from '@/lib/i18n/entity-translation'
import { href } from '@/lib/i18n/routes'
import { LEGACY_AGENCY_TITLE, sameImageAsset } from './helpers'

export async function metadataDaAgencia(slug: string, locale: Locale = DEFAULT_LOCALE): Promise<Metadata> {
    const found = await getAgencyBySlug(slug)
    if (!found) return {}
    // Sem tradução publicada: a ficha em português, fora do índice e com canonical no original.
    if (semTraducao(found, locale)) {
        return { ...(await metadataDaAgencia(slug, DEFAULT_LOCALE)), robots: { index: false, follow: true } }
    }
    const agency = localizeEntity(found, locale, 'agency')
    const name = stripHtml(agency.title.rendered)
    const desc = metaDescription(stripHtml(agency.excerpt?.rendered ?? ''))
    const url = `${SITE_URL}${href('agency', { slug }, locale)}`
    const logo = getWPImage(agency._embedded, agency.featured_image_url)
    const t = await getTranslations({ locale, namespace: 'entity.agency' })
    // Título e descrição do Rank Math (gravados pelo ficha-gravar), como no grupo; sem eles, o modelo.
    const rankTitle = agency.meta?.rank_math_title?.trim() || undefined
    const rankDesc = agency.meta?.rank_math_description?.trim() || undefined
    const fallbackTitle = rankTitle ?? t('metaTitle', { name })
    const description = rankDesc || desc || t('metaDescription', { name })
    const seoImageIsLogo = sameImageAsset(agency.yoast_head_json?.og_image?.[0]?.url, logo?.src)
    // O SEO do Yoast é do português; em outro idioma vale o título/descrição traduzidos.
    const seo = locale === DEFAULT_LOCALE && agency.yoast_head_json
        ?
 {
            ...agency.yoast_head_json,
            title: rankTitle ?? (agency.yoast_head_json.title?.replace(LEGACY_AGENCY_TITLE, '') === name
                ? fallbackTitle
                : agency.yoast_head_json.title),
            og_title: rankTitle ?? (agency.yoast_head_json.og_title?.replace(LEGACY_AGENCY_TITLE, '') === name
                ? fallbackTitle
                : agency.yoast_head_json.og_title),
            ...(rankDesc ? { description: rankDesc, og_description: rankDesc } : {}),
            // Um logo quadrado não deve bloquear a composição social 1200×630.
            og_image: seoImageIsLogo ? undefined : agency.yoast_head_json.og_image,
        }
        : undefined
    const ogImage = buildOgImageUrl({
        title: fallbackTitle,
        subtitle: description,
        image: logo?.src,
        type: 'agency',
    })

    return buildWordPressMetadata({
        title: fallbackTitle,
        description,
        url,
        image: logo ? { src: logo.src, alt: `${name} — logo` } : undefined,
        ogImageOverride: ogImage,
        seo,
        languages: buildAlternates('agency', { slug }, locale, availableLocales(found)).languages,
        ogLocale: LOCALE_META[locale].ogLocale,
    })
}
