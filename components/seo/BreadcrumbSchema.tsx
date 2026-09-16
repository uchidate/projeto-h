'use client'
import { WP_API_NAMESPACE } from '@/lib/constants/identidade.mjs'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { serializeJsonLd } from '@/lib/seo/serialize'
import { WORDPRESS_API_FALLBACK } from '@/lib/constants/site'

export function BreadcrumbSchema() {
    const pathname = usePathname()
    const [schema, setSchema] = useState(null)

    useEffect(() => {
        fetch(
            `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL || WORDPRESS_API_FALLBACK}/${WP_API_NAMESPACE}/breadcrumb-schema?path=${pathname}`
        )
            .then(r => r.json())
            .then(setSchema)
            .catch(err => console.error('[Breadcrumb]', err))
    }, [pathname])

    if (!schema) return null

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
    )
}
