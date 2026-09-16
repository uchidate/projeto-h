import { htmlLang } from '@/lib/i18n/format'
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from '@/lib/constants/site'
import { stripHtml, getWPImage } from '@/lib/utils'
import type { WPPost } from '@/lib/wordpress/types'

type FeedOptions = {
    title?: string
    description?: string
    selfUrl: string
}

export function buildPostsRss(posts: WPPost[], options: FeedOptions) {
    const items = posts.map(post => {
        const title = stripHtml(post.title.rendered)
        const excerpt = stripHtml(post.excerpt.rendered).slice(0, 300)
        const image = getWPImage(post._embedded, post.featured_image_url)
        const url = `${SITE_URL}/blog/${post.slug}`
        const pubDate = new Date(post.date).toUTCString()
        const cats: Array<{ name: string }> = (post._embedded?.['wp:term']?.[0] ?? []) as Array<{ name: string }>

        const media = image
            ? `
      <enclosure url="${xmlEsc(image.src)}" type="image/jpeg" length="0" />
      <media:content url="${xmlEsc(image.src)}" medium="image" />
      <media:thumbnail url="${xmlEsc(image.src)}" />`
            : ''

        const categories = cats
            .map(c => `<category>${xmlEsc(c.name)}</category>`)
            .join('')

        return `
    <item>
      <title>${xmlEsc(title)}</title>
      <link>${xmlEsc(url)}</link>
      <guid isPermaLink="true">${xmlEsc(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${xmlEsc(excerpt)}</description>
      ${categories}
      ${media}
    </item>`
    }).join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${xmlEsc(options.title ?? SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${xmlEsc(options.description ?? SITE_DESCRIPTION)}</description>
    <language>${htmlLang()}</language>
    <atom:link href="${xmlEsc(options.selfUrl)}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`
}

export function xmlEsc(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}
