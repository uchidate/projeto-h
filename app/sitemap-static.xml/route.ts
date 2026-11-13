import { buildSitemapIndex, lastmodDosShards, localesComPostsTraduzidos, shardsComTraducao, sitemapResponse } from '@/lib/seo/dynamicSitemap'

export const dynamic = 'force-dynamic'

export async function GET() {
    // Se o WordPress falhar aqui, o índice sai sem os sitemaps de posts traduzidos em vez de cair inteiro.
    const localesComPosts = await localesComPostsTraduzidos().catch(() => [])
    // Idem para os shards por idioma: sem a consulta, o índice lista todos (sitemap vazio responde 404).
    const shardsPorIdioma = await shardsComTraducao().catch(() => undefined)
    // Sem a data o arquivo entra no índice como antes; a consulta nunca derruba o índice.
    const lastmods = await lastmodDosShards(localesComPosts, shardsPorIdioma).catch(() => ({}))
    return sitemapResponse(buildSitemapIndex(localesComPosts, shardsPorIdioma, lastmods))
}
