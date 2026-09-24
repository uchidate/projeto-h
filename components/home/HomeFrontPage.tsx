import { SITE_NAME } from '@/lib/constants/site'
import type { WPPost, WPProduction, WPArtist, WPGroup } from '@/lib/wordpress/types'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { HomeQuizBanner } from '@/components/home/HomeQuizBanner'
import { ADSENSE } from '@/lib/config/ads'
import { HomeHero } from '@/components/home/HomeHero'
import { HomeEditorialHubs } from '@/components/home/HomeEditorialHubs'
import { HomeHighlightGrid } from '@/components/home/HomeHighlightGrid'
import { HomeLongreads } from '@/components/home/HomeLongreads'
import { HomeTrendingArtists } from '@/components/home/HomeTrendingArtists'
import { HomeTrendingGroups } from '@/components/home/HomeTrendingGroups'
import { HomeProductionsRail } from '@/components/home/HomeProductionsRail'
import { HomeLatestPosts } from '@/components/home/HomeLatestPosts'
import { HomeStreamingTop } from '@/components/home/HomeStreamingTop'
import { HomeArtistSpotlight } from '@/components/home/HomeArtistSpotlight'
import type { HomeSettings } from '@/lib/wordpress/site-settings'
import type { ShowsByPlatform } from '@/lib/tmdb/streaming'

/* Hallmark · pre-emit critique: P4 H5 E4 S5 R5 V4
 * genre: editorial · macrostructure: Split Studio · theme: editorial tokens
 * hero: H2 Split diptych · nav: N6 existing masthead · footer: Ft1 existing masthead
 */

type Props = {
    posts: WPPost[]
    productions: WPProduction[]
    artists: WPArtist[]
    spotlightArtists?: WPArtist[]
    featuredArtist?: WPArtist | null
    featuredArtistNote?: string
    trendingGroups?: WPGroup[]
    homeSettings: HomeSettings
    streamingByPlatform: ShowsByPlatform
    categoryMap?: Record<number, { name: string; slug: string }>
}

export function HomeFrontPage({ posts, productions, artists, spotlightArtists, featuredArtist, featuredArtistNote, trendingGroups = [], homeSettings, streamingByPlatform, categoryMap }: Props) {
    const heroPost = posts.find(post => post.id === homeSettings.heroPostId) ?? posts[0]
    const withoutHero = posts.filter(post => post.id !== heroPost?.id)
    const selectedHighlights = homeSettings.highlightPostIds
        .map(id => posts.find(post => post.id === id))
        .filter((post): post is WPPost => post !== undefined)
        .filter(post => post.id !== heroPost?.id)
    const highlighted = selectedHighlights.length ? selectedHighlights.slice(0, 6) : withoutHero.slice(0, 6)
    const usedIds = new Set([heroPost?.id, ...highlighted.map(post => post.id)])
    const rest = posts.filter(post => !usedIds.has(post.id))
    const longreads = rest.slice(0, 4)
    const latest = rest.slice(4, 14)

    return (
        <section className="bg-background" aria-label={`Página inicial ${SITE_NAME}`}>
            <div className="mx-auto max-w-[1440px] border-y border-border bg-background">
                <div data-bloco="home-hero" className="contents"><HomeHero post={heroPost} production={!heroPost ? productions[0] : undefined} /></div>
                <div data-bloco="home-hubs" className="contents"><HomeEditorialHubs hubs={homeSettings.hubs} /></div>
                <div data-bloco="home-spotlight" className="contents"><HomeArtistSpotlight artists={spotlightArtists ?? artists} groups={trendingGroups} /></div>
                <div data-bloco="home-destaques" className="contents"><HomeHighlightGrid posts={highlighted} categoryMap={categoryMap} /></div>
                {ADSENSE.slots.inline && (
                    <div className="border-t border-border px-4 py-6 sm:px-6 lg:px-10">
                        <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="home_feed" />
                    </div>
                )}
                {/*
                  * Daqui para baixo, nada aparece no carregamento em nenhum
                  * viewport, e cada bloco leva `cv-auto` (content-visibility):
                  * o navegador pula estilo, layout e pintura até o bloco chegar
                  * perto da tela. Ver `.cv-auto` em globals.css.
                  *
                  * Os blocos de ANÚNCIO ficam de fora de propósito: o AdSlot
                  * mede visibilidade com IntersectionObserver, e a mudança não
                  * deve mexer em como o AdSense enxerga a página.
                  */}
                <div className="cv-auto [--cv-h:1800px] lg:[--cv-h:1180px] grid border-t border-border bg-surface/55 lg:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.75fr)]">
                    <div data-bloco="home-longreads" className="contents"><HomeLongreads posts={longreads} /></div>
                    <div data-bloco="home-artistas-em-alta" className="contents"><HomeTrendingArtists artists={artists} featuredArtist={featuredArtist} featuredArtistNote={featuredArtistNote} /></div>
                </div>
                <div className="cv-auto [--cv-h:620px] sm:[--cv-h:720px] lg:[--cv-h:490px]">
                    <div data-bloco="home-producoes" className="contents"><HomeProductionsRail productions={productions} /></div>
                </div>
                {trendingGroups.length > 0 && (
                    <div className="cv-auto [--cv-h:1100px] lg:[--cv-h:920px] grid border-t border-border bg-background lg:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.75fr)]">
                        <div data-bloco="home-ultimos" className="contents"><HomeLatestPosts posts={latest.slice(0, 8)} categoryMap={categoryMap} /></div>
                        <div data-bloco="home-grupos-em-alta" className="contents"><HomeTrendingGroups groups={trendingGroups} /></div>
                    </div>
                )}
                {ADSENSE.slots.leaderboard && (
                    <div className="border-t border-border px-4 py-6 sm:px-6 lg:px-10">
                        <AdSlotInline slot={ADSENSE.slots.leaderboard} layout="leaderboard" analyticsPlacement="home_mid_leaderboard" />
                    </div>
                )}
                <div className="cv-auto [--cv-h:266px] sm:[--cv-h:284px] lg:[--cv-h:250px]">
                    <div data-bloco="home-streaming" className="contents"><HomeStreamingTop showsByPlatform={streamingByPlatform} /></div>
                </div>
                <div className="cv-auto [--cv-h:266px] min-[430px]:[--cv-h:243px] sm:[--cv-h:155px] md:[--cv-h:110px] lg:[--cv-h:147px] border-t border-border px-4 sm:px-6 lg:px-10">
                    <div data-bloco="home-quiz" className="contents"><HomeQuizBanner /></div>
                </div>
            </div>
        </section>
    )
}
