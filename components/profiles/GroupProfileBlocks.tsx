import type { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { WPAgency, WPArtist, WPGroup, WPPost } from '@/lib/wordpress/types'
import type { GroupProfileModel } from '@/lib/profiles/groupProfile'
import type { DiscographyAlbum } from '@/components/groups/GroupDiscography'
import type { EntityFAQItem } from '@/components/seo/EntityFAQ'
import { adensarAnuncios, type ProfileEntry } from './ProfileSection'
import { formatDate, getWPImage, getYear, slugify, stripHtml } from '@/lib/utils'
import { highlightProse } from '@/lib/profiles/highlightProse'
import { labelsFor } from '@/lib/i18n/labels'
import { intlLocale } from '@/lib/i18n/format'
import type { Locale } from '@/lib/i18n/config'
import { ADSENSE } from '@/lib/config/ads'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { CollapsibleProse } from './CollapsibleProse'
import { EntityFAQ } from '@/components/seo/EntityFAQ'
import { GroupColorIdentity } from '@/components/groups/GroupColorIdentity'
import { GroupDiscography } from '@/components/groups/GroupDiscography'
import { GroupEditorialAnalysis } from '@/components/groups/GroupEditorialAnalysis'
import { GroupFactsTabbed } from '@/components/groups/GroupFactsTabbed'
import { GroupMemberCard } from '@/components/groups/GroupMemberCard'
import { GroupMembersTable } from '@/components/groups/GroupMembersTable'
import { linhasIntegrantes, listaDeNomes } from '@/lib/seo/integrantes'
import { GroupMemberVote } from '@/components/groups/GroupMemberVote'
import { toMemberSummary } from '@/lib/artists/memberSummary'
import { GroupMVPlayer } from '@/components/groups/GroupMVPlayer'
import { GroupPosts } from '@/components/groups/GroupPosts'
import { GroupRelatedGroups } from '@/components/groups/GroupRelatedGroups'
import { GroupSocialPresence } from '@/components/groups/GroupSocialPresence'
import { GroupSpotifyEmbed } from '@/components/groups/GroupSpotifyEmbed'
import { GroupStatsNumbers } from '@/components/groups/GroupStatsNumbers'
import { GroupStoryChapters } from '@/components/groups/GroupStoryChapters'
import { GroupKeyMetrics } from '@/components/groups/GroupKeyMetrics'
import { GroupEraRail } from '@/components/groups/GroupEraRail'
import { GroupPullQuote } from '@/components/groups/GroupPullQuote'
import { GroupSectionHeading } from '@/components/groups/GroupSectionHeading'
import { FactGrid, type FactItem } from '@/components/blocks/FactGrid'
import { EntityOrganizationTrail } from '@/components/agency/EntityOrganizationTrail'
import type { EntityOrganizationContext } from '@/lib/agencies/network'

type GroupProfileBlocksContext = {
    group: WPGroup
    model: GroupProfileModel
    members: WPArtist[]
    activeMembers: WPArtist[]
    formerMembers: WPArtist[]
    formerSemFicha: { slug: string; name: string }[]
    memberPositions: Record<string, string[]>
    relatedPosts: WPPost[]
    relatedGroups: WPGroup[]
    discography: DiscographyAlbum[]
    agency?: WPAgency
    agencyName: string | null
    organizationContext?: EntityOrganizationContext
    faqItems: EntityFAQItem[]
    t: ReturnType<typeof useTranslations<'profile'>>
    locale: Locale
}

const anchorClass = 'scroll-mt-(--scroll-anchor-offset,106px)'

export function buildGroupProfileEntries({
    group, model, members, activeMembers, formerMembers, formerSemFicha, memberPositions,
    relatedPosts, relatedGroups, discography, agency, agencyName, organizationContext, faqItems, t, locale,
}: GroupProfileBlocksContext): ProfileEntry[] {
    const { name, acf, contentBefore, contentAfter, accent, socialEntries, videoList,
        hasBio, hasColor, hasFacts, hasStats, hasEditorial, generation } = model

    // Conta também os ex sem ficha no CPT: só formerMembers deixaria de fora quem
    // não tem post (Ricky, no ZB1), e o cartão divergia do FAQ na mesma página.
    const totalEx = formerMembers.length + formerSemFicha.length

    // Linhas da tabela idade/posição e da frase-resposta (só integrantes ativos).
    const linhasAtivos = linhasIntegrantes(activeMembers.map(toMemberSummary), memberPositions)

    const factItems: FactItem[] = [
        acf.type && { label: t('blocks.fact.type'), value: labelsFor(locale).groupType(acf.type) },
        acf.debut_date && { label: t('blocks.fact.debut'), value: formatDate(acf.debut_date, intlLocale(locale)) },
        agencyName && { label: t('blocks.fact.agency'), value: agency
            ? <Link href={`/agencies/${agency.slug}`} className="touch-target -my-2 inline-flex items-center hover:text-accent">{agencyName}</Link>
            : agencyName },
        members.length > 0 && { label: t('blocks.fact.lineup'), value: t('blocks.fact.activeMembers', { count: activeMembers.length }), description: totalEx > 0 ? t('blocks.fact.formerMembers', { count: totalEx }) : undefined },
        acf.fandom_name && { label: t('blocks.fact.fandom'), value: <Link href={`/fandoms/${slugify(acf.fandom_name)}`} className="touch-target -my-2 inline-flex items-center hover:underline" style={{ color: accent }}>{acf.fandom_name}</Link> },
        generation && { label: t('blocks.fact.generation'), value: generation },
    ].filter(Boolean) as FactItem[]

    const storyChapters = acf.story_chapters ?? []
    const keyMetrics = (acf.key_metrics ?? []).filter(metric => metric.value && metric.label)
    const groupPortrait = getWPImage(group._embedded, group.featured_image_url, stripHtml(group.title.rendered))
    const debutYear = getYear(acf.debut_date)

    // Citação de capa: a primeira disponível na ordem cronológica dos capítulos —
    // abre a leitura com a origem da história, não com o ponto mais "citável".
    const spotlightChapter = storyChapters.find(chapter => chapter.quote_text && chapter.quote_author)

    return adensarAnuncios([
        ...(spotlightChapter ? [{
            key: 'pull-quote', interstitial: <GroupPullQuote
                quote={spotlightChapter.quote_text!}
                author={spotlightChapter.quote_author!}
                context={spotlightChapter.quote_context}
                sourceUrl={spotlightChapter.quote_source_url}
                accent={accent}
            />,
        }] : []),
        {
            id: 'sobre', nav: t('blocks.nav.profile'), present: hasBio, layout: 'self', indexed: true,
            render: label => <section id="sobre" className={`${anchorClass} group-bio`} aria-labelledby="sobre-titulo">
                <GroupSectionHeading id="sobre-titulo" eyebrow={label || undefined} title={t('blocks.groupWhoTitle', { name })} accent={accent} />
                {acf.name_meaning && (
                    <figure className="relative mb-6 overflow-hidden border border-border bg-surface p-5 sm:p-6">
                        {acf.name_hangul && (
                            <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-8 select-none whitespace-nowrap font-black leading-none text-foreground opacity-[0.05] text-[92px] sm:text-[120px]">
                                {acf.name_hangul}
                            </span>
                        )}
                        <figcaption className="font-mono text-[9px] font-black uppercase tracking-[0.16em]" style={{ color: accent }}>
                            O nome {name}
                        </figcaption>
                        <p className="relative mt-2.5 max-w-xl font-serif text-lg font-bold leading-snug tracking-[-0.02em] text-foreground/90 sm:text-[21px]">
                            {acf.name_meaning}
                        </p>
                    </figure>
                )}
                <div className="profile-prose prose prose-base max-w-none prose-headings:font-black prose-a:text-accent prose-a:no-underline dark:prose-invert prose-a:hover:underline" dangerouslySetInnerHTML={{ __html: highlightProse(contentBefore, name) }} />
                {contentAfter && <CollapsibleProse label={t('blocks.continueReading')}><div className="profile-prose prose prose-base max-w-none prose-headings:font-black prose-a:text-accent dark:prose-invert" dangerouslySetInnerHTML={{ __html: highlightProse(contentAfter, name) }} /></CollapsibleProse>}
            </section>,
        },
        { id: 'analise', nav: t('blocks.nav.reading'), present: hasEditorial, layout: 'self', numbered: false, render: () => <GroupEditorialAnalysis content={group.editorial_analysis!} accent={accent} groupName={name} /> },
        {
            id: 'trajetoria', nav: t('blocks.nav.story'), present: storyChapters.length > 0, layout: 'self', weight: 'spine', numbered: false,
            render: () => <section id="trajetoria" className={`${anchorClass} space-y-4`} aria-labelledby="trajetoria-titulo">
                <GroupSectionHeading id="trajetoria-titulo" eyebrow={t('blocks.dossier')} title={t('blocks.groupStoryTitle')} accent={accent} />
                <GroupEraRail chapters={storyChapters} accent={accent} groupName={name} />
                <GroupStoryChapters chapters={storyChapters} accent={accent} groupName={name} portrait={groupPortrait ? { src: groupPortrait.src, alt: groupPortrait.alt || name } : null} debutYear={debutYear} />
            </section>,
        },
        // O dossiê de capítulos é o trecho mais longo do início do perfil — em
        // grupos com carreira extensa (5+ capítulos) o leitor rola por vários
        // recordes de tela sem nenhum anúncio até o inline pós-"membros". Só
        // entra com essa densidade para não empilhar num perfil esparso.
        ...(ADSENSE.slots.inline && storyChapters.length >= 5
            ? [{ key: 'story-feed-ad', interstitial: <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="group_story_feed" /> }]
            : []),
        {
            id: 'recordes', nav: t('blocks.nav.records'), present: keyMetrics.length >= 3, layout: 'self', weight: 'reference', numbered: false,
            render: () => <section id="recordes" className={anchorClass} aria-labelledby="recordes-titulo">
                <GroupSectionHeading id="recordes-titulo" eyebrow={t('blocks.verified')} title={t('blocks.groupRecordsTitle')} accent={accent} />
                <GroupKeyMetrics metrics={keyMetrics} accent={accent} />
            </section>,
        },
        { id: 'ficha', nav: t('blocks.nav.facts'), present: factItems.length > 0, layout: 'self', weight: 'reference', numbered: false, render: () => <section id="ficha" className={anchorClass}><GroupSectionHeading id="ficha-titulo" eyebrow={t('blocks.verified')} title={t('blocks.groupFactsTitle')} accent={accent} /><FactGrid items={factItems} columns={3} /></section> },
        { id: 'gestao', nav: t('blocks.nav.management'), present: Boolean(organizationContext?.nodes.length), layout: 'self', weight: 'reference', numbered: false, render: () => <section id="gestao" className={anchorClass}><GroupSectionHeading id="gestao-titulo" eyebrow={t('blocks.corporate')} title={t('blocks.groupManagementTitle')} accent={accent} /><EntityOrganizationTrail context={organizationContext!} /></section> },
        {
            id: 'membros', nav: t('blocks.nav.members'), present: members.length > 0 || formerSemFicha.length > 0, layout: 'self', indexed: true,
            render: label => <section id="membros" className={anchorClass}>
                <GroupSectionHeading id="membros-titulo" eyebrow={label || undefined} title={totalEx > 0 ? t('blocks.groupMembersTitleWithFormer', { active: activeMembers.length, former: totalEx }) : t('blocks.groupMembersTitle', { count: members.length })} accent={accent} />
                {/* Resposta direta no topo: é o formato que o Google extrai para "membros do X". */}
                {linhasAtivos.length > 0 && <p className="mb-6 max-w-[62ch] text-[0.98rem] leading-7 text-foreground-subtle">
                    {t('blocks.membersSummary', { group: name, count: linhasAtivos.length, names: listaDeNomes(linhasAtivos.map(l => l.nome), locale === 'en' ? 'and' : 'e') })}
                </p>}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{activeMembers.map(member => <GroupMemberCard key={member.id} member={toMemberSummary(member)} accent={accent} positions={memberPositions[member.slug]} />)}</div>
                <GroupMembersTable groupName={name} linhas={linhasAtivos} />
                {totalEx > 0 && <div className="mt-6">
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted mb-3">Ex-integrantes · {totalEx}</p>
                    {formerMembers.length > 0 && <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{formerMembers.map(member => <GroupMemberCard key={member.id} member={toMemberSummary(member)} accent={accent} positions={memberPositions[member.slug]} isFormer />)}</div>}
                    {formerSemFicha.length > 0 && <p className={`text-[13px] leading-relaxed text-muted ${formerMembers.length > 0 ? 'mt-4' : ''}`}>{formerSemFicha.map(e => e.name).join(' · ')}</p>}
                </div>}
            </section>,
        },
        ...(ADSENSE.slots.inline && storyChapters.length < 5
            ? [{ key: 'inline-ad', interstitial: <AdSlotInline slot={ADSENSE.slots.inline} analyticsPlacement="group_profile_mid" /> }]
            : []),
        // Mesmo ponto do `artist_reference_top` (52% de preenchimento): começo do
        // material de consulta, onde o perfil de grupo não tinha nenhum anúncio
        // até o fim da página.
        ...(ADSENSE.slots.leaderboard ? [{ key: 'reference-leaderboard', interstitial: <AdSlotInline slot={ADSENSE.slots.leaderboard} layout="leaderboard" analyticsPlacement="group_reference_top" /> }] : []),
        { id: 'numeros', nav: t('blocks.nav.numbers'), present: hasStats, layout: 'self', weight: 'reference', numbered: false, render: () => <section id="numeros" className={anchorClass}><GroupSectionHeading id="numeros-titulo" eyebrow={t('blocks.metrics')} title={t('blocks.groupNumbersTitle')} accent={accent} /><GroupStatsNumbers stats={group.stats!} accent={accent} /></section> },
        { id: 'discografia', nav: t('blocks.nav.albums'), present: discography.length > 0, layout: 'self', weight: 'reference', numbered: false, render: () => <section id="discografia" className={anchorClass}><GroupDiscography albums={discography} accent={accent} /></section> },
        { id: 'videos', nav: t('blocks.nav.videos'), present: videoList.length > 0, layout: 'self', weight: 'reference', numbered: false, render: () => <section id="videos" className={anchorClass}><GroupMVPlayer videos={videoList} accent={accent} /></section> },
        ...(acf.spotify ? [{ key: 'spotify', interstitial: <GroupSpotifyEmbed spotifyUrl={acf.spotify} name={name} accent={accent} /> }] : []),
        { id: 'conquistas', nav: t('blocks.nav.milestones'), present: hasFacts, layout: 'self', numbered: false, render: () => <GroupFactsTabbed curiosidades={acf.curiosidades!} accent={accent} groupName={name} /> },
        { id: 'identidade', nav: t('blocks.nav.identity'), present: hasColor, layout: 'self', weight: 'reference', numbered: false, render: () => <section id="identidade" className={anchorClass}><GroupSectionHeading id="identidade-titulo" eyebrow={t('blocks.identity')} title={t('blocks.groupColorTitle')} accent={accent} /><GroupColorIdentity officialColor={acf.color!} groupName={name} fanClubName={acf.fandom_name} /></section> },
        { id: 'redes', nav: t('blocks.nav.channels'), present: socialEntries.length > 0, layout: 'self', weight: 'reference', numbered: false, render: () => <section id="redes" className={anchorClass}><GroupSocialPresence entries={socialEntries} accent={accent} groupName={name} /></section> },
        { id: 'votacao', nav: t('blocks.nav.fans'), present: members.length > 1, layout: 'self', weight: 'reference', numbered: false, render: () => <GroupMemberVote members={members.map(toMemberSummary)} accent={accent} groupName={name} groupSlug={group.slug} /> },
        // Leitor decidindo o próximo grupo: equivalente ao `artist_discovery`,
        // que preenche 71%.
        ...(ADSENSE.slots.inline && relatedGroups.length > 0 ? [{ key: 'discovery-ad', interstitial: <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="group_discovery" /> }] : []),
        { id: 'relacionados', nav: t('blocks.nav.next'), present: relatedGroups.length > 0, layout: 'self', numbered: false, render: () => <section id="relacionados" className={anchorClass}><GroupRelatedGroups groups={relatedGroups} accent={accent} agencyName={agencyName} /></section> },
        { id: 'artigos', nav: t('blocks.nav.articles'), present: relatedPosts.length > 0, layout: 'self', numbered: false, render: () => <section id="artigos" className={anchorClass}><GroupPosts posts={relatedPosts} name={name} accent={accent} /></section> },
        { id: 'faq', nav: t('blocks.nav.essentials'), present: faqItems.length > 0, layout: 'self', weight: 'reference', numbered: false, render: () => <EntityFAQ items={faqItems} className={anchorClass} eyebrow={t('faqDefaults.eyebrow')} title={t('blocks.essentialsTitle', { name })} /> },
    ], indice => ADSENSE.slots.inline
        ? <div className="page-wrap"><AdSlotInline slot={ADSENSE.slots.inline} layout="content" analyticsPlacement="group_densidade" key={indice} /></div>
        : null)
}
