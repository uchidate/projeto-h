import { buildSitemapIndex, localesComPostsTraduzidos, sitemapResponse } from '@/lib/seo/dynamicSitemap'

export const dynamic = 'force-dynamic'

export async function GET() {
    // Se o WordPress falhar aqui, o índice sai sem os sitemaps de posts traduzidos em vez de cair inteiro.
    const localesComPosts = await localesComPostsTraduzidos().catch(() => [])
    return sitemapResponse(buildSitemapIndex(localesComPosts))
}
