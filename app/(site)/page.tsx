import { ACTIVE_LOCALES, DEFAULT_LOCALE, LOCALE_META, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { fetchCatalog } from '@/components/features/LocalizedCatalog'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getPosts, getCategories } from '@/lib/wordpress/posts'
import { getProductions } from '@/lib/wordpress/productions'
import { getMostAccessedArtists, getStreamingArtists } from '@/lib/wordpress/artists'
import { getFeaturedSpotlight } from '@/lib/wordpress/spotlight'
import { getTrendingGroups } from '@/lib/wordpress/groups'
import { SITE_URL, SITE_NAME, baseOG, baseTwitter } from '@/lib/constants/site'
import { HomeFrontPage } from '@/components/home/HomeFrontPage'
import { HomeBelowFold } from '@/components/home/HomeBelowFold'
import { JsonLd } from '@/components/seo/JsonLd'
import { OrganizationSchema } from '@/components/seo/OrganizationSchema'
import { getSiteSettings } from '@/lib/wordpress/site-settings'
import { getStreamingTopShows } from '@/lib/tmdb/streaming'
import { IS_BUILD } from '@/lib/wordpress/config'

// 10 minutos em vez de 60 s: publicar dispara revalidação sob demanda pelo
// webhook, então o tempo aqui é só a rede de segurança. Com 60 s a home ficava
// permanentemente STALE (x-nextjs-cache: STALE em toda requisição), regerando à
// toa, e limitava a 60 s qualquer cache de borda que venha a ser ligado.
export const revalidate = 600

export async function generateMetadata(): Promise<Metadata> {
    // Home em outro idioma so entra no hreflang se tiver ficha publicada: a
    // versao vazia e noindex e nao deve ser apontada. Tambem e o que faz o
    // seletor PT/EN do cabecalho aparecer aqui.
    const outros = ACTIVE_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE)
    const comConteudo = (await Promise.all(outros.map(async (locale) => {
        const totais = await Promise.all((['groups', 'artists', 'productions'] as const).map((kind) => fetchCatalog(kind, locale, 1)))
        return totais.some((r) => r.total > 0) ? locale : null
    }))).filter((locale): locale is Locale => locale !== null)

    return {
        title: { absolute: `${SITE_NAME} — K-Pop, K-Drama e Cultura Coreana` },
        description: 'Dramas, filmes, artistas e grupos coreanos — tudo em português. O seu portal Hallyu no Brasil.',
        alternates: {
            canonical: SITE_URL,
            ...(comConteudo.length > 0 ? {
                languages: {
                    [LOCALE_META[DEFAULT_LOCALE].htmlLang]: `${SITE_URL}/`,
                    ...Object.fromEntries(comConteudo.map((locale) => [LOCALE_META[locale].htmlLang, `${SITE_URL}${href('home', undefined, locale)}`])),
                    'x-default': `${SITE_URL}/`,
                },
            } : {}),
        },
        openGraph: baseOG(SITE_URL),
        twitter: baseTwitter(),
    }
}

export default async function HomePage() {
    const siteSettings = await getSiteSettings()
    const curatedIds = [
        siteSettings.home.heroPostId,
        ...siteSettings.home.highlightPostIds,
    ].filter(Boolean)

    const [postsResult, curatedPostsResult, productionsResult, trendingArtists, trendingGroupsResult, streamingArtists, featuredSpotlightResult, streamingShows, categoriesResult] = await Promise.allSettled([
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
        getStreamingTopShows(),
        getCategories(),
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

    // Sem posts a home não é "home vazia", é home quebrada: wpFetch devolve []
    // quando o WordPress falha, e o resultado sairia com HTTP 200. Em 2026-08-06
    // uma renderização assim foi congelada por dez minutos no cache de borda —
    // 97 KB sem uma única imagem. Lançar aqui impede o ISR de guardar a versão
    // degradada: o Next continua servindo a última boa e tenta de novo depois.
    // Durante o build o wpFetch curto-circuita para [] de propósito (IS_BUILD),
    // então a guarda só vale em runtime — senão derruba o próprio build.
    if (!IS_BUILD && posts.length === 0) {
        throw new Error('Home sem posts — WordPress indisponível; não cachear esta renderização')
    }

    return (
        <>
            <OrganizationSchema />
            <JsonLd
                data={{
                    '@context': 'https://schema.org',
                    '@type': 'WebPage',
                    name: `${SITE_NAME} — K-Pop, K-Drama e Cultura Coreana`,
                    url: SITE_URL,
                    description: 'Dramas, filmes, artistas e grupos coreanos — tudo em português.',
                    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
                }}
            />
            <HomeFrontPage
                posts={posts}
                productions={productions}
                artists={artists}
                spotlightArtists={spotlightArtists}
                featuredArtist={featuredSpotlight?.artist ?? null}
                featuredArtistNote={featuredSpotlight?.note ?? ''}
                trendingGroups={trendingGroupsList}
                homeSettings={siteSettings.home}
                streamingByPlatform={streamingByPlatform}
                categoryMap={categoryMap}
            />
            <Suspense fallback={null}>
                <HomeBelowFold homeSettings={siteSettings.home} cultureGuides={siteSettings.cultureGuides} />
            </Suspense>
        </>
    )
}
