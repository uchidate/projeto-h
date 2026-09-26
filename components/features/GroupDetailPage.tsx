import Link from 'next/link'
import { juntarSameAs, urlWikipedia } from '@/lib/seo/entidade'
import { useLocale, useTranslations } from 'next-intl'
import { href } from '@/lib/i18n/routes'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import type { WPGroup, WPArtist, WPPost, WPAgency } from '@/lib/wordpress/types'
import type { ArchiveHub } from '@/lib/guias/types'
import { getWPImage, stripHtml, parseAcfDate } from '@/lib/utils'
import { formatDate } from '@/lib/i18n/format'
import { firstSentence } from '@/lib/seo/firstSentence'
import { SITE_URL } from '@/lib/constants/site'
import { JsonLd } from '@/components/seo/JsonLd'
import type { DiscographyAlbum } from '@/components/groups/GroupDiscography'
import { GroupHero } from '@/components/groups/GroupHero'
import { POSITION_LABELS } from '@/lib/constants/positions'
import { GroupSidebarFicha } from '@/components/groups/GroupSidebarFicha'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { ReadingBar } from '@/components/ui/ReadingBar'
import { QuizWidget } from '@/components/ui/QuizWidget'
import { QuizFacts } from '@/components/ui/QuizFacts'
import type { EntityFAQItem } from '@/components/seo/EntityFAQ'
import { renderProfileEntries } from '@/components/profiles/ProfileSection'
import { buildGroupProfileModel, countActiveMembers } from '@/lib/profiles/groupProfile'
import { buildGroupProfileEntries } from '@/components/profiles/GroupProfileBlocks'
import type { EntityOrganizationContext } from '@/lib/agencies/network'
import { toRgba } from '@/lib/theme/color'
import { ProfileProseStyles } from '@/components/profiles/ProfileProseStyles'
import { GroupFichaC } from '@/components/groups/GroupFichaC'
import { isInterstitial } from '@/components/profiles/ProfileSection'
import { variantePorId } from '@/lib/experimento'

interface Props {
    group: WPGroup
    members?: WPArtist[]
    relatedPosts?: WPPost[]
    agency?: WPAgency
    organizationContext?: EntityOrganizationContext
    relatedGroups?: WPGroup[]
    discography?: DiscographyAlbum[]
    relatedHubs?: ArchiveHub[]
}

