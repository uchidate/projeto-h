import type { Metadata } from 'next'
import { getAgencyBySlug } from '@/lib/wordpress/agencies'
import { buildOgImageUrl, SITE_URL } from '@/lib/constants/site'
import { getWPImage, stripHtml } from '@/lib/utils'
import { buildWordPressMetadata } from '@/lib/seo/wordpress'
import { metaDescription } from '@/lib/seo/metaDescription'
import { LEGACY_AGENCY_TITLE, sameImageAsset } from './helpers'

export async function metadataDaAgencia(slug: string): Promise<Metadata> {
    const agency = await getAgencyBySlug(slug)
    if (!agency) return {}
    const name = stripHtml(agency.title.rendered)
    const desc = metaDescription(stripHtml(agency.excerpt?.rendered ?? ''))
    const url = `${SITE_URL}/agencies/${slug}`
    const logo = getWPImage(agency._embedded, agency.featured_image_url)
    const fallbackTitle = `${name}: artistas, grupos e história`
    const seoImageIsLogo = sameImageAsset(agency.yoast_head_json?.og_image?.[0]?.url, logo?.src)
    const seo = agency.yoast_head_json
        ? {
            ...agency.yoast_head_json,
            title: agency.yoast_head_json.title?.replace(LEGACY_AGENCY_TITLE, '') === name
                ? fallbackTitle
                : agency.yoast_head_json.title,
            og_title: agency.yoast_head_json.og_title?.replace(LEGACY_AGENCY_TITLE, '') === name
                ? fallbackTitle
                : agency.yoast_head_json.og_title,
            // Um logo quadrado não deve bloquear a composição social 1200×630.
            og_image: seoImageIsLogo ? undefined : agency.yoast_head_json.og_image,
        }
        : undefined
    const ogImage = buildOgImageUrl({
        title: fallbackTitle,
        subtitle: desc || `História, grupos e artistas relacionados à ${name}.`,
        image: logo?.src,
        type: 'agency',
    })

    return buildWordPressMetadata({
        title: fallbackTitle,
        description: desc || `Conheça a ${name}, sua história, seus grupos, artistas e sua atuação na indústria do entretenimento coreano.`,
        url,
        image: logo ? { src: logo.src, alt: `${name} — logo` } : undefined,
        ogImageOverride: ogImage,
        seo,
    })
}
