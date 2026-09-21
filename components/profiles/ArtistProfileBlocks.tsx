import type { WPAgency, WPArtist, WPGroup, WPPost, WPProduction } from '@/lib/wordpress/types'
import type { ArtistProfileModel } from '@/lib/profiles/artistProfile'
import type { DiscographyAlbum } from '@/components/groups/GroupDiscography'
import type { EntityFAQItem } from '@/components/seo/EntityFAQ'
import { grafiasAlternativas } from '@/lib/seo/grafias'
import { adensarAnuncios, type ProfileEntry } from './ProfileSection'
import type { useTranslations } from 'next-intl'
import { ADSENSE } from '@/lib/config/ads'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ArtistAwards } from '@/components/artists/ArtistAwards'
import { ArtistBiography } from '@/components/artists/ArtistBiography'
import { ArtistCinematicMoment } from '@/components/artists/ArtistCinematicMoment'
import { ArtistEssencia } from '@/components/artists/ArtistEssencia'
import { ArtistFilmography } from '@/components/artists/ArtistFilmography'
import { ArtistGroups } from '@/components/artists/ArtistGroups'
import { ArtistPremiumGateway } from '@/components/artists/ArtistPremiumGateway'
import { ArtistPosts } from '@/components/artists/ArtistPosts'
import { ArtistRelatedArtists } from '@/components/artists/ArtistRelatedArtists'
import { ArtistTimeline } from '@/components/artists/ArtistTimeline'
import { EntityFAQ } from '@/components/seo/EntityFAQ'
import { GroupDiscography } from '@/components/groups/GroupDiscography'
import { GroupMVPlayer } from '@/components/groups/GroupMVPlayer'
import { GroupSocialPresence } from '@/components/groups/GroupSocialPresence'
import { GroupSpotifyEmbed } from '@/components/groups/GroupSpotifyEmbed'
import { GroupTrophyWall } from '@/components/groups/GroupTrophyWall'
import { GroupEraRail } from '@/components/groups/GroupEraRail'
import { GroupStoryChapters } from '@/components/groups/GroupStoryChapters'
import { GroupKeyMetrics } from '@/components/groups/GroupKeyMetrics'
import { GroupPullQuote } from '@/components/groups/GroupPullQuote'
import { GroupSectionHeading } from '@/components/groups/GroupSectionHeading'
import { GroupEditorialAnalysis } from '@/components/groups/GroupEditorialAnalysis'
import { FactGrid } from '@/components/blocks/FactGrid'

type ArtistProfileBlocksContext = {
    model: ArtistProfileModel
    productions: WPProduction[]
    groups: WPGroup[]
    discography: DiscographyAlbum[]
    relatedArtists: WPArtist[]
    relatedPosts: WPPost[]
    agency?: WPAgency
    connectionGroup?: WPGroup
    faqItems: EntityFAQItem[]
    categoryMap?: Record<number, { name: string; slug: string }>
    portrait?: { src: string; alt: string } | null
    t: ReturnType<typeof useTranslations<'profile'>>
}

const anchorClass = 'scroll-mt-(--scroll-anchor-offset,106px)'

