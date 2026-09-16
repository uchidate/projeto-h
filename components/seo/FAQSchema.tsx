'use client'
import { WP_API_NAMESPACE } from '@/lib/constants/identidade.mjs'

import { useEffect, useState } from 'react'
import { serializeJsonLd } from '@/lib/seo/serialize'
import { WORDPRESS_API_FALLBACK } from '@/lib/constants/site'

interface FAQSchemaProps {
    group?: string // 'productions', 'artists', 'k-drama', etc
}

export function FAQSchema({ group = 'general' }: FAQSchemaProps) {
    const [schema, setSchema] = useState<{ mainEntity?: unknown[] } | null>(null)

    useEffect(() => {
        fetch(
            `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL || WORDPRESS_API_FALLBACK}/${WP_API_NAMESPACE}/faq-schema?group=${group}`
        )
            .then(r => r.json())
            .then(setSchema)
            .catch(err => console.error('[FAQ]', err))
    }, [group])

    if (!schema || !schema.mainEntity?.length) return null

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
    )
}
