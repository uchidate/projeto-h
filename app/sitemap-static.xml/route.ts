import { buildSitemapIndex, sitemapResponse } from '@/lib/seo/dynamicSitemap'

export const dynamic = 'force-dynamic'

export function GET() {
    return sitemapResponse(buildSitemapIndex())
}
