import { getPosts } from '@/lib/wordpress/posts'
import { SITE_URL } from '@/lib/constants/site'
import { buildPostsRss } from '@/lib/rss'

export const revalidate = 3600
export const dynamic = 'force-dynamic'

export async function GET() {
    const { items: posts } = await getPosts({ perPage: 30, orderby: 'date', order: 'desc' })

    const xml = buildPostsRss(posts, { selfUrl: `${SITE_URL}/feed.xml` })

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    })
}