export function GroupDetailPage({ group, members = [], relatedPosts = [], agency, organizationContext, relatedGroups = [], discography = [], relatedHubs = [] }: Props) {
    const t = useTranslations('profile')
    const tEntity = useTranslations('entity')
    const tC = useTranslations('profile.groupC')
    const locale = useLocale()
    const model = buildGroupProfileModel(group, undefined, locale)
    const {
        name, acf, memberCount, year, disbandYear,
        accent, yearsActive, generation, socialEntries, hasBio,
    } = model
    const image = getWPImage(group._embedded, group.featured_image_url, name)
    const groupUrl = `${SITE_URL}${href('group', { slug: group.slug }, locale)}`

    const agencyName = agency ? stripHtml(agency.title.rendered) : null

    const { formerEntries } = model
    const formerSlugs = new Set(formerEntries.map(e => e.slug))
    const memberPositions = group.member_positions ?? {}
    const activeMembers = members.filter(m => !formerSlugs.has(m.slug))
    const formerMembers = members.filter(m => formerSlugs.has(m.slug))
    // Ex-integrante sem ficha no CPT: entra como nome, não como card com link.
    const carregados = new Set(members.map(m => m.slug))
    const formerSemFicha = formerEntries.filter(e => !carregados.has(e.slug))
    const activeCount = countActiveMembers(members.map(m => m.slug), [...formerSlugs], memberCount)

    // Respostas diretas às buscas reais do GSC ("em que ano o meovv debutou",
    // "empresa do meovv", "quantos integrantes"). O texto antigo de "quem é"
    // ("é apresentado no site em um perfil...") não respondia nada.
    const bioLead = firstSentence(stripHtml(group.content.rendered))
    const debutDate = acf.debut_date && /^\d{8}$|^\d{4}-\d{2}-\d{2}$/.test(acf.debut_date)
        ? formatDate(parseAcfDate(acf.debut_date), undefined, locale)
        : null
    const activeNames = activeMembers.map(member => stripHtml(member.title.rendered))
    const faqItems = [
        {
            question: t('group.faq.whoQ', { name }),
            answer: bioLead || (hasBio ? t('group.faq.whoABio', { name }) : t('group.faq.whoANoBio', { name })),
        },
        year
            ? {
                question: t('group.faq.debutQ', { name }),
                answer: t('group.faq.debutA', { name, year: debutDate ?? String(year), agency: agencyName ? t('group.faq.debutAgency', { agency: agencyName }) : '' }),
            }
            : null,
        activeCount > 0
            ? {
                question: t('group.faq.membersQ', { name }),
                // Nomes só quando todas as integrantes ativas têm ficha: lista
                // parcial numa resposta de "quantos" induziria ao erro.
                answer: activeNames.length === activeCount
                    ? t('group.faq.membersANames', { name, count: activeCount, names: activeNames.join(', ') })
                    : t('group.faq.membersA', {
                        name,
                        count: activeCount,
                        former: formerEntries.length > 0 ? t('group.faq.membersFormer', { count: formerEntries.length }) : '',
                    }),
            }
            : null,
        agencyName
            ? {
                question: t('group.faq.agencyQ', { name }),
                answer: t('group.faq.agencyA', { name, agency: agencyName }),
            }
            : null,
        acf.fandom_name
            ? {
                question: t('group.faq.fandomQ', { name }),
                answer: t('group.faq.fandomA', { name, fandom: acf.fandom_name }),
            }
            : null,
    ].filter(Boolean).slice(0, 5) as EntityFAQItem[]

    /* ── Registro único de blocos (mesma arquitetura do perfil de artista) ────
    // Nav (ReadingBar) e ordem de render derivam DESTA lista — antes eram duas
    // contabilidades manuais (navLinks + JSX solto) na "ordem narrativa:
    // contexto → identidade → profundidade → exploração". Os blocos do grupo
    // usam SectionTitleBar com eyebrows próprios ("Dossiê"/"Formação"), não
    // numeração — todos numbered:false; e todos layout:self porque as seções
    // vivem DENTRO da coluna principal (layout com sidebar), não em page-wrap
    // próprio como no artista.
    */
    const entries = buildGroupProfileEntries({
        group, model, members, activeMembers, formerMembers, formerSemFicha, memberPositions,
        relatedPosts, relatedGroups, discography, agency, agencyName, organizationContext, faqItems, t, locale,
    })


    // Teste A/B por id (par = ficha nova): integrantes primeiro, cinco abas e o resto recolhido no mesmo HTML.
    const emC = variantePorId(group.id) === 'b'
    const magra = members.length === 0 && !model.hasBio
    const { anchors: navLinks, nodes: sectionNodes } = renderProfileEntries(entries, { parentProvidesRail: true, medir: { prefixo: 'ficha-grupo', ids: ['membros', 'discografia', 'relacionados', 'artigos'] } })

    const nodesC: Record<string, React.ReactNode> = {}
    const restoC: React.ReactNode[] = []
    if (emC) {
        const DESENHADOS = new Set(['sobre', 'membros', 'videos', 'discografia', 'spotify', 'votacao', 'identidade', 'relacionados', 'artigos', 'faq'])
        entries.forEach((e, i) => {
            if (isInterstitial(e) || !e.present) return
            nodesC[e.id] = sectionNodes[i]
            if (!DESENHADOS.has(e.id) && !['analise', 'trajetoria', 'recordes'].includes(e.id)) restoC.push(sectionNodes[i])
        })
    }
    const anchorsC = emC ? [
        activeMembers.length > 0 && { href: '#membros', label: tC('tabs.membros') },
        (model.videoList.length > 0 || discography.length > 0 || !!acf.spotify) && { href: '#musica', label: tC('tabs.musica') },
        ((acf.story_chapters ?? []).length > 0) && { href: '#carreira', label: tC('tabs.carreira') },
        (members.length > 1 || !!acf.color) && { href: '#fandom', label: tC('tabs.fandom') },
        relatedPosts.length > 0 && { href: '#ler', label: tC('tabs.ler') },
    ].filter(Boolean) as { href: string; label: string }[] : navLinks

    return (
        <>
            <div hidden data-variante={emC ? 'grupo-c' : 'grupo-a'} />
            <JsonLd
                data={{
                    '@context': 'https://schema.org',
                    '@type': 'MusicGroup',
                    name,
                    alternateName: acf.name_hangul,
                    url: groupUrl,
                    image: image?.src,
                    foundingDate: year ? `${year}` : undefined,
                    genre: 'K-Pop',
                    sameAs: juntarSameAs(
                        [urlWikipedia((acf as { wikipedia_title?: string }).wikipedia_title, group.content?.rendered)],
                        socialEntries.map(s => s.href),
                        acf.website ? [acf.website] : [],
                    ),
                    member: activeMembers.length > 0 ? activeMembers.map(member => {
                        const positions = memberPositions[member.slug] ?? []
                        return {
                            '@type': 'Person',
                            name: stripHtml(member.title.rendered),
                            url: `${SITE_URL}${href('artist', { slug: member.slug }, locale)}`,
                            ...(positions.length > 0 ? { jobTitle: positions.map(p => POSITION_LABELS[p] ?? p).join(', ') } : {}),
                        }
                    }) : undefined,
                }}
            />
            <style dangerouslySetInnerHTML={{ __html: `
                .group-accent-text { color: ${accent}; }
                .group-accent-border { border-color: ${toRgba(accent, 0.4)}; }
                .group-accent-bg { background: ${toRgba(accent, 0.08)}; }
                .group:hover .member-card-border {
                    border-color: ${toRgba(accent, 0.45)};
                    box-shadow: 0 20px 40px ${toRgba(accent, 0.1)};
                }
            ` }} />
            <ProfileProseStyles scope="group-bio" accent={accent} />

            <ReadingBar backHref={href('groups', undefined, locale)} backLabel={tEntity('breadcrumb.groups')} tagLabel={generation ?? undefined} tagColor={accent} title={name} pageUrl={groupUrl} pageAnchors={anchorsC} />

            <GroupHero
                groupId={group.id}
                name={name}
                image={image}
                acf={acf}
                accent={accent}
                agencyName={agencyName}
                agencySlug={agency?.slug ?? null}
                generation={generation}
                disbandYear={disbandYear}
                debutYear={year}
                yearsActive={yearsActive}
                totalMembers={activeCount > 0 ? activeCount : members.length}
            />

            {emC ? (
                <GroupFichaC
                    group={group} model={model} activeMembers={activeMembers} formerMembers={formerMembers} formerSemFicha={formerSemFicha} memberPositions={memberPositions}
                    relatedGroups={relatedGroups} relatedPosts={relatedPosts} discography={discography}
                    agencyName={agencyName} generation={generation} magra={magra}
                    nodes={nodesC} resto={restoC}
                />
            ) : (
                <>
            {/* Page body */}
            <div className="page-wrap">
                <div className="flex items-start gap-10">
                    <main className="group-profile-stack min-w-0 max-w-[1020px] flex-1 xl:pl-32">
                        {sectionNodes}
                    </main>

                    {/* Sidebar — desktop only */}
                    <GroupSidebarFicha
                        acf={acf}
                        accent={accent}
                        generation={generation}
                        memberCount={activeCount}
                        socialEntries={socialEntries}
                        agencyName={agencyName}
                    />
                </div>
            </div>
                </>
            )}

            {/* Guias só existem em português. */}
            {locale === DEFAULT_LOCALE && relatedHubs.length > 0 && (
                <div className="page-wrap py-8 border-t border-border/40">
                    <div className="mb-4">
                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">{t('explore')}</p>
                        <h2 className="text-[18px] font-black tracking-[-0.03em]">{t('relatedGuides')}</h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {relatedHubs.map(hub => (
                            <Link key={hub.slug} href={`/guias/${hub.slug}`}
                                className="touch-target border border-border bg-surface p-4 transition-colors hover:border-accent/60 hover:bg-accent/5">
                                <h3 className="text-[15px] font-black leading-snug text-foreground">{hub.shortTitle}</h3>
                                <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-muted">{hub.description}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <QuizFacts entitySlug={group.slug} entityType="group" entityName={name} />
            <QuizWidget category="k-pop" />

            <ScrollToTop />
        </>
    )
}
