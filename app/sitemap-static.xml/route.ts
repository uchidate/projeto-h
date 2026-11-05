import { buildSitemapIndex, localesComPostsTraduzidos, shardsComTraducao, sitemapResponse } from '@/lib/seo/dynamicSitemap'

export const dynamic = 'force-dynamic'

export async function GET() {
    // Se o WordPress falhar aqui, o índice sai sem os sitemaps de posts traduzidos em vez de cair inteiro.
    const localesComPosts = await localesComPostsTraduzidos().catch(() => [])
    // Idem para os shards por idioma: sem a consulta, o índice lista todos (sitemap vazio responde 404).
    const shardsPorIdioma = await shardsComTraducao().catch(() => undefined)
    return sitemapResponse(buildSitemapIndex(localesComPosts, shardsPorIdioma))
}
