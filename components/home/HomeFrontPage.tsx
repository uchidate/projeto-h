import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import type { WPPost, WPProduction, WPArtist, WPGroup } from '@/lib/wordpress/types'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { HomeQuizBanner } from '@/components/home/HomeQuizBanner'
import { ADSENSE } from '@/lib/config/ads'
import { HomeHero } from '@/components/home/HomeHero'
import { escolherCapas } from '@/lib/home/frescor'
import { montarEditorias, type PostsPorEditoria } from '@/lib/home/editorias'
import { HomeExplore } from '@/components/home/HomeExplore'
import { HomeTema } from '@/components/home/HomeTema'
import { HomeGuias } from '@/components/home/HomeGuias'
import { HomeAssuntos } from '@/components/home/HomeAssuntos'
import { HomeCalendario } from '@/components/home/HomeCalendario'
import { HomeEditorias } from '@/components/home/HomeEditorias'
import { HomeEditorialHubs } from '@/components/home/HomeEditorialHubs'
import { HomeDestaquesColuna } from '@/components/home/HomeDestaquesColuna'
import { HomeLongreads } from '@/components/home/HomeLongreads'
import { HomeTrendingArtists } from '@/components/home/HomeTrendingArtists'
import { HomeTrendingGroups } from '@/components/home/HomeTrendingGroups'
import { HomeProductionsRail } from '@/components/home/HomeProductionsRail'
import { HomeLatestPosts } from '@/components/home/HomeLatestPosts'
import { HomeStreamingTop } from '@/components/home/HomeStreamingTop'
import { HomeArtistSpotlight } from '@/components/home/HomeArtistSpotlight'
import { ShopRelatedSection } from '@/components/ui/ShopRelatedSection'
import type { CartaoExplore } from '@/lib/home/explore'
import type { TemaHome } from '@/lib/home/temas'
import type { GuiaDaHome } from '@/lib/home/guias'
import type { AniversariosHome } from '@/lib/home/aniversarios'
import type { StoreProduct } from '@/lib/wordpress/store'
import type { BestOfList, HomeSettings } from '@/lib/wordpress/site-settings'
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
    cultureGuides?: BestOfList[]
    // Pergunta do dia (streamada em Suspense pela página): entra depois dos populares, junto do quiz.
    pergunta?: ReactNode
    streamingByPlatform: ShowsByPlatform
    categoryMap?: Record<number, { name: string; slug: string }>
    featuredProducts?: StoreProduct[]
    postsEditorias?: PostsPorEditoria
    aniversarios?: AniversariosHome
    guiasPorTema?: GuiaDaHome[]
    explore?: CartaoExplore[]
    temas?: { gastronomia: TemaHome; beleza: TemaHome } | null
    locale?: Locale
}

