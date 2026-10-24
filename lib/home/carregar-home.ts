import { getPosts, getCategories } from '@/lib/wordpress/posts'
import { getProductions } from '@/lib/wordpress/productions'
import { getArtists, getMostAccessedArtists, getStreamingArtists } from '@/lib/wordpress/artists'
import { getFeaturedSpotlight } from '@/lib/wordpress/spotlight'
import { getTrendingGroups } from '@/lib/wordpress/groups'
import { getFeaturedStoreProducts } from '@/lib/wordpress/store'
import { getSiteSettings } from '@/lib/wordpress/site-settings'
import { getStreamingTopShows } from '@/lib/tmdb/streaming'
import { hojeEmBrasilia, mesesParaBuscar, montarAniversarios, type AniversariosHome } from '@/lib/home/aniversarios'
import { COLUNAS_EDITORIAS, type PostsPorEditoria } from '@/lib/home/editorias'

/**
 * Dados da `HomeFrontPage`, comuns à home em português e às de outros idiomas.
 * `comercio: false` pula o que só existe no Brasil (loja e streaming do TMDB-BR):
 * os blocos correspondentes também somem fora do português.
 */
export async function carregarHome({ comercio }: { comercio: boolean }) {
    const siteSettings = await getSiteSettings()
    const hoje = hojeEmBrasilia()
    const curatedIds = [
        siteSettings.home.heroPostId,
        ...siteSettings.home.highlightPostIds,
    ].filter(Boolean)

    const [postsResult, curatedPostsResult, editoriasResult, productionsResult, trendingArtists, trendingGroupsResult, streamingArtists, featuredSpotlightResult, streamingShows, categoriesResult, featuredProductsResult, aniversariosResult] = await Promise.allSettled([
        // A composição acima da dobra usa no máximo 19 posts (carrossel de até 4 + 6
        // destaques + 4 longreads + 8 recentes). Buscar 24 transferia cinco
        // registros completos do WordPress/RSC sem qualquer uso visual.
        getPosts({ perPage: 22, includeContent: false }),
        curatedIds.length
            ? getPosts({ perPage: curatedIds.length, includeIds: curatedIds })
            : Promise.resolve({ items: [], total: 0, totalPages: 0 }),
        // Uma busca por editoria: o feed geral é dominado pelo assunto da semana e deixaria colunas vazias.
        Promise.allSettled(COLUNAS_EDITORIAS.map(c => getPosts({ category: c.categoria, perPage: 16, includeContent: false }))),
        getProductions({ perPage: 6, orderby: 'date' }),
        getMostAccessedArtists(8),
        getTrendingGroups(8),
        getStreamingArtists(12),
        getFeaturedSpotlight(),
        comercio ? getStreamingTopShows() : Promise.resolve({}),
        getCategories(),
        comercio ? getFeaturedStoreProducts() : Promise.resolve([]),
        // Só o calendário em português existe; a busca é por mês de nascimento, ordenada por popularidade.
        comercio
            ? Promise.all(mesesParaBuscar(hoje).map(birthMonth => getArtists({ birthMonth, perPage: 100 }))).then(r => r.flatMap(x => x.items))
            : Promise.resolve([]),
    ])

    const latestPosts = postsResult.status === 'fulfilled' ? postsResult.value.items : []
    const curatedPosts = curatedPostsResult.status === 'fulfilled' ? curatedPostsResult.value.items : []
    const posts = [...curatedPosts, ...latestPosts].filter(
        (post, index, all) => all.findIndex(item => item.id === post.id) === index,
    )
    const postsEditorias: PostsPorEditoria = editoriasResult.status === 'fulfilled'
        ? Object.fromEntries(COLUNAS_EDITORIAS.map((c, i) => {
            const r = editoriasResult.value[i]
            return [c.chave, r.status === 'fulfilled' ? r.value.items : []]
        }))
        : {}
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

    const aniversarios: AniversariosHome = montarAniversarios(aniversariosResult.status === 'fulfilled' ? aniversariosResult.value : [], hoje)

    return { siteSettings, posts, productions, artists, featuredSpotlight, spotlightArtists, trendingGroupsList, streamingByPlatform, categoryMap, featuredProducts, postsEditorias, aniversarios }
}
