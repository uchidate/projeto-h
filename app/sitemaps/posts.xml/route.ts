import { buildUrlSet, getSitemapEntries, sitemapResponse } from '@/lib/seo/dynamicSitemap'

// A tag `posts` é invalidada a cada publicação. O fetch mantém uma resposta
// curta em cache e a rota nunca é congelada durante o build.
export const dynamic = 'force-dynamic'

export async function GET() {
    return sitemapResponse(buildUrlSet(await getSitemapEntries('posts')))
}
