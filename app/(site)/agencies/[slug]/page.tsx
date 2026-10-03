import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { WpEditSetter } from '@/components/ui/WpEditContext'
import { ReadingBar } from '@/components/ui/ReadingBar'
import { JsonLd } from '@/components/seo/JsonLd'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { AgencyOrganizationMap } from '@/components/agency/AgencyOrganizationMap'
import { GroupPosts } from '@/components/groups/GroupPosts'
import { GroupMVPlayer } from '@/components/groups/GroupMVPlayer'
import { EntityFAQ } from '@/components/seo/EntityFAQ'
import { ADSENSE } from '@/lib/config/ads'
import { carregarAgencia } from './lib/carregarAgencia'
import { metadataDaAgencia } from './lib/metadata'
import { AgencyHero } from './components/AgencyHero'
import { AgencySummary } from './components/AgencySummary'
import { AgencyKeyMetrics } from './components/AgencyKeyMetrics'
import { AgencyJourneyNav } from './components/AgencyJourneyNav'
import { AgencyHistory } from './components/AgencyHistory'
import { AgencyVisualEssay } from './components/AgencyVisualEssay'
import { AgencyLensPanel } from './components/AgencyLensPanel'
import { AgencyBusinessModel } from './components/AgencyBusinessModel'
import { AgencyDevelopments } from './components/AgencyDevelopments'
import { AgencyAbout } from './components/AgencyAbout'
import { AgencyAchievements } from './components/AgencyAchievements'
import { AgencyCatalog } from './components/AgencyCatalog'
import { AgencyArtists } from './components/AgencyArtists'
import { AgencyMilestones } from './components/AgencyMilestones'
import { AgencySources } from './components/AgencySources'

export const revalidate = 3600

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { slug } = await params
    return metadataDaAgencia(slug)
}

export default async function AgencyDetailPage({ params }: { params: Params }) {
    const { slug } = await params
    const view = await carregarAgencia(slug)
    if (!view) notFound()

    const {
        agency, name, logo, acf, accent, interfaceAccent, tierLabel, milestones, originYear, achievements,
        businessPillars, currentDevelopments, excerptText, pageUrl, network, allArtists, allGroups, relatedPosts,
        agencyVideos, narrativeChapters, keyMetrics, citedSources, sourcesByHost, breadcrumbSchema,
        navLinks, pageStyle, faqItems, editorialVisualStories,
    } = view

    return (
        <div style={pageStyle}>
            <WpEditSetter postId={agency.id} postType="agency" />
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name,
                url: pageUrl,
                ...(excerptText ? { description: excerptText } : {}),
                ...(logo ? { logo: logo.src, image: logo.src } : {}),
                address: {
                    '@type': 'PostalAddress',
                    addressCountry: agency.country ?? 'KR',
                },
                ...(acf.website ? { sameAs: [acf.website] } : {}),
                ...(originYear ? { foundingDate: String(originYear) } : {}),
            }} />
            <JsonLd data={breadcrumbSchema} />

            <ReadingBar
                backHref="/agencies"
                backLabel="Agências"
                tagLabel={tierLabel ?? undefined}
                tagColor={accent}
                title={name}
                pageUrl={pageUrl}
                pageAnchors={navLinks}
            />

            <AgencyHero view={view} />

            <div className="page-wrap space-y-14 py-10 sm:space-y-16 sm:py-14">
                <AgencySummary view={view} />

                {keyMetrics.length >= 3 && (
                    <AgencyKeyMetrics name={name} keyMetrics={keyMetrics} />
                )}

                {narrativeChapters.length > 0 && <AgencyJourneyNav view={view} />}
                {narrativeChapters.length > 0 && <AgencyHistory view={view} />}
                {editorialVisualStories.length >= 2 && <AgencyVisualEssay view={view} />}

                <AgencyLensPanel view={view} />

                {ADSENSE.slots.inline && (
                    <AdSlotInline
                        slot={ADSENSE.slots.inline}
                        analyticsPlacement="agency_profile_mid"
                    />
                )}

                {businessPillars.length > 0 && <AgencyBusinessModel view={view} />}
                {currentDevelopments.length > 0 && <AgencyDevelopments view={view} />}

                {agencyVideos.length > 0 && (
                    <GroupMVPlayer
                        videos={agencyVideos}
                        accent={interfaceAccent}
                        eyebrow="Para ver e ouvir"
                        title={`Assista ao catálogo ligado à ${name}`}
                        description="Uma seleção de vídeos oficiais dos grupos relacionados ajuda a perceber, em imagem e som, a variedade de identidades que convivem sob a mesma estrutura corporativa."
                    />
                )}

                {narrativeChapters.length === 0 && <AgencyAbout view={view} />}
                {narrativeChapters.length === 0 && achievements.length > 0 && <AgencyAchievements view={view} />}

                <AgencyOrganizationMap agency={agency} network={network} groups={allGroups} artists={allArtists} />

                {ADSENSE.slots.leaderboard && (allGroups.length > 0 || allArtists.length > 0) && (
                    <AdSlotInline
                        slot={ADSENSE.slots.leaderboard}
                        layout="leaderboard"
                        analyticsPlacement="agency_profile_leaderboard"
                    />
                )}

                {allGroups.length > 0 && <AgencyCatalog view={view} />}
                {allArtists.length > 0 && <AgencyArtists view={view} />}

                {relatedPosts.length > 0 && (
                    <section id="artigos" className="scroll-mt-(--scroll-anchor-offset,106px)">
                        <GroupPosts posts={relatedPosts} name={name} accent={interfaceAccent} />
                    </section>
                )}

                {narrativeChapters.length === 0 && milestones.length > 0 && (
                    <AgencyMilestones milestones={milestones} interfaceAccent={interfaceAccent} />
                )}

                <EntityFAQ
                    items={faqItems}
                    className="scroll-mt-(--scroll-anchor-offset,106px)"
                    title={`Perguntas rápidas sobre ${name}`}
                />

                {sourcesByHost.length > 0 && (
                    <AgencySources citedSourcesCount={citedSources.length} sourcesByHost={sourcesByHost} />
                )}
            </div>
        </div>
    )
}
