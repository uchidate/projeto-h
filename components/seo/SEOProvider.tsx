'use client'
import { WP_API_NAMESPACE } from '@/lib/constants/identidade.mjs'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { serializeJsonLd } from '@/lib/seo/serialize'
import { WORDPRESS_API_FALLBACK } from '@/lib/constants/site'

interface PageSEO {
    type?: string
    slug?: string
    metaTags?: unknown
    breadcrumb?: unknown
    faqs?: unknown
    organizationSchema?: unknown
    hreflangs?: Record<string, string>
}

/**
 * SEOProvider - Central SEO management
 * Automatically injects: breadcrumb, FAQs, meta tags, organization schema
 *
 * Usage: Place in root layout, once automatically handles all pages
 * <SEOProvider />
 */
export function SEOProvider() {
    const pathname = usePathname()
    const [seoData, setSeoData] = useState<PageSEO | null>(null)

    useEffect(() => {
        // Extract type and slug from pathname
        // /productions/the-heirs -> { type: 'production', slug: 'the-heirs' }
        const parts = pathname.split('/').filter(Boolean)

        if (parts.length < 2) {
            // Home or list pages without detail
            return
        }

        const type = parts[0].replace(/s$/, '') // productions -> production, artists -> artist
        const slug = parts[1]

        // Fetch all SEO data from WordPress
        const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || WORDPRESS_API_FALLBACK
        const url = new URL(`${wpUrl}/${WP_API_NAMESPACE}/page-seo`)
        url.searchParams.set('type', type)
        url.searchParams.set('slug', slug)
        url.searchParams.set('pathname', pathname)

        fetch(url.toString())
            .then(r => r.json())
            .then(setSeoData)
            .catch(err => console.error('[SEOProvider]', err))
    }, [pathname])

    if (!seoData) {
        return null
    }

    return (
        <>
            {/* Breadcrumb Schema */}
            {seoData.breadcrumb && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: serializeJsonLd(seoData.breadcrumb) }}
                />
            )}

            {/* FAQ Schema */}
            {seoData.faqs && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: serializeJsonLd(seoData.faqs) }}
                />
            )}

            {/* Organization Schema */}
            {seoData.organizationSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: serializeJsonLd(seoData.organizationSchema) }}
                />
            )}
        </>
    )
}
