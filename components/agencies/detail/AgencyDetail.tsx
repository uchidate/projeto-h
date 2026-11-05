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
import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
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
import { LojaEmLinha } from '@/components/ui/LojaEmLinha'
import { QuizFacts } from '@/components/ui/QuizFacts'


type Params = Promise<{ slug: string; locale?: Locale }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { slug, locale = DEFAULT_LOCALE } = await params
    return metadataDaAgencia(slug, locale)
}

export default async function AgencyDetailPage({ params }: { params: Params }) {
    const { slug, locale = DEFAULT_LOCALE } = await params
    const view = await carregarAgencia(slug, locale)
    if (!view) notFound()
    const ui = await getTranslations({ locale, namespace: 'entity.agency.ui' })
    // Blog, loja e quiz existem só em português: fora dele a ficha não os mostra.
    const soPt = locale === DEFAULT_LOCALE

    const {
        agency, name, logo, acf, accent, interfaceAccent, tierLabel, milestones, originYear, achievements,
        businessPillars, currentDevelopments, excerptText, pageUrl, network, allArtists, allGroups, relatedPosts,
        agencyVideos, narrativeChapters, keyMetrics, citedSources, sourcesByHost, breadcrumbSchema,
        navLinks, pageStyle, faqItems, editorialVisualStories, shopProducts,
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
                backHref={href('agencies', undefined, locale)}
                backLabel={ui('back')}
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
                        eyebrow={ui('mvEyebrow')}
                        title={ui('mvTitle', { name })}
                        description={ui('mvDescription')}
                    />
                )}

                {narrativeChapters.length === 0 && <AgencyAbout view={view} />}
                {narrativeChapters.length === 0 && achievements.length > 0 && <AgencyAchievements view={view} />}

                <AgencyOrganizationMap agency={agency} network={network} groups={allGroups} artists={allArtists} locale={locale} />

                {soPt && <LojaEmLinha products={shopProducts} bloco="agencia-ficha" contexto={`agencia:${slug}`} title={ui('shopTitle', { name })} />}

                {ADSENSE.slots.leaderboard && (allGroups.length > 0 || allArtists.length > 0) && (
                    <AdSlotInline
                        slot={ADSENSE.slots.leaderboard}
                        layout="leaderboard"
                        analyticsPlacement="agency_profile_leaderboard"
                    />
                )}

                {allGroups.length > 0 && <AgencyCatalog view={view} />}
                {allArtists.length > 0 && <AgencyArtists view={view} />}

                {soPt && relatedPosts.length > 0 && (
                    <section id="artigos" className="scroll-mt-(--scroll-anchor-offset,106px)">
                        <GroupPosts posts={relatedPosts} name={name} accent={interfaceAccent} />
                    </section>
                )}

                {soPt && <QuizFacts entitySlug={slug} entityType="agency" entityName={name} groupIds={allGroups.map(g => g.id)} artistIds={allArtists.map(a => a.id)} />}

                {narrativeChapters.length === 0 && milestones.length > 0 && (
                    <AgencyMilestones milestones={milestones} interfaceAccent={interfaceAccent} locale={locale} />
                )}

                <EntityFAQ
                    items={faqItems}
                    className="scroll-mt-(--scroll-anchor-offset,106px)"
                    title={ui('faqTitle', { name })}
                />

                {sourcesByHost.length > 0 && (
                    <AgencySources citedSourcesCount={citedSources.length} sourcesByHost={sourcesByHost} />
                )}
            </div>
        </div>
    )
}
