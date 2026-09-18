import type { Metadata } from 'next'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import Link from 'next/link'
import { getTrendingArtists, getStreamingArtists } from '@/lib/wordpress/artists'
import { getTrendingGroups } from '@/lib/wordpress/groups'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { ArtistCard } from '@/components/artists/ArtistCard'
import { GroupCard } from '@/components/features/GroupsPage'

export const revalidate = 300

export const metadata: Metadata = {
    title: 'Em Alta no K-Pop',
    description: 'Artistas e grupos de k-pop em alta agora — ranking dinâmico por popularidade e presença nos charts.',
    alternates: { canonical: `${SITE_URL}/trending` },
    openGraph: baseOG(`${SITE_URL}/trending`),
    twitter: baseTwitter(),
}

export default async function TrendingPage() {
    const [streamingArtists, trendingArtists, trendingGroups] = await Promise.all([
        getStreamingArtists(24),
        getTrendingArtists(24),
        getTrendingGroups(24),
    ])

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            <nav className="mb-2 font-mono text-[10px] text-muted">
                <Link href="/" className="hover:text-foreground">Início</Link> / Em Alta
            </nav>
            <h1 className="text-2xl font-black text-foreground sm:text-3xl">Em Alta no K-Pop</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
                Ranking dinâmico — atualiza conforme o engajamento e a presença nos charts mudam, sem curadoria manual.
            </p>

            {streamingArtists.length > 0 && (
                <section className="mt-8">
                    <h2 className="text-lg font-bold text-foreground">Nos charts agora</h2>
                    <p className="mt-1 text-xs text-muted">Artistas com presença confirmada no Top 10 das plataformas de streaming.</p>
                    <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                        {streamingArtists.map((artist, i) => (
                            <ArtistCard key={artist.id} artist={artist} variant="catalog" priority={i < 6} />
                        ))}
                    </div>
                </section>
            )}

            {/* Entre o primeiro e o segundo bloco: a página tem ~5.500px de rolagem
                no celular e não tinha anúncio nenhum (medido em 2026-09-17). */}
            {ADSENSE.slots.inline && streamingArtists.length > 0 && (
                <div className="mt-10">
                    <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="trending_feed" />
                </div>
            )}

            {trendingGroups.length > 0 && (
                <section className="mt-10">
                    <h2 className="text-lg font-bold text-foreground">Grupos em alta</h2>
                    <p className="mt-1 text-xs text-muted">Ordenado por trending score — atividade recente e engajamento do fandom.</p>
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
                        {trendingGroups.map(group => (
                            <GroupCard key={group.id} group={group} />
                        ))}
                    </div>
                </section>
            )}

            {trendingArtists.length > 0 && (
                <section className="mt-10">
                    <h2 className="text-lg font-bold text-foreground">Artistas em alta</h2>
                    <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                        {trendingArtists.map(artist => (
                            <ArtistCard key={artist.id} artist={artist} variant="catalog" />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