export async function HomeFrontPage({ locale = DEFAULT_LOCALE, posts, productions, artists, spotlightArtists, featuredArtist, featuredArtistNote, trendingGroups = [], homeSettings, cultureGuides = [], pergunta, streamingByPlatform, categoryMap, featuredProducts = [], postsEditorias = {}, aniversarios, guiasPorTema = [], temas = null, explore = [] }: Props) {
    const t = await getTranslations({ locale, namespace: 'home.pagina' })
    // Blocos que só existem em português (conteúdo e comércio brasileiros): hubs editoriais
    // do WP, loja (BRL/afiliado), streaming do Brasil e quiz. Ver docs/I18N-V2.md.
    const soPt = locale === DEFAULT_LOCALE
    // Capa só com matéria fresca (ver lib/home/frescor.ts); sem nenhuma, o hero é uma produção.
    // Os slides extras nunca tomam as matérias escolhidas à mão para os destaques (nada some nem se repete).
    const heroPosts = escolherCapas(posts, homeSettings.heroPostId, 4, new Date(), new Set(homeSettings.highlightPostIds))
    const heroIds = new Set(heroPosts.map(post => post.id))
    const withoutHero = posts.filter(post => !heroIds.has(post.id))
    const selectedHighlights = homeSettings.highlightPostIds
        .map(id => posts.find(post => post.id === id))
        .filter((post): post is WPPost => post !== undefined)
        .filter(post => !heroIds.has(post.id))
    const highlighted = selectedHighlights.length ? selectedHighlights.slice(0, 6) : withoutHero.slice(0, 6)
    const usedIds = new Set([...heroIds, ...highlighted.map(post => post.id)])
    const rest = posts.filter(post => !usedIds.has(post.id))
    const longreads = rest.slice(0, 4)
    const latest = rest.slice(4, 14)
    // Cada matéria aparece em uma só vitrine: as editorias pulam o que já está no carrossel, nos destaques e nos longreads,
    // e o que foi para elas sai de "Últimas publicações".
    const editorias = montarEditorias(postsEditorias, new Set([...usedIds, ...longreads.map(post => post.id)]))
    const editoriasIds = new Set(editorias.flatMap(c => c.posts.map(post => post.id)))
    const latestRestantes = latest.filter(post => !editoriasIds.has(post.id))

    return (
        <section className="bg-background" aria-label={t('rotulo')}>
            <div className="mx-auto max-w-[1440px] border-y border-border bg-background">
                {soPt && <div data-bloco="home-assuntos" className="contents"><HomeAssuntos hubs={homeSettings.hubs} locale={locale} /></div>}
                <div className="lg:grid lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
                    <div data-bloco="home-hero" className="contents"><HomeHero posts={heroPosts} production={!heroPosts.length ? (productions.find(p => p.featured_image_url) ?? productions[0]) : undefined} locale={locale} /></div>
                    <div data-bloco="home-destaques" className="contents"><HomeDestaquesColuna posts={highlighted.slice(0, 5)} categoryMap={categoryMap} locale={locale} /></div>
                    {soPt && aniversarios && <div data-bloco="home-calendario" className="contents"><HomeCalendario aniversarios={aniversarios} locale={locale} /></div>}
                </div>
                {soPt && <div data-bloco="home-guias" className="contents"><HomeGuias passos={cultureGuides} guias={guiasPorTema} locale={locale} /></div>}
                {soPt && <div data-bloco="home-hubs" className="contents"><HomeEditorialHubs hubs={homeSettings.hubs} locale={locale} /></div>}
                <div data-bloco="home-editorias" className="contents"><HomeEditorias editorias={editorias} locale={locale} /></div>
                {soPt && <div data-bloco="home-loja" className="contents"><ShopRelatedSection title={t('lojaTitulo')} products={featuredProducts} /></div>}
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
                    <div data-bloco="home-longreads" className="contents"><HomeLongreads posts={longreads} locale={locale} /></div>
                    <div data-bloco="home-artistas-em-alta" className="contents"><HomeTrendingArtists artists={artists} featuredArtist={featuredArtist} featuredArtistNote={featuredArtistNote} locale={locale} /></div>
                </div>
                <div className="cv-auto [--cv-h:230px] lg:[--cv-h:208px]">
                    <div data-bloco="home-spotlight" className="contents"><HomeArtistSpotlight artists={spotlightArtists ?? artists} groups={trendingGroups} locale={locale} /></div>
                </div>
                {soPt && (
                    <>
                        {pergunta}
                        <div className="cv-auto [--cv-h:266px] min-[430px]:[--cv-h:243px] sm:[--cv-h:155px] md:[--cv-h:110px] lg:[--cv-h:147px] border-t border-border px-4 sm:px-6 lg:px-10">
                            <div data-bloco="home-quiz" className="contents"><HomeQuizBanner locale={locale} /></div>
                        </div>
                        <div data-bloco="home-explore" className="contents"><HomeExplore cartoes={explore} locale={locale} /></div>
                        {temas && (
                            <>
                                <HomeTema tema={temas.gastronomia} chave="gastronomia" cor="#b4531a" href="/comidas" bloco="home-gastronomia" locale={locale} />
                                <HomeTema tema={temas.beleza} chave="beleza" cor="#c61153" href="/blog?category=k-beauty" bloco="home-beleza" locale={locale} />
                            </>
                        )}
                    </>
                )}
                <div className="cv-auto [--cv-h:620px] sm:[--cv-h:720px] lg:[--cv-h:490px]">
                    <div data-bloco="home-producoes" className="contents"><HomeProductionsRail productions={productions} locale={locale} /></div>
                </div>
                {trendingGroups.length > 0 && (
                    <div className="cv-auto [--cv-h:1100px] lg:[--cv-h:920px] grid border-t border-border bg-background lg:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.75fr)]">
                        <div data-bloco="home-ultimos" className="contents"><HomeLatestPosts posts={latestRestantes.slice(0, 8)} categoryMap={categoryMap} locale={locale} /></div>
                        <div data-bloco="home-grupos-em-alta" className="contents"><HomeTrendingGroups groups={trendingGroups} locale={locale} /></div>
                    </div>
                )}
                {ADSENSE.slots.leaderboard && (
                    <div className="border-t border-border px-4 py-6 sm:px-6 lg:px-10">
                        <AdSlotInline slot={ADSENSE.slots.leaderboard} layout="leaderboard" analyticsPlacement="home_mid_leaderboard" />
                    </div>
                )}
                {soPt && (
                    <>
                        <div className="cv-auto [--cv-h:266px] sm:[--cv-h:284px] lg:[--cv-h:250px]">
                            <div data-bloco="home-streaming" className="contents"><HomeStreamingTop showsByPlatform={streamingByPlatform} /></div>
                        </div>
                    </>
                )}
            </div>
        </section>
    )
}
