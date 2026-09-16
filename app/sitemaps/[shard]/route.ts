import { notFound } from 'next/navigation'
import {
    buildUrlSet,
    getLocalizedSitemapEntries,
    getSitemapEntries,
    resolveLocalizedShard,
    resolveSitemapShard,
    sitemapResponse,
} from '@/lib/seo/dynamicSitemap'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ shard: string }> }) {
    const { shard: filename } = await context.params
    if (!filename.endsWith('.xml')) notFound()
    const name = filename.slice(0, -4)
    const localized = resolveLocalizedShard(name)
    if (localized) {
        return sitemapResponse(buildUrlSet(await getLocalizedSitemapEntries(localized.shard, localized.locale)))
    }
    const shard = resolveSitemapShard(name)
    if (!shard || shard === 'posts') notFound()

    const entries = await getSitemapEntries(shard)
    return sitemapResponse(buildUrlSet(entries))
}
