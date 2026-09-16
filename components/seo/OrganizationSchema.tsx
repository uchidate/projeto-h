import { WP_API_NAMESPACE } from '@/lib/constants/identidade.mjs'
import { WP_API_URL, IS_BUILD } from '@/lib/wordpress/config'
import { serializeJsonLd } from '@/lib/seo/serialize'

export async function OrganizationSchema() {
    if (IS_BUILD) return null
    let schema: unknown

    try {
        const res = await fetch(`${WP_API_URL}/${WP_API_NAMESPACE}/organization-schema`, {
            headers: { Accept: 'application/json' },
            next: { revalidate: 86400, tags: ['organization-schema'] },
        })

        if (!res.ok) return null

        schema = await res.json()
    } catch (error) {
        console.error('[OrganizationSchema] Failed to fetch:', error)
        return null
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
    )
}