export function buildArtistProfileEntries({
    model, productions, groups, discography, relatedArtists, relatedPosts,
    agency, connectionGroup, faqItems, categoryMap, portrait, t,
}: ArtistProfileBlocksContext): ProfileEntry[] {
    const {
        name, acf, contentBefore, contentAfter, age, zodiac, roleLabels,
        socialEntries, curiosidades, awards, milestones, essencia, videoList,
        quickFacts, biographyFacts, hasBio, hasEssencia, hasCuriosidades,
        hasAwards, hasMilestones, storyChapters, keyMetrics, accent, debutYear, deathYear,
        hasStoryChapters, hasKeyMetrics, careerStatement, careerStatementSub,
        editorialAnalysis, bioQuote,
    } = model

    // Citação de capa: primeiro capítulo com fonte de citação, na ordem cronológica —
    // mesma regra dos grupos, evita puxar conteúdo sensível para o destaque visual.
    const spotlightChapter = storyChapters.find(chapter => chapter.quote_text && chapter.quote_author)

    return adensarAnuncios([
        // Abertura: o momento cinematográfico é o primeiro "uau" visual da página —
        // decide se quem chega fica. Vem antes de qualquer parágrafo de texto. A citação
        // de capa entra no mesmo bloco (quando os dois existem) em vez de abrir uma
        // segunda seção escura logo em seguida.
        ...(careerStatement ? [{
            key: 'cinematic-moment',
            interstitial: <div className="page-wrap"><ArtistCinematicMoment
                statement={careerStatement} sub={careerStatementSub ?? undefined} accent={accent}
                quote={spotlightChapter?.quote_text} quoteAuthor={spotlightChapter?.quote_author}
                quoteContext={spotlightChapter?.quote_context} quoteSourceUrl={spotlightChapter?.quote_source_url}
            /></div>,
        }] : []),
        ...(spotlightChapter && !careerStatement ? [{
            key: 'pull-quote', interstitial: <div className="page-wrap"><GroupPullQuote
                quote={spotlightChapter.quote_text!}
                author={spotlightChapter.quote_author!}
                context={spotlightChapter.quote_context}
                sourceUrl={spotlightChapter.quote_source_url}
                accent={accent}
            /></div>,
        }] : []),
        {
            id: 'biografia', nav: t('blocks.nav.profile'), present: hasBio,
            render: label => <ArtistBiography name={name} label={label} contentBefore={contentBefore}
                contentAfter={contentAfter} facts={biographyFacts} age={age} zodiac={zodiac} roleLabels={roleLabels}
                accent={accent} bioQuote={bioQuote} />,
        },
        {
            id: 'analise', nav: t('blocks.nav.analysis'), present: !!editorialAnalysis, layout: 'self', numbered: false,
            render: () => <section className="page-wrap py-(--profile-section-block-compact) lg:pl-[calc(2.5rem+9.5rem+2.5rem)]"><GroupEditorialAnalysis content={editorialAnalysis!} accent={accent} groupName={name} /></section>,
        },
        ...(!hasBio && quickFacts.length > 0 ? [{
            key: 'quick-facts', interstitial: (
                <div className="page-wrap py-8">
                    <FactGrid items={quickFacts.map(([label, value]) => ({ label, value }))} columns={4} className="mb-8" />
                    {ADSENSE.slots.inline && (
                        <AdSlotInline
                            slot={ADSENSE.slots.inline}
                            layout="content"
                            analyticsPlacement="artist_facts"
                        />
                    )}
                </div>
            ),
        }] : []),
        // A trajetória é o coração editorial do perfil — entra logo após bio/análise,
        // antes dos blocos de referência (filmografia, grupos, players), para que quem
        // rola a página encontre a história antes dos módulos de consulta.
        {
            id: 'trajetoria', nav: t('blocks.nav.story'), present: hasStoryChapters, layout: 'self', numbered: false,
            // Espinha: é a matéria que justifica a página. Respiro amplo separa a
            // história dos blocos de consulta que vêm depois.
            render: () => <section id="trajetoria" className={`${anchorClass} page-wrap space-y-6 py-(--profile-section-spine) lg:pl-[calc(2.5rem+9.5rem+2.5rem)]`} aria-labelledby="trajetoria-titulo">
                <GroupSectionHeading id="trajetoria-titulo" eyebrow={t('blocks.dossier')} title={t('blocks.artistStoryTitle', { name })} accent={accent} />
                <GroupEraRail chapters={storyChapters} accent={accent} groupName={name} />
                {/* O momento cinematográfico deixou de usar retrato (era recorte
                    decorativo), então a foto volta aqui, onde ganha legenda e contexto. */}
                <GroupStoryChapters chapters={storyChapters} accent={accent} groupName={name} portrait={portrait ?? null} debutYear={debutYear} endYear={deathYear} />
            </section>,
        },
        {
            id: 'recordes', nav: t('blocks.nav.records'), present: hasKeyMetrics, layout: 'self', numbered: false,
            render: () => <section id="recordes" className={`${anchorClass} page-wrap lg:pl-[calc(2.5rem+9.5rem+2.5rem)]`} aria-labelledby="recordes-titulo">
                <GroupSectionHeading id="recordes-titulo" eyebrow={t('blocks.verified')} title={t('blocks.artistRecordsTitle')} accent={accent} />
                <GroupKeyMetrics metrics={keyMetrics} accent={accent} />
            </section>,
        },
        {
            // Com dossiê rico (trajetória), os marcos soltos viram repetição do mesmo
            // conteúdo em formato inferior — só aparecem para quem ainda não tem dossiê.
            id: 'marcos', nav: t('blocks.nav.milestones'), present: hasMilestones && !hasStoryChapters, render: label => <ArtistTimeline milestones={milestones} eyebrow={label} accent={accent} />,
        },
        { id: 'premios', nav: t('blocks.nav.awards'), present: hasAwards, render: label => <ArtistAwards awards={awards} eyebrow={label} accent={accent} /> },
        ...(ADSENSE.slots.inline && hasStoryChapters ? [{
            key: 'story-feed-ad',
            interstitial: (
                <div className="border-t border-border/40 page-wrap">
                    <AdSlotInline slot={ADSENSE.slots.inline} layout="content" analyticsPlacement="artist_story_feed" />
                </div>
            ),
        }] : []),
        // Daqui em diante: consulta e navegação — quem já leu a história busca
        // referência (leitura rápida, obras, grupo, players) e conteúdo relacionado.
        {
            id: 'guia', nav: t('blocks.nav.start'), present: !!essencia.portaEntrada || groups.length > 0 || productions.length > 0 || discography.length > 0 || relatedPosts.length > 0, layout: 'self', numbered: false,
            render: () => <section className="page-wrap py-(--profile-section-block-compact) lg:pl-[calc(2.5rem+9.5rem+2.5rem)]"><ArtistPremiumGateway name={name} essencia={essencia} groups={groups} productions={productions} discography={discography} relatedPosts={relatedPosts} accent={accent} /></section>,
        },
        { id: 'essencia', nav: t('blocks.nav.reading'), present: hasEssencia, render: label => <ArtistEssencia eyebrow={label} accent={accent} {...essencia} /> },
        { id: 'filmografia', nav: t('blocks.nav.works'), present: productions.length > 0, render: label => <ArtistFilmography productions={productions} label={label} accent={accent} artistName={name} alternativas={grafiasAlternativas(name)} /> },
        { id: 'grupos', nav: t('blocks.nav.groups'), present: groups.length > 0, render: label => <ArtistGroups groups={groups} artistName={name} label={label} accent={accent} /> },
        // Entre a filmografia e a música, no meio de fichas longas.
        //
        // Medido em 2026-09-17: numa ficha de 16.000px no celular, o primeiro
        // anúncio ficava aos 12% e o seguinte só aos 47% — um terço da página
        // rolada sem nada. Este slot entra nesse vazio, e só em ficha que
        // realmente é longa (tem trajetória e filmografia).
        ...(ADSENSE.slots.inline && hasStoryChapters && productions.length > 0 ? [{
            key: 'meio-ficha',
            interstitial: (
                <div className="page-wrap">
                    <AdSlotInline slot={ADSENSE.slots.inline} layout="content" analyticsPlacement="artist_mid_scroll" />
                </div>
            ),
        }] : []),
        // Clipes, álbuns e Spotify eram três seções consecutivas, cada uma com seu
        // próprio cabeçalho "Dossiê", somando ~1.870px de rolagem para dizer a
        // mesma coisa: a música. Viram um bloco só, com três âncoras de navegação
        // a menos e um único respiro de seção em vez de três.
        {
            id: 'musica', weight: 'reference', numbered: false, nav: t('blocks.nav.music'),
            present: videoList.length > 0 || discography.length > 0 || !!acf.spotify,
            render: () => (
                <div className="space-y-10">
                    {videoList.length > 0 && <GroupMVPlayer videos={videoList} accent={accent} />}
                    {discography.length > 0 && <GroupDiscography albums={discography} accent={accent} />}
                    {acf.spotify && <GroupSpotifyEmbed spotifyUrl={acf.spotify} name={name} accent={accent} />}
                </div>
            ),
        },
        // Bloco de referência (música em diante) não tinha nenhum slot: os 4
        // existentes ficavam todos na primeira metade da página. Quem chega aqui
        // já rolou ~9.000px — audiência qualificada que não era monetizada.
        // Leaderboard porque é formato baixo e funciona como separador editorial
        // entre a matéria e o material de consulta.
        ...(ADSENSE.slots.leaderboard ? [{
            key: 'reference-leaderboard',
            interstitial: (
                <div className="page-wrap">
                    <AdSlotInline
                        slot={ADSENSE.slots.leaderboard}
                        layout="leaderboard"
                        analyticsPlacement="artist_reference_top"
                    />
                </div>
            ),
        }] : []),
        ...(!hasStoryChapters && ADSENSE.slots.inline ? [{
            key: 'inline-ad',
            interstitial: (
                <div className="border-t border-border/40 page-wrap">
                    <AdSlotInline
                        slot={ADSENSE.slots.inline}
                        layout="content"
                        analyticsPlacement="artist_profile_mid"
                    />
                </div>
            ),
        }] : []),
        { id: 'curiosidades', numbered: false, nav: t('blocks.nav.notes'), present: hasCuriosidades, render: () => <GroupTrophyWall curiosidades={curiosidades} accent={accent} groupName={name} shownMetricValues={keyMetrics.map(m => m.value)} /> },
        {
            id: 'redes', weight: 'reference', numbered: false, nav: t('blocks.nav.channels'), present: socialEntries.length > 0,
            render: () => <GroupSocialPresence entries={socialEntries.map(s => ({ key: s.key === 'x' ? 'twitter' : s.key, href: s.url, label: s.label }))} accent={accent} groupName={name} />,
        },
        {
            id: 'relacionados', nav: t('blocks.nav.next'), present: relatedArtists.length > 0,
            render: label => <ArtistRelatedArtists artists={relatedArtists} label={label} connectionGroup={connectionGroup} agency={agency} artistName={name} />,
        },
        // Entre "próximo artista" e "leituras": o leitor está em modo de descoberta,
        // decidindo para onde ir. Único ponto do bloco final com intenção alta.
        ...(ADSENSE.slots.inline && relatedArtists.length > 0 ? [{
            key: 'discovery-ad',
            interstitial: (
                <div className="page-wrap">
                    <AdSlotInline
                        slot={ADSENSE.slots.inline}
                        layout="feed"
                        analyticsPlacement="artist_discovery"
                    />
                </div>
            ),
        }] : []),
        { id: 'artigos', nav: t('blocks.nav.articles'), present: relatedPosts.length > 0, render: label => <ArtistPosts posts={relatedPosts} label={label} artistName={name} categoryMap={categoryMap} /> },
        {
            id: 'faq', numbered: false, nav: t('blocks.nav.essentials'), present: faqItems.length > 0,
            render: () => <EntityFAQ items={faqItems} unwrapped eyebrow={t('faqDefaults.eyebrow')} title={t('blocks.essentialsTitle', { name })} />,
        },
    ], indice => ADSENSE.slots.inline
        ? <div className="page-wrap"><AdSlotInline slot={ADSENSE.slots.inline} layout="content" analyticsPlacement="artist_densidade" key={indice} /></div>
        : null)
}
