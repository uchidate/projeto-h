import { wpFetch, buildParams } from '@/lib/wordpress/client'
import { WP_CACHE_TAGS } from '@/lib/wordpress/cache'
import { SITE_URL, SITE_NAME } from '@/lib/constants/site'

// Google News só considera artigos das últimas 48h; este sitemap precisa
// refletir uma publicação em minutos, não no cron do dia seguinte. A tag
// `posts` é invalidada a cada publicação/revalidação, então o conteúdo
// acompanha o fluxo editorial automaticamente. force-dynamic evita o
// prerender no build (WP é inacessível nessa fase); o cache é do fetch.
export const dynamic = 'force-dynamic'

type NewsPost = { slug: string; date_gmt: string; title: { rendered: string } }

function escapeXml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function stripTags(value: string) {
    return value.replace(/<[^>]+>/g, '').replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

export async function GET() {
    // A janela de 48h é aplicada em código, não via `after` no WP: além de
    // manter a chave de cache do fetch estável (URL fixa, revalidada pela tag
    // `posts`), o parâmetro `after` retornou subconjuntos inconsistentes em
    // produção (incidente 2026-07-17) enquanto a query simples — a mesma que
    // o /blog usa — sempre devolve o conjunto completo.
    const recent = await wpFetch<NewsPost[]>(
        `/wp/v2/posts${buildParams({ per_page: 100, status: 'publish', _fields: 'slug,date_gmt,title', orderby: 'date', order: 'desc' })}`,
        { revalidate: 300, tags: [WP_CACHE_TAGS.posts] },
    )
    const cutoff = Date.now() - 48 * 60 * 60 * 1000
    const posts = (recent ?? []).filter((post) => {
        const published = Date.parse(`${post.date_gmt}Z`)
        return Number.isFinite(published) && published >= cutoff
    })

    // Vazio é legítimo aqui: sem artigo nas últimas 48h o urlset fica sem
    // entradas, e o Google trata isso normalmente.
    const urls = posts
        .map((post) => [
            '  <url>',
            `    <loc>${SITE_URL}/blog/${escapeXml(post.slug)}</loc>`,
            '    <news:news>',
            `      <news:publication><news:name>${escapeXml(SITE_NAME)}</news:name><news:language>pt</news:language></news:publication>`,
            `      <news:publication_date>${escapeXml(`${post.date_gmt}Z`)}</news:publication_date>`,
            `      <news:title>${escapeXml(stripTags(post.title.rendered))}</news:title>`,
            '    </news:news>',
            '  </url>',
        ].join('\n'))
        .join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${urls}\n</urlset>\n`

    return new Response(xml, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    })
}
