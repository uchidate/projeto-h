import type { Metadata } from 'next'
import type { WPYoast } from '@/lib/wordpress/types'
import { baseOG, baseTwitter } from '@/lib/constants/site'
import { titleAlreadyIncludesSiteName } from '@/lib/seo/titles'

type WordPressMetadataInput = {
    title: string
    description: string
    url: string
    image?: { src: string; alt: string } | null
    seo?: WPYoast
    article?: {
        publishedTime: string
        modifiedTime: string
    }
    ogImageOverride?: string
    /** hreflang (ver lib/i18n/alternates.ts); omitido quando há uma só versão. */
    languages?: Record<string, string>
    /** `og:locale`; o padrão do site vale quando ausente. */
    ogLocale?: string
}

/** Combina SEO editorial do WordPress com fallbacks consistentes do frontend. */
export function buildWordPressMetadata({
    title,
    description,
    url,
    image,
    seo,
    article,
    ogImageOverride,
    languages,
    ogLocale,
}: WordPressMetadataInput): Metadata {
    const resolvedTitle = seo?.title || title
    const resolvedDescription = seo?.description || description
    const canonical = seo?.canonical || url
    const seoImage = seo?.og_image?.[0]
    const resolvedImage = seoImage
        ? { url: seoImage.url, width: seoImage.width, height: seoImage.height }
        : ogImageOverride
            ? { url: ogImageOverride, width: 1200, height: 630 }
            : image
                ? { url: image.src, alt: image.alt || resolvedTitle }
                : undefined

    const robots = seo?.robots
        ? Object.entries(seo.robots).map(([k, v]) => (v ? k : null)).filter(Boolean)
        : undefined

    return {
        // Títulos completos do plugin SEO/Rank Math já podem incluir a marca;
        // quando isso acontece, não devem receber o template global de novo.
        // (bug corrigido em 2026-07-06: sem os parênteses, qualquer seo?.title
        // truthy pulava o template `%s | site` do layout, mesmo quando
        // o título editorial não incluía a marca — a maioria das páginas com
        // título customizado no Rank Math ficava sem o nome do site no <title>.)
        title: titleAlreadyIncludesSiteName(resolvedTitle)
            ? { absolute: resolvedTitle }
            : resolvedTitle,
        description: resolvedDescription,
        alternates: { canonical, ...(languages ? { languages } : {}) },
        ...(robots?.length ? { robots: { index: !robots.includes('noindex'), follow: !robots.includes('nofollow') } } : {}),
        openGraph: {
            ...baseOG(canonical),
            ...(ogLocale ? { locale: ogLocale } : {}),
            title: seo?.og_title || resolvedTitle,
            description: seo?.og_description || resolvedDescription,
            ...(article
                ? {
                    type: 'article' as const,
                    publishedTime: article.publishedTime,
                    modifiedTime: article.modifiedTime,
                }
                : {}),
            ...(resolvedImage ? { images: [resolvedImage] } : {}),
        },
        twitter: {
            ...baseTwitter(),
            title: seo?.og_title || resolvedTitle,
            description: seo?.og_description || resolvedDescription,
            ...(resolvedImage ? { images: [resolvedImage.url] } : {}),
        },
    }
}
