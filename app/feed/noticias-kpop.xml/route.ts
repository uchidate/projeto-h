import { SITE_NAME } from '@/lib/constants/site'
import { getPosts } from '@/lib/wordpress/posts'
import { SITE_URL } from '@/lib/constants/site'
import { buildPostsRss } from '@/lib/rss'

export const revalidate = 900
export const dynamic = 'force-dynamic'

export async function GET() {
    const { items: posts } = await getPosts({
        categoryId: 10,
        perPage: 50,
        orderby: 'date',
        order: 'desc',
    })

    const xml = buildPostsRss(posts, {
        title: `${SITE_NAME} — Notícias K-pop`,
        description: `Notícias de K-pop publicadas pelo ${SITE_NAME}.`,
        selfUrl: `${SITE_URL}/feed/noticias-kpop.xml`,
    })

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
        },
    })
}
