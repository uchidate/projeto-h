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
import { HomeLoja } from '@/components/home/HomeLoja'
import { HomeExplore } from '@/components/home/HomeExplore'
import { HomeTema } from '@/components/home/HomeTema'
import { HomeGuias } from '@/components/home/HomeGuias'
import { HomeAssuntos } from '@/components/home/HomeAssuntos'
import { HomeCalendario } from '@/components/home/HomeCalendario'
import { HomeEstaSemana } from '@/components/home/HomeEstaSemana'
import { HomeSeguindo } from '@/components/home/HomeSeguindo'
import { HomeEditorias } from '@/components/home/HomeEditorias'
import { HomeDestaquesColuna } from '@/components/home/HomeDestaquesColuna'
import { HomeLongreads } from '@/components/home/HomeLongreads'
import { HomePopulares } from '@/components/home/HomePopulares'
import type { PrateleirasEditorias } from '@/lib/home/editorias-loja'
import type { CapaAlbum } from '@/lib/home/capa-album'
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
    produtosMaisVendidos?: StoreProduct[]
    postsEditorias?: PostsPorEditoria
    aniversarios?: AniversariosHome
    guiasPorTema?: GuiaDaHome[]
    explore?: CartaoExplore[]
    prateleirasEditorias?: PrateleirasEditorias
    capasAlbum?: Record<number, CapaAlbum>
    producoesEmAlta?: WPProduction[]
    hoje?: string
    temas?: { gastronomia: TemaHome; beleza: TemaHome } | null
    locale?: Locale
}

export async function HomeFrontPage({ locale = DEFAULT_LOCALE, posts, productions, artists, trendingGroups = [], homeSettings, cultureGuides = [], pergunta, categoryMap, produtosMaisVendidos = [], postsEditorias = {}, aniversarios, guiasPorTema = [], temas = null, explore = [], prateleirasEditorias = {}, capasAlbum = {}, producoesEmAlta = [], hoje }: Props) {
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
    // Cada matéria aparece em uma só vitrine: as editorias pulam o que já está no carrossel, nos destaques e nos longreads,
    // e o que foi para elas sai de "Últimas publicações".
    const editorias = montarEditorias(postsEditorias, new Set([...usedIds, ...longreads.map(post => post.id)]))

    return (
        <section className="bg-[var(--color-home-page)]" aria-label={t('rotulo')}>
            {soPt && <div data-bloco="home-assuntos" className="mx-auto hidden max-w-[1440px] bg-[var(--color-home-card)] lg:block"><HomeAssuntos hubs={homeSettings.hubs} locale={locale} /></div>}
            <div className="mx-auto flex max-w-[1440px] flex-col gap-3.5 px-3.5 pb-3.5 lg:gap-5 lg:px-6 lg:pb-5">
                <div className="flex flex-col gap-3.5 pt-3.5 lg:grid lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-5 lg:pt-5">
                    <div data-bloco="home-hero" className="min-w-0 bg-[var(--color-home-card)] border border-border"><HomeHero posts={heroPosts} albuns={capasAlbum} production={!heroPosts.length ? (productions.find(p => p.featured_image_url) ?? productions[0]) : undefined} locale={locale} /></div>
                    <div data-bloco="home-destaques" className="min-w-0 bg-[var(--color-home-card)] border border-border"><HomeDestaquesColuna posts={highlighted.slice(0, 5)} categoryMap={categoryMap} locale={locale} /></div>
                    {soPt && aniversarios && <div data-bloco="home-calendario" className="hidden min-w-0 bg-[var(--color-home-card)] border border-border border-t-[3px] border-t-[#8a5a00] lg:block"><HomeCalendario aniversarios={aniversarios} locale={locale} /></div>}
                </div>
                {ADSENSE.slots.leaderboard && (
                    <div className="border border-border bg-[var(--color-home-card)] px-4 py-6 empty:hidden sm:px-6 lg:px-4">
                        <AdSlotInline slot={ADSENSE.slots.leaderboard} layout="leaderboard" analyticsPlacement="home_hero_leaderboard" />
                    </div>
                )}
                {soPt && <div data-bloco="home-seguindo" className="contents"><HomeSeguindo /></div>}
                {soPt && <div data-bloco="home-guias" className="-mx-3.5 lg:mx-0"><HomeGuias passos={cultureGuides} guias={guiasPorTema} locale={locale} /></div>}
                <div data-bloco="home-editorias" className="contents"><HomeEditorias editorias={editorias} prateleiras={prateleirasEditorias} locale={locale} /></div>
                {soPt && <div data-bloco="home-loja" className="-mx-3.5 lg:mx-0"><HomeLoja produtos={produtosMaisVendidos} locale={locale} /></div>}
                {ADSENSE.slots.inline && (
                    <div className="border border-border bg-[var(--color-home-card)] px-4 py-6 empty:hidden sm:px-6 lg:px-4">
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
                <div className="cv-auto [--cv-h:1500px] lg:[--cv-h:640px] border border-border border-t-[3px] border-t-[#6d3fc0] bg-[var(--color-home-card)]">
                    <div data-bloco="home-longreads" className="contents"><HomeLongreads posts={longreads} locale={locale} /></div>
                </div>
                <div data-bloco="home-populares" className="contents"><HomePopulares artistas={artists} grupos={trendingGroups} producoes={producoesEmAlta} hoje={hoje} locale={locale} /></div>
                {soPt && (
                    <>
                        <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.5fr)] lg:gap-5">
                            {pergunta}
                            <div data-bloco="home-quiz" className="contents"><HomeQuizBanner locale={locale} /></div>
                        </div>
                        {temas && <HomeTema tema={temas.gastronomia} chave="gastronomia" cor="#b4531a" href="/comidas" bloco="home-gastronomia" locale={locale} />}
                        <div data-bloco="home-explore" className="border border-border bg-[var(--color-home-card)]"><HomeExplore cartoes={explore} locale={locale} /></div>
                        {temas && <HomeTema tema={temas.beleza} chave="beleza" cor="#0e7490" href="/blog?category=k-beauty" bloco="home-beleza" locale={locale} />}
                    </>
                )}
                {soPt && aniversarios && <div data-bloco="home-esta-semana" className="contents"><HomeEstaSemana aniversarios={aniversarios} locale={locale} /></div>}
            </div>
        </section>
    )
}
