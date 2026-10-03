import { getPosts, getCategories } from '@/lib/wordpress/posts'
import { getProductions } from '@/lib/wordpress/productions'
import { getMostAccessedArtists, getStreamingArtists } from '@/lib/wordpress/artists'
import { getFeaturedSpotlight } from '@/lib/wordpress/spotlight'
import { getTrendingGroups } from '@/lib/wordpress/groups'
import { getFeaturedStoreProducts } from '@/lib/wordpress/store'
import { getSiteSettings } from '@/lib/wordpress/site-settings'
import { getStreamingTopShows } from '@/lib/tmdb/streaming'

/**
 * Dados da `HomeFrontPage`, comuns à home em português e às de outros idiomas.
 * `comercio: false` pula o que só existe no Brasil (loja e streaming do TMDB-BR):
 * os blocos correspondentes também somem fora do português.
 */
export async function carregarHome({ comercio }: { comercio: boolean }) {
    const siteSettings = await getSiteSettings()
    const curatedIds = [
        siteSettings.home.heroPostId,
        ...siteSettings.home.highlightPostIds,
    ].filter(Boolean)

    const [postsResult, curatedPostsResult, productionsResult, trendingArtists, trendingGroupsResult, streamingArtists, featuredSpotlightResult, streamingShows, categoriesResult, featuredProductsResult] = await Promise.allSettled([
        // A composição acima da dobra usa no máximo 19 posts (hero + 6
        // destaques + 4 longreads + 8 recentes). Buscar 24 transferia cinco
        // registros completos do WordPress/RSC sem qualquer uso visual.
        getPosts({ perPage: 20, includeContent: false }),
        curatedIds.length
            ? getPosts({ perPage: curatedIds.length, includeIds: curatedIds })
            : Promise.resolve({ items: [], total: 0, totalPages: 0 }),
        getProductions({ perPage: 6, orderby: 'date' }),
        getMostAccessedArtists(8),
        getTrendingGroups(8),
        getStreamingArtists(12),
        getFeaturedSpotlight(),
        comercio ? getStreamingTopShows() : Promise.resolve({}),
        getCategories(),
        comercio ? getFeaturedStoreProducts() : Promise.resolve([]),
    ])

    const latestPosts = postsResult.status === 'fulfilled' ? postsResult.value.items : []
    const curatedPosts = curatedPostsResult.status === 'fulfilled' ? curatedPostsResult.value.items : []
    const posts = [...curatedPosts, ...latestPosts].filter(
        (post, index, all) => all.findIndex(item => item.id === post.id) === index,
    )
    const productions = productionsResult.status === 'fulfilled' ? productionsResult.value.items : []
    const artists = trendingArtists.status === 'fulfilled' ? trendingArtists.value : []
    const featuredSpotlight = featuredSpotlightResult.status === 'fulfilled' ? featuredSpotlightResult.value : null
    const spotlightArtists = streamingArtists.status === 'fulfilled' && streamingArtists.value.length >= 4
        ? streamingArtists.value
        : artists  // fallback para trending se streaming_score ainda não populado
    const trendingGroupsList = trendingGroupsResult.status === 'fulfilled' ? trendingGroupsResult.value : []
    const streamingByPlatform = streamingShows.status === 'fulfilled' ? streamingShows.value : {}
    const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : []
    const categoryMap = Object.fromEntries(categories.map(c => [c.id, { name: c.name, slug: c.slug }]))
    const featuredProducts = featuredProductsResult.status === 'fulfilled' ? featuredProductsResult.value : []

    return { siteSettings, posts, productions, artists, featuredSpotlight, spotlightArtists, trendingGroupsList, streamingByPlatform, categoryMap, featuredProducts }
}
