import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import Link from '@/components/i18n/LocalizedLink'
import { getTrendingArtists, getStreamingArtists } from '@/lib/wordpress/artists'
import { getTrendingGroups } from '@/lib/wordpress/groups'
import { exigirListagemComConteudo } from '@/lib/wordpress/client'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { ArtistCard } from '@/components/artists/ArtistCard'
import { GroupCard } from '@/components/groups/GroupsPage'
import { getVitrineGeral } from '@/lib/wordpress/vitrine'
import { LojaEmLinha } from '@/components/ui/LojaEmLinha'
import { QuizWidget } from '@/components/ui/QuizWidget'
import { PageBreadcrumb } from '@/components/seo/PageBreadcrumb'


export async function metadataDaPagina(locale: Locale = DEFAULT_LOCALE): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'client.trendingPage' })
    const url = `${SITE_URL}${href('trending', undefined, locale)}`
    return {
        title: t('title'),
        description: t('description'),
        alternates: { canonical: url },
        openGraph: baseOG(url),
        twitter: baseTwitter(),
    }
}

export default async function TrendingPage({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
    const t = await getTranslations({ locale, namespace: 'client.trendingPage' })
    const emPt = locale === DEFAULT_LOCALE
    const shopProducts = emPt ? await getVitrineGeral('trending', 6, 'kpop') : []
    const [streamingArtists, trendingArtists, trendingGroups] = await Promise.all([
        getStreamingArtists(24),
        getTrendingArtists(24),
        getTrendingGroups(24),
    ])
    // Artistas e grupos em alta nunca somem juntos: os dois vazios é falha
    // transitória do WP (o client converte em []). Lançar faz o ISR manter o
    // snapshot anterior em vez de cachear a página em branco por 5 minutos.
    if (trendingArtists.length === 0) exigirListagemComConteudo(trendingGroups, '/trending')

    return (
        <>
            <PageBreadcrumb items={[{ name: t('crumb'), path: '/trending' }]} />
        <div className="mx-auto max-w-6xl px-4 py-10">
            <nav className="mb-2 font-mono text-[10px] text-muted">
                <Link href="/" className="hover:text-foreground">{t('crumbHome')}</Link> / {t('crumb')}
            </nav>
            <h1 className="text-2xl font-black text-foreground sm:text-3xl">{t('title')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
                {t('intro')}
            </p>

            {streamingArtists.length > 0 && (
                <section className="mt-8">
                    <h2 className="text-lg font-bold text-foreground">{t('chartsTitle')}</h2>
                    <p className="mt-1 text-xs text-muted">{t('chartsDesc')}</p>
                    <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                        {streamingArtists.map((artist, i) => (
                            <ArtistCard key={artist.id} artist={artist} variant="catalog" priority={i < 6} />
                        ))}
                    </div>
                </section>
            )}

            {/* Entre o primeiro e o segundo bloco: a página tem ~5.500px de rolagem
                no celular e não tinha anúncio nenhum (medido em 2026-09-17). */}
            {ADSENSE.slots.inline && (streamingArtists.length > 0 || trendingGroups.length > 0 || trendingArtists.length > 0) && (
                <div className="mt-10">
                    <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="trending_feed" />
                </div>
            )}

            {trendingGroups.length > 0 && (
                <section className="mt-10">
                    <h2 className="text-lg font-bold text-foreground">{t('groupsTitle')}</h2>
                    <p className="mt-1 text-xs text-muted">{t('groupsDesc')}</p>
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
                        {trendingGroups.map(group => (
                            <GroupCard key={group.id} group={group} locale={locale} />
                        ))}
                    </div>
                </section>
            )}

            {emPt && <LojaEmLinha bloco="trending-loja-meio" products={shopProducts} title="Merch dos que estão em alta" contexto="trending:meio" className="mt-10" />}

            {trendingArtists.length > 0 && (
                <section className="mt-10">
                    <h2 className="text-lg font-bold text-foreground">{t('artistsTitle')}</h2>
                    <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                        {trendingArtists.map(artist => (
                            <ArtistCard key={artist.id} artist={artist} variant="catalog" />
                        ))}
                    </div>
                </section>
            )}

            {emPt && <QuizWidget category="k-pop" title="Testou seu conhecimento hoje?" description="Veja se você acompanha de verdade quem está em alta" />}
        </div>
        </>
    )
}
