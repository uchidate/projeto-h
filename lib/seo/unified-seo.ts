import { WP_API_NAMESPACE } from '@/lib/constants/identidade.mjs'
import type { Metadata } from 'next'
import { WP_API_URL } from '@/lib/wordpress/config'

export type PageType = 'production' | 'artist' | 'group' | 'post'

export interface UnifiedSEOData {
    type: string
    slug: string
    metaTags?: {
        title: string
        description: string
        image: string
        ogType: string
        canonical: string
    }
    breadcrumb?: unknown
    faqs?: unknown
    organizationSchema?: unknown
    hreflangs?: Record<string, string>
}

/**
 * Fetch unified SEO data from WordPress
 * Single call returns all SEO data: meta tags, breadcrumb, FAQs, schemas
 */
export async function fetchPageSEO(type: PageType, slug: string, pathname: string): Promise<UnifiedSEOData | null> {
    try {
        const url = new URL(`${WP_API_URL}/${WP_API_NAMESPACE}/page-seo`)
        url.searchParams.set('type', type)
        url.searchParams.set('slug', slug)
        url.searchParams.set('pathname', pathname)

        const res = await fetch(url.toString(), {
            next: { revalidate: 86400, tags: [`seo-${type}-${slug}`] },
        })

        if (!res.ok) return null

        return await res.json()
    } catch (error) {
        console.error(`[fetchPageSEO] Failed for ${type}/${slug}:`, error)
        return null
    }
}

/**
 * Convert unified SEO data to Next.js Metadata format
 * Use in generateMetadata({ params })
 */
export function seoToMetadata(seo: UnifiedSEOData | null, fallback?: Metadata): Metadata {
    if (!seo?.metaTags) {
        return fallback || {}
    }

    const meta = seo.metaTags

    return {
        title: meta.title,
        description: meta.description,
        openGraph: {
            title: meta.title,
            description: meta.description,
            images: [meta.image],
            type: meta.ogType === 'article' ? 'article' : 'website',
            url: meta.canonical,
        },
        twitter: {
            card: 'summary_large_image',
            images: [meta.image],
        },
        alternates: {
            canonical: meta.canonical,
            languages: seo.hreflangs,
        },
    }
}

/**
 * Example usage in page.tsx:
 *
 * export async function generateMetadata({ params }): Promise<Metadata> {
 *   const seo = await fetchPageSEO('production', params.slug, '/productions/' + params.slug)
 *   return seoToMetadata(seo, fallbackMetadata)
 * }
 */
