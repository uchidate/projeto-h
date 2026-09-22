import { SITE_NAME } from '@/lib/constants/site'
import { intlLocale } from '@/lib/i18n/format'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Globe, Users, Calendar, Star, Trophy, ChevronRight, Music2, Network, BookOpenCheck } from 'lucide-react'
import { getAgencies, getAgencyBySlug } from '@/lib/wordpress/agencies'
import { getArtists } from '@/lib/wordpress/artists'
import { getGroups } from '@/lib/wordpress/groups'
import { getPosts } from '@/lib/wordpress/posts'
import { buildOgImageUrl, SITE_URL } from '@/lib/constants/site'
import { getWPImage, stripHtml, getYear } from '@/lib/utils'
import { buildWordPressMetadata } from '@/lib/seo/wordpress'
import { buildBreadcrumbSchema } from '@/lib/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLd'
import { WpEditSetter } from '@/components/ui/WpEditContext'
import { ReadingBar } from '@/components/ui/ReadingBar'
import { ExpandableArtistGrid } from '@/components/agency/ExpandableArtistGrid'
import { AgencyOrganizationMap } from '@/components/agency/AgencyOrganizationMap'
import { GroupPosts } from '@/components/groups/GroupPosts'
import { GroupMVPlayer } from '@/components/groups/GroupMVPlayer'
import { FactGrid, type FactItem } from '@/components/blocks/FactGrid'
import { CollapsibleProse } from '@/components/profiles/CollapsibleProse'
import { EntityFAQ, type EntityFAQItem } from '@/components/seo/EntityFAQ'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { splitContentForAd } from '@/lib/utils/injectAd'
import { ADSENSE } from '@/lib/config/ads'
import { entityBelongsToOrganizations, resolveAgencyNetwork } from '@/lib/agencies/network'
import { applyAgencyDirectoryManifestPreview, applyAgencyManifestPreview, applyEntityAffiliationsManifestPreview } from '@/lib/agencies/preview'
import { metaDescription } from '@/lib/seo/metaDescription'
import {
    agencyMark,
    accessibleAccent,
    countryLabel,
    normalizeAccent,
    optionalAccent,
    toRgba,
    type CSSVariableProperties, AGENCY_TYPE_LABELS, ORGANIZATION_KIND_LABELS } from '@/lib/agencies/presentation'
import { BIG4_SLUGS, LEGACY_AGENCY_TITLE, sameImageAsset, GENERATIONS } from './lib/helpers'
import { GroupCard } from './components/GroupCard'
import { SectionHeader } from './components/SectionHeader'
import { AgencyKeyMetrics } from './components/AgencyKeyMetrics'
import { AgencyMilestones } from './components/AgencyMilestones'
import { AgencySources } from './components/AgencySources'

export const revalidate = 3600

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { slug } = await params
    const agency = await getAgencyBySlug(slug)
    if (!agency) return {}
    const name = stripHtml(agency.title.rendered)
    const desc = metaDescription(stripHtml(agency.excerpt?.rendered ?? ''))
    const url = `${SITE_URL}/agencies/${slug}`
    const logo = getWPImage(agency._embedded, agency.featured_image_url)
    const fallbackTitle = `${name}: artistas, grupos e história`
    const seoImageIsLogo = sameImageAsset(agency.yoast_head_json?.og_image?.[0]?.url, logo?.src)
    const seo = agency.yoast_head_json
        ? {
            ...agency.yoast_head_json,
            title: agency.yoast_head_json.title?.replace(LEGACY_AGENCY_TITLE, '') === name
                ? fallbackTitle
                : agency.yoast_head_json.title,
            og_title: agency.yoast_head_json.og_title?.replace(LEGACY_AGENCY_TITLE, '') === name
                ? fallbackTitle
                : agency.yoast_head_json.og_title,
            // Um logo quadrado não deve bloquear a composição social 1200×630.
            og_image: seoImageIsLogo ? undefined : agency.yoast_head_json.og_image,
        }
        : undefined
    const ogImage = buildOgImageUrl({
        title: fallbackTitle,
        subtitle: desc || `História, grupos e artistas relacionados à ${name}.`,
        image: logo?.src,
        type: 'agency',
    })

    return buildWordPressMetadata({
        title: fallbackTitle,
        description: desc || `Conheça a ${name}, sua história, seus grupos, artistas e sua atuação na indústria do entretenimento coreano.`,
        url,
        image: logo ? { src: logo.src, alt: `${name} — logo` } : undefined,
        ogImageOverride: ogImage,
        seo,
    })
}

export default async function AgencyDetailPage({ params }: { params: Params }) {
    const { slug } = await params
    const sourceAgency = await getAgencyBySlug(slug)
    if (!sourceAgency) notFound()
    const agency = await applyAgencyManifestPreview(sourceAgency)

    const name = stripHtml(agency.title.rendered)
    const mark = agencyMark(name)
    const logo = getWPImage(agency._embedded, agency.featured_image_url)
    const acf = agency.acf ?? {}
    const accent = normalizeAccent(agency.accent_color)
    const interfaceAccent = accessibleAccent(accent)
    const isBig4 = BIG4_SLUGS.has(slug)
    const tierLabel = isBig4
        ? 'Big 4'
        : agency.agency_type ? (AGENCY_TYPE_LABELS[agency.agency_type] ?? null) : null
    const entityLabel = ORGANIZATION_KIND_LABELS[acf.organization_kind ?? '']
        ?? (agency.agency_type === 'indie' ? 'Agência independente' : 'Empresa de entretenimento')
    const milestones = (agency.milestones ?? [])
        .map(m => { const [year, ...rest] = m.split('|'); return { year: year.trim(), desc: rest.join('|').trim() } })
        .filter(m => m.year && m.desc)
    const milestoneYears = milestones
        .map(m => Number.parseInt(m.year, 10))
        .filter(year => Number.isInteger(year) && year >= 1800 && year <= new Date().getFullYear())
    const originYear = [acf.founded_year, ...milestoneYears]
        .filter((year): year is number => typeof year === 'number')
        .sort((a, b) => a - b)[0] ?? null
    const currentIdentitySince = acf.current_name_since
        ?? (acf.founded_year && originYear && acf.founded_year > originYear ? acf.founded_year : null)
    const achievements = agency.achievements ?? []
    const businessPillars = acf.business_pillars ?? []
    const storyChapters = acf.story_chapters ?? []
    const currentDevelopments = acf.current_developments ?? []
    const contentHtml = agency.content?.rendered ?? ''
    const [contentLead, contentRest] = splitContentForAd(contentHtml, 2)
    const excerptText = stripHtml(agency.excerpt?.rendered ?? '')
    const pageUrl = `${SITE_URL}/agencies/${slug}`
    const updatedAtLabel = agency.modified
        ? new Intl.DateTimeFormat(intlLocale(), { month: 'long', year: 'numeric' }).format(new Date(agency.modified))
        : null
    const leadershipUpdatedDate = /^\d{4}-\d{2}-\d{2}$/.test(acf.leadership_updated_at ?? '')
        ? new Date(`${acf.leadership_updated_at}T00:00:00Z`)
        : null
    const leadershipUpdatedLabel = leadershipUpdatedDate && !Number.isNaN(leadershipUpdatedDate.getTime())
        ? new Intl.DateTimeFormat(intlLocale(), { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(leadershipUpdatedDate)
        : null

    const agencyDirectory = await getAgencies({ perPage: 100, orderby: 'title', order: 'asc' })
        .then(result => result.items)
        .then(applyAgencyDirectoryManifestPreview)
        .catch(() => [])
    const network = resolveAgencyNetwork(agency, agencyDirectory)
    const networkQuery = network.organizationIds.length > 1
        ? { agencies: network.organizationIds }
        : { agency: agency.id }

    const [artistsResult, groupsResult, postsResult] = await Promise.allSettled([
        getArtists({ perPage: 100, orderby: 'date', order: 'desc', ...networkQuery }),
        getGroups({ perPage: 100, orderby: 'date', order: 'desc', ...networkQuery }),
        getPosts({ perPage: 4, orderby: 'date', order: 'desc', search: name, includeContent: false }),
    ])

    const rawArtists = artistsResult.status === 'fulfilled' ? artistsResult.value.items : []
    const rawGroups = groupsResult.status === 'fulfilled' ? groupsResult.value.items : []
    const [previewArtists, previewGroups] = await Promise.all([
        applyEntityAffiliationsManifestPreview(rawArtists, 'artist', agencyDirectory),
        applyEntityAffiliationsManifestPreview(rawGroups, 'group', agencyDirectory),
    ])
    const allArtists = previewArtists.filter(entity => entityBelongsToOrganizations(entity, network.organizationIds))
    const allGroups = previewGroups.filter(entity => entityBelongsToOrganizations(entity, network.organizationIds))
    const relatedPosts = postsResult.status === 'fulfilled' ? postsResult.value.items : []
    const groupsSorted = [...allGroups].sort((a, b) => (b.acf?.trending_score ?? 0) - (a.acf?.trending_score ?? 0))
    const activeGroups = groupsSorted.filter(g => g.acf?.active !== false)
    const inactiveGroups = groupsSorted.filter(g => g.acf?.active === false)
    const featuredGroups = [...activeGroups]
        .sort((a, b) => Number(Boolean(getWPImage(b._embedded, b.featured_image_url))) - Number(Boolean(getWPImage(a._embedded, a.featured_image_url))))
        .slice(0, 4)
    const featuredGroupIds = new Set(featuredGroups.map(group => group.id))
    const remainingActiveGroups = activeGroups.filter(group => !featuredGroupIds.has(group.id))
    const currentVisualGroup = featuredGroups.find(group => getWPImage(group._embedded, group.featured_image_url))
    const currentVisualImage = currentVisualGroup ? getWPImage(currentVisualGroup._embedded, currentVisualGroup.featured_image_url) : null
    const agencyVideos = (acf.featured_videos?.length
        ? acf.featured_videos
        : activeGroups
            .filter(group => group.acf?.mv_url)
            .map(group => ({ title: `${stripHtml(group.title.rendered)} — vídeo oficial`, url: group.acf!.mv_url! })))
        .slice(0, 4)

    const groupsByGen = GENERATIONS.map(gen => ({
        ...gen,
        items: remainingActiveGroups
            .filter(g => { const y = g.acf?.debut_date ? parseInt(g.acf.debut_date.slice(0, 4)) : null; return y !== null && y >= gen.from && y <= gen.to })
            .sort((a, b) => (a.acf?.debut_date ?? '').localeCompare(b.acf?.debut_date ?? '')),
    })).filter(g => g.items.length > 0)
    const groupsWithoutGeneration = remainingActiveGroups.filter(group => !getYear(group.acf?.debut_date))

    const topArtist = [...allArtists].sort((a, b) => (b.acf?.trending_score ?? 0) - (a.acf?.trending_score ?? 0))[0]
    const editorialLens = acf.organization_kind === 'conglomerate'
        ? {
            eyebrow: 'Como a rede funciona',
            title: `${name} não é uma única agência. É uma rede.`,
            body: `Conglomerados reúnem labels, subsidiárias e operações com responsabilidades diferentes. Por isso, o ${SITE_NAME} preserva o vínculo direto de cada artista e também mostra a organização controladora.`,
        }
        : acf.organization_kind === 'label' || agency.agency_type === 'subsidiary'
            ? {
                eyebrow: 'Onde ela se encaixa',
                title: `${name} é uma peça do sistema — não o sistema inteiro.`,
                body: 'Uma label pode administrar repertório e carreira sem representar sozinha todo o conglomerado. Os vínculos exibidos aqui distinguem o elenco direto das relações com empresas controladoras.',
            }
            : {
                eyebrow: 'Sobre os dados',
                title: 'Os números mostram o acervo. A história explica a empresa.',
                body: `As contagens abaixo representam perfis disponíveis no ${SITE_NAME}, não um roster oficial completo. Relações históricas ou encerradas são identificadas separadamente quando há dados estruturados.`,
            }
    const pillarsHeading = acf.organization_kind === 'conglomerate'
        ? { label: 'Como a empresa funciona', title: `O modelo de negócio da ${name}` }
        : acf.organization_kind === 'joint_venture'
            ? { label: 'Como a parceria funciona', title: `A proposta da ${name}` }
            : acf.organization_kind === 'label'
                ? { label: 'Identidade da label', title: `O que define a ${name}` }
                : { label: 'Como a organização funciona', title: `A atuação da ${name}` }
    const aboutFallback = [
        `${name} é uma agência de entretenimento da ${countryLabel(agency.country)}.`,
        originYear ? `Sua trajetória tem origem em ${originYear}.` : null,
        allGroups.length || allArtists.length
            ? `A cobertura do ${SITE_NAME} reúne ${allGroups.length} ${allGroups.length === 1 ? 'grupo relacionado' : 'grupos relacionados'} e ${allArtists.length} ${allArtists.length === 1 ? 'perfil de artista' : 'perfis de artistas'}.`
            : null,
    ].filter(Boolean).join(' ')

    // A capa precisa contextualizar a agência sem transformar o elenco em textura.
    const visualContext = businessPillars
        .map(pillar => `${pillar.title} ${pillar.description}`)
        .join(' ')
        .toLocaleLowerCase(intlLocale())
    const heroVisuals = [...groupsSorted]
        .filter(g => getWPImage(g._embedded, g.featured_image_url))
        .sort((first, second) => {
            const firstMentioned = visualContext.includes(stripHtml(first.title.rendered).toLocaleLowerCase(intlLocale()))
            const secondMentioned = visualContext.includes(stripHtml(second.title.rendered).toLocaleLowerCase(intlLocale()))
            return Number(secondMentioned) - Number(firstMentioned)
        })
        .slice(0, 3)
        .map(group => ({ group, image: getWPImage(group._embedded, group.featured_image_url)! }))
    const heroImages = heroVisuals.map(item => item.image)
    const editorialVisualStories = businessPillars.flatMap((pillar, index) => {
        const fallback = heroVisuals[index]
        const imageSrc = pillar.visual_url || fallback?.image.src
        if (!imageSrc) return []
        return [{
            ...pillar,
            image: { src: imageSrc },
            group: fallback?.group,
            hasCuratedVisual: Boolean(pillar.visual_url),
        }]
    })
    const narrativeChapters = storyChapters.map(chapter => {
        const relatedGroup = chapter.entity_slug ? groupsSorted.find(group => group.slug === chapter.entity_slug) : undefined
        const relatedImage = relatedGroup ? getWPImage(relatedGroup._embedded, relatedGroup.featured_image_url) : null
        return {
            ...chapter,
            relatedGroup,
            imageSrc: chapter.visual_url || relatedImage?.src || null,
        }
    })
    const chapterCountLabel = ['', 'Uma virada', 'Duas viradas', 'Três viradas', 'Quatro viradas', 'Cinco viradas', 'Seis viradas'][narrativeChapters.length] ?? `${narrativeChapters.length} viradas`
    const keyMetrics = (acf.key_metrics ?? []).filter(metric => metric.value && metric.label)
    // Transparência editorial: toda URL citada nos dados curados vira uma fonte listada no rodapé.
    const citedSources = [
        ...businessPillars.flatMap(pillar => [pillar.source_url, pillar.visual_source_url, pillar.quote_source_url]),
        ...storyChapters.flatMap(chapter => [chapter.source_url, chapter.visual_source_url]),
        ...keyMetrics.map(metric => metric.source_url),
        ...currentDevelopments.map(item => item.source_url),
    ].filter((url): url is string => Boolean(url))
    const sourcesByHost = [...citedSources.reduce((hosts, url) => {
        try {
            const host = new URL(url).hostname.replace(/^www\./, '')
            const entry = hosts.get(host) ?? { host, count: 0, sample: url }
            entry.count += 1
            hosts.set(host, entry)
        } catch { /* URL relativa ou inválida não entra na lista de fontes */ }
        return hosts
    }, new Map<string, { host: string, count: number, sample: string }>()).values()]
        .sort((first, second) => second.count - first.count)

    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: `${SITE_NAME}`, url: SITE_URL },
        { name: 'Agências', url: `${SITE_URL}/agencies` },
        { name, url: pageUrl },
    ])

    // Build nav anchors dynamically
    const navLinks = [
        { href: '#sobre', label: 'Sobre' },
        ...(keyMetrics.length > 0 ? [{ href: '#numeros', label: 'Números' }] : []),
        ...(narrativeChapters.length > 0 || milestones.length > 0 ? [{ href: '#historia', label: 'História' }] : []),
        ...(narrativeChapters.length === 0 && achievements.length > 0 ? [{ href: '#conquistas', label: 'Impacto' }] : []),
        ...(businessPillars.length > 0 ? [{ href: '#modelo', label: 'Modelo' }] : []),
        ...(currentDevelopments.length > 0 ? [{ href: '#agora', label: 'Agora' }] : []),
        ...(agencyVideos.length > 0 ? [{ href: '#mvs', label: 'Vídeos' }] : []),
        ...(network.organizations.length > 1 ? [{ href: '#ecossistema', label: 'Ecossistema' }] : []),
        ...(allGroups.length > 0 ? [{ href: '#catalogo', label: 'Grupos' }] : []),
        ...(allArtists.length > 0 ? [{ href: '#artistas', label: 'Artistas' }] : []),
        ...(relatedPosts.length > 0 ? [{ href: '#artigos', label: 'Artigos' }] : []),
        { href: '#faq', label: 'FAQ' },
    ]
    const pageStyle: CSSVariableProperties = {
        '--ac': interfaceAccent,
        '--ac-brand': accent,
        '--ac-08': toRgba(interfaceAccent, 0.08),
        '--ac-15': toRgba(interfaceAccent, 0.15),
    }
    const summaryFacts = [
        { label: 'País', value: countryLabel(agency.country) },
        acf.ceo && leadershipUpdatedLabel && {
            label: 'CEO',
            value: acf.ceo,
            description: `Verificado em ${leadershipUpdatedLabel}`,
        },
        originYear && {
            label: 'Trajetória',
            value: currentIdentitySince ? `${originYear} · identidade atual desde ${currentIdentitySince}` : `Desde ${originYear}`,
        },
        { label: `Cobertura ${SITE_NAME}`, value: `${allGroups.length} grupos · ${allArtists.length} perfis` },
    ].filter(Boolean) as FactItem[]
    const faqItems = [
        {
            question: `O que é ${name}?`,
            answer: `${name} é uma empresa de entretenimento da ${countryLabel(agency.country)}${originYear ? `, com trajetória registrada desde ${originYear}` : ''}. Esta página apresenta seu contexto, seus marcos e os perfis relacionados disponíveis no ${SITE_NAME}.`,
        },
        allGroups.length > 0
            ? {
                question: `Quais grupos estão relacionados à ${name}?`,
                answer: `A cobertura atual do ${SITE_NAME} relaciona ${allGroups.length} ${allGroups.length === 1 ? 'grupo' : 'grupos'} à ${name}. O vínculo institucional específico deve ser conferido no perfil de cada grupo, pois conglomerado, agência e label não são necessariamente a mesma entidade.`,
            }
            : null,
        allArtists.length > 0
            ? {
                question: `Quais artistas estão relacionados à ${name}?`,
                answer: `O ${SITE_NAME} possui ${allArtists.length} ${allArtists.length === 1 ? 'perfil de artista relacionado' : 'perfis de artistas relacionados'} à ${name}, incluindo integrantes de grupos e eventuais carreiras solo.`,
            }
            : null,
        isBig4
            ? {
                question: `${name} faz parte do Big 4 do K-Pop?`,
                answer: `Sim. Na cobertura editorial do setor, ${name} integra o grupo conhecido como Big Four ao lado de SM Entertainment, JYP Entertainment e YG Entertainment.`,
            }
            : null,
    ].filter(Boolean).slice(0, 5) as EntityFAQItem[]

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

            {/* ── Reading bar + section nav ──────────────────────────────── */}
            <ReadingBar
                backHref="/agencies"
                backLabel="Agências"
                tagLabel={tierLabel ?? undefined}
                tagColor={accent}
                title={name}
                pageUrl={pageUrl}
                pageAnchors={navLinks}
            />

            {/* ── HERO editorial, alinhado ao grid da página ───────────── */}
            <div className="page-wrap pt-4 sm:pt-6">
                <div className="relative h-[56svh] min-h-[420px] max-h-[560px] overflow-hidden border border-foreground/10 sm:h-[62vh] sm:min-h-[480px] sm:max-h-[620px]">
                {/* Mosaico editorial: uma imagem principal e duas de apoio. */}
                {heroImages.length > 0 ? (
                    <div className="absolute inset-0 grid grid-cols-[minmax(0,1.65fr)_minmax(118px,0.85fr)] sm:grid-cols-[minmax(0,1.8fr)_minmax(260px,0.8fr)] sm:grid-rows-2">
                        {heroImages.map((img, i) => (
                            <div key={i} className={`relative min-w-0 overflow-hidden border-white/10 ${i === 0 ? 'row-span-2 border-r' : i === 1 ? 'border-b' : 'hidden sm:block'}`}>
                                <Image
                                    src={img.src}
                                    alt=""
                                    fill
                                    priority={i === 0}
                                    className="object-cover object-top transition-transform duration-1400 motion-safe:hover:scale-[1.025] motion-reduce:transition-none"
                                    sizes={i === 0 ? '(max-width: 640px) 68vw, 72vw' : '(max-width: 640px) 32vw, 28vw'}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="absolute inset-0 [background:var(--ac-15)]" />
                )}

                {/* Gradient layers */}
                <div className="absolute inset-0" style={{
                    background: `linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.5) 65%, var(--color-background,#0a0a0a) 100%)`
                }} />
                <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/30 to-black/50" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end">
                    <div className="px-5 pb-7 sm:px-8 sm:pb-10">
                        <div className="flex items-end gap-4 sm:gap-7">
                            {/* Logo / fallback mark */}
                            {logo ? (
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden border-2 border-white/20 bg-black/60 backdrop-blur-xs sm:h-28 sm:w-28">
                                    <Image src={logo.src} alt={`${name} — logo`} fill priority className="object-contain p-2.5" sizes="(max-width: 640px) 64px, 112px" />
                                </div>
                            ) : (
                                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border-2 border-white/20 bg-black/55 backdrop-blur-xs sm:h-28 sm:w-28">
                                    <span className="absolute text-[52px] sm:text-[72px] font-black -tracking-widest text-white/5">
                                        {mark}
                                    </span>
                                    <span className="relative border border-white/15 bg-white/10 px-2.5 py-1.5 font-mono text-[12px] sm:text-[14px] font-black tracking-[0.16em] text-white/65">
                                        {mark}
                                    </span>
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span className="border border-white/25 bg-black/40 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white/80 backdrop-blur-xs">
                                        {entityLabel}
                                    </span>
                                    {tierLabel && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-xs [background:var(--ac-brand)]">
                                            {isBig4 && <Star size={9} fill="currentColor" />}
                                            {tierLabel}
                                        </span>
                                    )}
                                    {originYear && (
                                        <span className="border border-white/20 bg-black/30 px-2.5 py-1 font-mono text-[10px] text-white/60 backdrop-blur-xs">
                                            origem {originYear}
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-[32px] font-black leading-none tracking-tight text-white drop-shadow-lg sm:text-[56px]">
                                    {name}
                                </h1>
                                {acf.name_hangul && (
                                    <p className="font-mono text-[15px] sm:text-[18px] text-white/50 tracking-[0.08em] mt-1.5">
                                        {acf.name_hangul}
                                    </p>
                                )}

                                {/* Quick stats strip */}
                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[10px] text-white/60 sm:mt-4 sm:gap-x-5 sm:text-[11px]">
                                    {originYear && (
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={11} className="opacity-60" />
                                            trajetória desde <strong className="text-white">{originYear}</strong>
                                        </span>
                                    )}
                                    {allGroups.length > 0 && (
                                        <span className="flex items-center gap-1.5">
                                            <Music2 size={11} className="opacity-60" />
                                            <strong className="text-white">{allGroups.length}</strong> grupos cobertos
                                        </span>
                                    )}
                                    {allArtists.length > 0 && (
                                        <span className="flex items-center gap-1.5">
                                            <Users size={11} className="opacity-60" />
                                            <strong className="text-white">{allArtists.length}</strong> perfis no acervo
                                        </span>
                                    )}
                                    {acf.website && (
                                        <a href={acf.website} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-white/50 hover:text-white transition-colors">
                                            <Globe size={11} /> Site oficial <ExternalLink size={9} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </div>

            {/* ── Main content ──────────────────────────────────────────── */}
            <div className="page-wrap space-y-14 py-10 sm:space-y-16 sm:py-14">

                {/* ── RESUMO EDITORIAL ───────────────────────────────── */}
                <section id="sobre" aria-labelledby="resumo-agencia" className="scroll-mt-(--scroll-anchor-offset,106px) border-y border-foreground/10 py-7 sm:py-9">
                    <div>
                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-(--ac)">Em resumo</p>
                        <h2 id="resumo-agencia" className="mt-2 max-w-4xl text-2xl font-black leading-tight tracking-[-0.035em] sm:text-4xl">
                            O que você precisa saber sobre {name}
                        </h2>
                        <p className="mt-4 max-w-4xl border-l-[3px] pl-5 text-[17px] font-semibold leading-8 text-foreground/80 sm:text-xl sm:leading-9" style={{ borderColor: interfaceAccent }}>
                            {acf.story_intro || excerptText || aboutFallback}
                        </p>
                        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                            <span className="font-black text-foreground/70">Curadoria {SITE_NAME}</span>
                            {updatedAtLabel && (
                                <>
                                    <span aria-hidden="true" className="text-border">·</span>
                                    <span>Atualizado em <time dateTime={agency.modified}>{updatedAtLabel}</time></span>
                                </>
                            )}
                            {acf.website && (
                                <>
                                    <span aria-hidden="true" className="text-border">·</span>
                                    <a href={acf.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline decoration-border underline-offset-4 hover:text-foreground">
                                        Fonte institucional <ExternalLink size={9} />
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                    <FactGrid items={summaryFacts} columns={4} className="mt-7 grid-cols-2" />
                </section>

                {/* ── EM NÚMEROS ───────────────────────────────────────── */}
                {keyMetrics.length >= 3 && (
                    <AgencyKeyMetrics name={name} keyMetrics={keyMetrics} />
                )}

                {narrativeChapters.length > 0 && (
                    <nav aria-label="Percurso da história" className="overflow-hidden border border-border bg-surface">
                        <div className="border-b border-border px-5 py-4 sm:px-6">
                            <p className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-(--ac)">O percurso</p>
                            <p className="mt-1 text-sm font-bold text-foreground/75">{chapterCountLabel} para entender a evolução da {name}</p>
                        </div>
                        <div className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden lg:grid" style={{ gridTemplateColumns: `repeat(${narrativeChapters.length}, minmax(0, 1fr))` }}>
                            {narrativeChapters.map((chapter, index) => (
                                <a key={`${chapter.period}-route`} href={`#capitulo-${index + 1}`} className="group/route min-w-[58%] snap-start border-r border-border p-5 last:border-r-0 sm:min-w-[38%] lg:min-w-0">
                                    <span className="font-mono text-[9px] text-muted">0{index + 1}</span>
                                    <strong className="mt-5 block font-mono text-[11px] text-(--ac)">{chapter.period}</strong>
                                    <span className="mt-2 block text-sm font-black leading-snug transition-colors group-hover/route:text-(--ac)">{chapter.title}</span>
                                </a>
                            ))}
                        </div>
                    </nav>
                )}

+                {/* ── HISTÓRIA / TIMELINE ──────────────────────────────── */}
                {narrativeChapters.length > 0 && (
                    <section id="historia" className="scroll-mt-(--scroll-anchor-offset,106px) overflow-clip border border-border bg-foreground text-background">
                        <div className="grid lg:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
                            <header className="relative border-b border-background/15 p-6 sm:p-8 lg:border-b-0 lg:border-r">
                                <div className="lg:sticky lg:top-[220px]">
                                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.17em] text-(--ac-brand)">A história em capítulos</p>
                                    <h2 className="mt-4 max-w-md text-4xl font-black leading-[0.96] tracking-tighter sm:text-5xl">
                                        As viradas que definiram a {name}.
                                    </h2>
                                    <p className="mt-6 max-w-sm text-sm leading-7 text-background/65">
                                        Uma leitura da formação da empresa, das viradas de catálogo e do ciclo que começa agora.
                                    </p>
                                    <div className="mt-8 flex items-end gap-3 border-t border-background/15 pt-5">
                                        <strong className="font-mono text-4xl leading-none">{originYear ? new Date().getFullYear() - originYear : narrativeChapters.length}</strong>
                                        <span className="max-w-[130px] font-mono text-[8px] uppercase leading-4 tracking-[0.12em] text-background/45">
                                            {originYear ? 'anos de trajetória documentada' : 'capítulos documentados'}
                                        </span>
                                    </div>
                                </div>
                            </header>

                            <div className="divide-y divide-background/15">
                                {narrativeChapters.map((chapter, index) => (
                                    <article
                                        key={`${chapter.period}-${chapter.title}`}
                                        id={`capitulo-${index + 1}`}
                                        className="group/chapter relative flex scroll-mt-(--scroll-anchor-offset,106px) flex-col border-l-2 border-transparent transition-colors duration-500 target:border-(--ac-brand) target:bg-background/4 lg:block"
                                    >
                                        {chapter.imageSrc && (
                                            <figure className="relative order-2 aspect-16/10 overflow-hidden sm:aspect-16/8 lg:order-1">
                                                <Image
                                                    src={chapter.imageSrc}
                                                    alt={chapter.visual_alt || chapter.title}
                                                    fill
                                                    className="object-cover object-center opacity-80 transition duration-700 group-hover/chapter:scale-[1.025] group-hover/chapter:opacity-95 motion-reduce:transition-none"
                                                    sizes="(max-width: 1024px) 100vw, 64vw"
                                                />
                                                <div className="absolute inset-0 bg-linear-to-t from-black via-black/10 to-transparent" />
                                                {(chapter.visual_credit || chapter.relatedGroup) && (
                                                    <figcaption className="absolute bottom-3 left-4 font-mono text-[8px] uppercase tracking-[0.12em] text-white/55">
                                                        {chapter.visual_credit || stripHtml(chapter.relatedGroup!.title.rendered)}
                                                    </figcaption>
                                                )}
                                            </figure>
                                        )}
                                        <div className="relative order-1 p-6 sm:p-8 lg:order-2">
                                            <span aria-hidden="true" className="absolute right-5 top-4 font-mono text-6xl font-black leading-none text-background/5.5">0{index + 1}</span>
                                            <p className="font-mono text-[11px] font-black tracking-[0.08em] text-(--ac-brand)">{chapter.period}</p>
                                            <h3 className="mt-4 max-w-2xl text-2xl font-black leading-tight tracking-[-0.035em] sm:text-3xl">{chapter.title}</h3>
                                            <p className="mt-4 max-w-2xl text-[14px] leading-7 text-background/68">{chapter.description}</p>
                                            <div className="mt-6 flex flex-wrap gap-4 font-mono text-[8px] font-black uppercase tracking-[0.11em]">
                                                <a href={chapter.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-background/45 hover:text-background">
                                                    Fonte do capítulo <ExternalLink size={9} />
                                                </a>
                                                {chapter.relatedGroup && (
                                                    <Link href={`/groups/${chapter.relatedGroup.slug}`} prefetch={false} className="inline-flex items-center gap-1 text-background/45 hover:text-background">
                                                        Ver perfil relacionado <ChevronRight size={9} />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>
                )}


                {/* ── ENSAIO VISUAL ─────────────────────────────────── */}
                {editorialVisualStories.length >= 2 && (
                    <section aria-labelledby="ensaio-visual-agencia" className="overflow-hidden border border-border bg-surface">
                        <div className="grid lg:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]">
                            <div className="relative flex min-h-[340px] flex-col justify-between overflow-hidden bg-foreground p-6 text-background sm:min-h-[430px] sm:p-8 lg:min-h-[620px]">
                                <div aria-hidden="true" className="absolute -right-8 -top-10 z-0 font-black text-[160px] leading-none text-background opacity-[0.055] sm:text-[220px]">
                                    {mark}
                                </div>
                                <div className="relative z-10">
                                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-(--ac-brand)">Leitura visual</p>
                                    <h2 id="ensaio-visual-agencia" className="mt-4 max-w-lg text-3xl font-black leading-[0.98] tracking-[-0.045em] sm:text-5xl">
                                        A identidade da {name}, vista de perto.
                                    </h2>
                                </div>
                                <ol className="relative z-10 my-10 hidden border-y border-background/15 py-3 lg:block">
                                    {editorialVisualStories.map((story, index) => (
                                        <li key={`${story.title}-index`} className="flex items-center gap-4 border-b border-background/10 py-3 last:border-b-0">
                                            <span className="font-mono text-[9px] text-background/35">0{index + 1}</span>
                                            <span className="text-sm font-black text-background/70">{story.title}</span>
                                        </li>
                                    ))}
                                </ol>
                                <div className="relative z-10 max-w-md border-t border-background/20 pt-5">
                                    <p className="text-[14px] leading-7 text-background/70 sm:text-[15px]">
                                        Imagens, espaços e artistas ajudam a revelar como a empresa transforma uma direção criativa em presença reconhecível.
                                    </p>
                                    <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-background/45">
                                        {editorialVisualStories.length} capítulos visuais
                                    </p>
                                    <p className="mt-2 flex items-center gap-2 font-mono text-[8px] font-black uppercase tracking-[0.12em] text-background/55 lg:hidden">
                                        Deslize para explorar <span aria-hidden="true">→</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain p-3 scrollbar-none [&::-webkit-scrollbar]:hidden lg:block lg:divide-y lg:divide-border lg:p-0">
                                {editorialVisualStories.map((story, index) => {
                                    const groupName = story.group ? stripHtml(story.group.title.rendered) : null
                                    return (
                                        <article
                                            key={`${story.title}-${index}`}
                                            className="group/story min-w-[88%] snap-center overflow-hidden border border-border bg-background lg:grid lg:min-h-[340px] lg:min-w-0 lg:grid-cols-[minmax(220px,0.92fr)_minmax(0,1.08fr)] lg:border-0"
                                        >
                                            <figure className="relative min-h-[250px] overflow-hidden lg:min-h-full">
                                                <Image
                                                    src={story.image.src}
                                                    alt={story.visual_alt || (groupName ? `${groupName}, grupo relacionado à ${name}` : '')}
                                                    fill
                                                    className="object-cover object-center transition duration-700 group-hover/story:scale-[1.045] group-hover/story:saturate-[1.1] motion-reduce:transition-none"
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 40vw, 28vw"
                                                />
                                                <div className="absolute inset-0 bg-linear-to-t from-black/75 via-transparent to-transparent" />
                                                <figcaption className="absolute inset-x-0 bottom-0 p-4 text-[10px] leading-5 text-white/80">
                                                    <span className="block font-mono text-[8px] font-black uppercase tracking-[0.12em] text-white/55">
                                                        {story.visual_credit || groupName}
                                                    </span>
                                                    {story.visual_caption && <span className="mt-1 block max-w-sm">{story.visual_caption}</span>}
                                                </figcaption>
                                            </figure>
                                            <div className="relative flex flex-col justify-between p-5 sm:p-7">
                                                <span aria-hidden="true" className="absolute right-4 top-2 font-mono text-[58px] font-black leading-none text-foreground/[0.035]">0{index + 1}</span>
                                                <div className="relative">
                                                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-(--ac)">Capítulo 0{index + 1}</p>
                                                    <h3 className="mt-5 text-2xl font-black leading-tight tracking-[-0.035em]">{story.title}</h3>
                                                    {story.quote_text && story.quote_author && (
                                                        <blockquote className="mt-5 border-l-2 pl-4" style={{ borderColor: interfaceAccent }}>
                                                            <p className="font-serif text-xl font-bold leading-snug tracking-tight text-foreground/90">
                                                                “{story.quote_text}”
                                                            </p>
                                                            <footer className="mt-3">
                                                                <cite className="not-italic">
                                                                    <span className="block text-[11px] font-black text-foreground">{story.quote_author}</span>
                                                                    {story.quote_context && <span className="mt-0.5 block font-mono text-[8px] uppercase leading-4 tracking-widest text-muted">{story.quote_context}</span>}
                                                                </cite>
                                                                {story.quote_source_url && (
                                                                    <a href={story.quote_source_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-mono text-[8px] font-black uppercase tracking-widest text-muted underline decoration-border underline-offset-4 hover:text-(--ac)">
                                                                        Ler citação na fonte <ExternalLink size={9} />
                                                                    </a>
                                                                )}
                                                            </footer>
                                                        </blockquote>
                                                    )}
                                                    <p className="mt-3 hidden text-[13px] leading-6 text-foreground/68 lg:block">{story.description}</p>
                                                    <details className="group/details mt-5 border-t border-border pt-3 lg:hidden">
                                                        <summary className="flex cursor-pointer list-none items-center justify-between font-mono text-[9px] font-black uppercase tracking-widest text-muted marker:content-none">
                                                            Contexto
                                                            <span aria-hidden="true" className="text-base font-light transition-transform group-open/details:rotate-45">+</span>
                                                        </summary>
                                                        <p className="mt-3 text-[13px] leading-6 text-foreground/68">{story.description}</p>
                                                    </details>
                                                </div>
                                                <div className="relative mt-6 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[9px] font-black uppercase tracking-widest">
                                                    {story.visual_source_url && (
                                                        <a href={story.visual_source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted hover:text-(--ac)">
                                                            Fonte da imagem <ExternalLink size={10} />
                                                        </a>
                                                    )}
                                                    {groupName && !story.hasCuratedVisual && (
                                                        <Link href={`/groups/${story.group!.slug}`} prefetch={false} className="inline-flex items-center gap-1 text-muted hover:text-(--ac)">
                                                            Ver {groupName} <ChevronRight size={10} />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── CONTEXTO DOS DADOS ──────────────────────────────── */}
                <aside className="profile-panel relative overflow-hidden" aria-labelledby="chave-leitura-agencia">
                    <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 [background:var(--ac)]" />
                    <div aria-hidden="true" className="absolute -right-8 -top-12 hidden font-black text-[150px] leading-none text-foreground/2.5 sm:block">
                        {mark}
                    </div>
                    <div className="relative grid gap-5 p-5 sm:gap-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
                        <div>
                            <div className="flex items-center gap-2 text-(--ac)">
                                <BookOpenCheck size={15} />
                                <p className="profile-kicker">{editorialLens.eyebrow}</p>
                            </div>
                            <h2 id="chave-leitura-agencia" className="mt-3 max-w-3xl text-lg font-black leading-tight tracking-tight sm:text-2xl">
                                {editorialLens.title}
                            </h2>
                            <p className="mt-3 max-w-3xl text-[13px] leading-6 text-foreground/70 sm:text-[14px] sm:leading-7">
                                {editorialLens.body}
                            </p>
                        </div>
                        <div className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                            <div className="flex items-center gap-2 text-(--ac)">
                                <Network size={14} />
                                <span className="font-mono text-[9px] font-black uppercase tracking-[0.14em]">Escopo desta página</span>
                            </div>
                            <p className="mt-3 text-[12px] leading-5 text-muted">
                                {network.organizations.length > 1
                                    ? `${network.organizations.length} organizações conectadas · ${allGroups.length} grupos · ${allArtists.length} perfis.`
                                    : `${allGroups.length} grupos e ${allArtists.length} perfis relacionados no acervo editorial.`}
                            </p>
                        </div>
                    </div>
                </aside>

                {ADSENSE.slots.inline && (
                    <AdSlotInline
                        slot={ADSENSE.slots.inline}
                        analyticsPlacement="agency_profile_mid"
                    />
                )}

                {businessPillars.length > 0 && (
                    <section id="modelo" className="scroll-mt-(--scroll-anchor-offset,106px)">
                        <SectionHeader label={pillarsHeading.label} title={pillarsHeading.title} count={businessPillars.length} />
                        <p className="profile-content-measure -mt-2 text-[14px] leading-6 text-muted">
                            Frentes declaradas pela própria organização, contextualizadas para distinguir produção musical, plataformas e outras operações.
                        </p>
                        <div className={`mt-6 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 ${businessPillars.length >= 3 ? 'lg:grid-cols-3' : ''} ${businessPillars.length === 4 ? 'xl:grid-cols-4' : ''}`}>
                            {businessPillars.map((pillar, index) => (
                                <article key={`${pillar.title}-${index}`} className="bg-background p-6 sm:min-h-56">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="font-mono text-[10px] font-black tabular-nums text-(--ac)">0{index + 1}</span>
                                        {pillar.source_url && (
                                            <a href={pillar.source_url} target="_blank" rel="noopener noreferrer" aria-label={`Fonte do pilar ${pillar.title}`} className="text-muted transition-colors hover:text-foreground">
                                                <ExternalLink size={13} />
                                            </a>
                                        )}
                                    </div>
                                    <h3 className="mt-8 text-xl font-black tracking-tight">{pillar.title}</h3>
                                    <p className="mt-3 text-[13px] leading-6 text-foreground/70">{pillar.description}</p>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {currentDevelopments.length > 0 && (
                    <section id="agora" className="scroll-mt-(--scroll-anchor-offset,106px)">
                        <SectionHeader label="Atualizações" title={`O que mudou recentemente na ${name}`} count={currentDevelopments.length} />
                        <div className="mt-6 grid overflow-hidden border border-border bg-border lg:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)] lg:gap-px">
                            <figure className="relative min-h-[360px] overflow-hidden bg-surface lg:min-h-[560px]">
                                {currentVisualImage ? (
                                    <Image
                                        src={currentVisualImage.src}
                                        alt={`${stripHtml(currentVisualGroup!.title.rendered)}, grupo relacionado à ${name}`}
                                        fill
                                        className="object-cover object-top"
                                        sizes="(max-width: 1024px) 100vw, 45vw"
                                    />
                                ) : (
                                    <div className="absolute inset-0 [background:var(--ac-15)]" />
                                )}
                                <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-white/60">A escala no acervo</p>
                                    <div className="mt-4 grid grid-cols-3 gap-px border border-white/20 bg-white/20">
                                        <div className="bg-black/65 p-3 backdrop-blur-xs"><strong className="block text-2xl font-black">{allGroups.length}</strong><span className="font-mono text-[8px] uppercase tracking-wider text-white/60">grupos</span></div>
                                        <div className="bg-black/65 p-3 backdrop-blur-xs"><strong className="block text-2xl font-black">{allArtists.length}</strong><span className="font-mono text-[8px] uppercase tracking-wider text-white/60">perfis</span></div>
                                        <div className="bg-black/65 p-3 backdrop-blur-xs"><strong className="block text-2xl font-black">{businessPillars.length}</strong><span className="font-mono text-[8px] uppercase tracking-wider text-white/60">frentes</span></div>
                                    </div>
                                    <figcaption className="mt-4 max-w-md text-[11px] leading-5 text-white/55">
                                        {currentVisualGroup ? `${stripHtml(currentVisualGroup.title.rendered)} integra o recorte visual desta página. Os números representam a cobertura disponível no ${SITE_NAME}.` : `Os números representam a cobertura disponível no ${SITE_NAME}.`}
                                    </figcaption>
                                </div>
                            </figure>
                            <div className="divide-y divide-border bg-background">
                            {currentDevelopments.map((item, index) => {
                                const date = /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? new Date(`${item.date}T00:00:00Z`) : null
                                const dateLabel = date && !Number.isNaN(date.getTime())
                                    ? new Intl.DateTimeFormat(intlLocale(), { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date)
                                    : item.date
                                return (
                                    <article key={`${item.date}-${item.title}`} className="group relative min-h-44 overflow-hidden bg-background p-6 sm:p-7">
                                        <span aria-hidden="true" className="absolute -right-3 -top-7 font-mono text-[96px] font-black leading-none text-foreground/2.5">0{index + 1}</span>
                                        <div className="relative flex h-full flex-col">
                                            <time dateTime={item.date} className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-(--ac)">{dateLabel}</time>
                                            <h3 className="mt-5 max-w-xl text-xl font-black leading-tight tracking-tight">{item.title}</h3>
                                            <p className="mt-3 text-[13px] leading-6 text-foreground/70">{item.description}</p>
                                            {item.source_url && (
                                                <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1.5 pt-4 font-mono text-[9px] uppercase tracking-widest text-muted transition-colors hover:text-foreground">
                                                    Conferir fonte <ExternalLink size={10} />
                                                </a>
                                            )}
                                        </div>
                                    </article>
                                )
                            })}
                            </div>
                        </div>
                    </section>
                )}

                {agencyVideos.length > 0 && (
                    <GroupMVPlayer
                        videos={agencyVideos}
                        accent={interfaceAccent}
                        eyebrow="Para ver e ouvir"
                        title={`Assista ao catálogo ligado à ${name}`}
                        description="Uma seleção de vídeos oficiais dos grupos relacionados ajuda a perceber, em imagem e som, a variedade de identidades que convivem sob a mesma estrutura corporativa."
                    />
                )}

                {/* ── SOBRE ────────────────────────────────────────────── */}
                {narrativeChapters.length === 0 && <section id="sobre" className="scroll-mt-(--scroll-anchor-offset,106px)">
                    <SectionHeader label="Perfil institucional" title="Contexto e trajetória" count={null} />
                    <div className="mt-6 border-l-2 border-(--ac) pl-4 sm:pl-6">
                        {contentHtml ? (
                            <div className="max-w-4xl">
                                <div
                                    className="profile-prose prose prose-base max-w-none prose-headings:font-black prose-a:text-accent prose-a:no-underline dark:prose-invert prose-a:hover:underline"
                                    dangerouslySetInnerHTML={{ __html: contentLead }}
                                />
                                {contentRest && (
                                    <CollapsibleProse label="Continuar a leitura">
                                        <div
                                            className="profile-prose prose prose-base max-w-none prose-headings:font-black prose-a:text-accent dark:prose-invert"
                                            dangerouslySetInnerHTML={{ __html: contentRest }}
                                        />
                                    </CollapsibleProse>
                                )}
                            </div>
                        ) : (
                            <p className="text-[15px] leading-[1.85] text-foreground/80 max-w-3xl">{excerptText || aboutFallback}</p>
                        )}
                    </div>
                </section>}

                {/* ── CONQUISTAS ───────────────────────────────────────── */}
                {narrativeChapters.length === 0 && achievements.length > 0 && (
                    <section id="conquistas" className="scroll-mt-(--scroll-anchor-offset,106px)">
                        <SectionHeader label="Impacto" title="Marcos e impacto" count={achievements.length} />
                        <div className={`profile-panel mt-6 grid gap-0 overflow-hidden ${achievements.length > 1 ? 'lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]' : ''}`}>
                            <div className={`p-6 lg:p-8 ${achievements.length > 1 ? 'border-b border-border/70 lg:border-b-0 lg:border-r' : ''}`}>
                                <Trophy size={22} className="mb-5 text-(--ac)" />
                                <p className="profile-kicker mb-3 text-(--ac)">Marco principal</p>
                                <p className="max-w-2xl text-xl font-black leading-snug tracking-tight sm:text-2xl">{achievements[0]}</p>
                            </div>
                            {achievements.length > 1 && (
                                <div className="divide-y divide-border/70">
                                    {achievements.slice(1, 5).map((a, i) => (
                                        <div key={i} className="group flex items-start gap-3 p-4 transition-colors hover:bg-foreground/2.5">
                                            <Trophy size={14} className="mt-0.5 shrink-0 text-(--ac) opacity-70" />
                                            <p className="text-[13px] leading-snug">{a}</p>
                                        </div>
                                    ))}
                                    {achievements.length > 5 && (
                                        <details className="group/details">
                                            <summary className="cursor-pointer list-none p-4 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-muted transition-colors hover:text-foreground marker:content-none">
                                                <span className="inline-flex items-center gap-2">
                                                    <ChevronRight size={12} className="transition-transform group-open/details:rotate-90" />
                                                    Ver mais {achievements.length - 5} marcos
                                                </span>
                                            </summary>
                                            <div className="divide-y divide-border/70 border-t border-border/70">
                                                {achievements.slice(5).map((a, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-4">
                                                        <Trophy size={14} className="mt-0.5 shrink-0 text-(--ac) opacity-70" />
                                                        <p className="text-[13px] leading-snug">{a}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ── ECOSSISTEMA CORPORATIVO ────────────────────────── */}
                <AgencyOrganizationMap agency={agency} network={network} groups={allGroups} artists={allArtists} />

                {ADSENSE.slots.leaderboard && (allGroups.length > 0 || allArtists.length > 0) && (
                    <AdSlotInline
                        slot={ADSENSE.slots.leaderboard}
                        layout="leaderboard"
                        analyticsPlacement="agency_profile_leaderboard"
                    />
                )}

                {/* ── CATÁLOGO ─────────────────────────────────────────── */}
                {allGroups.length > 0 && (
                    <section id="catalogo" className="scroll-mt-(--scroll-anchor-offset,106px)">
                        <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-1 shrink-0 [background:var(--ac)]" />
                                <div>
                                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Elenco</p>
                                    <h2 className="text-xl font-black tracking-[-0.03em]">Um mapa visual do catálogo</h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-[10px] text-muted tabular-nums">{allGroups.length} total</span>
                                {activeGroups.length > 0 && (
                                    <span className="font-mono text-[10px] px-2 py-0.5 [background:var(--ac-08)] text-(--ac) border border-(--ac-15)">
                                        {activeGroups.length} ativos
                                    </span>
                                )}
                            </div>
                        </div>

                        <p className="mt-4 max-w-3xl text-[13px] leading-6 text-muted">
                            Comece pelos destaques e avance pelas gerações. A relação pode ser direta ou ocorrer por meio de uma label ou subsidiária; cada perfil detalha o vínculo específico.
                        </p>

                        {/* Featured 4 — abertura visual assimétrica */}
                        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
                            {featuredGroups.map((group, index) => {
                                const img = getWPImage(group._embedded, group.featured_image_url)
                                const gname = stripHtml(group.title.rendered)
                                const debutYear = getYear(group.acf?.debut_date)
                                const isActive = group.acf?.active !== false
                                const groupColor = optionalAccent(group.acf?.color)
                                const groupStyle: CSSVariableProperties | undefined = groupColor ? { '--gc': groupColor } : undefined
                                return (
                                    <Link
                                        key={group.id}
                                        href={`/groups/${group.slug}`}
                                        prefetch={false}
                                        style={groupStyle}
                                        className={`group relative min-h-[210px] overflow-hidden border border-border bg-surface transition-all duration-300 [border-top:3px_solid_var(--gc,var(--ac))] hover:border-foreground/30 hover:shadow-2xl motion-safe:hover:-translate-y-1 motion-reduce:transition-none ${index === 0 ? 'col-span-2 min-h-[330px] md:row-span-2 md:min-h-[470px]' : index === 3 ? 'col-span-2 md:min-h-0' : 'md:min-h-0'}`}
                                    >
                                        <div className="absolute inset-0 overflow-hidden">
                                            {img ? (
                                                <Image
                                                    src={img.src}
                                                    alt={gname}
                                                    fill
                                                    className="object-cover object-top group-hover:scale-[1.06] transition-transform duration-700"
                                                    sizes={index === 0 ? '(max-width: 768px) 100vw, 50vw' : index === 3 ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-surface">
                                                    <span className="text-[64px] font-black text-muted/10">{gname[0]}</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />
                                            {index === 0 && (
                                                <span className="absolute left-4 top-4 border border-white/25 bg-black/45 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-white backdrop-blur-xs">
                                                    Comece por aqui
                                                </span>
                                            )}
                                            <div className={`absolute inset-x-0 bottom-0 ${index === 0 ? 'p-5 sm:p-7' : 'p-4'}`}>
                                                <div className={`inline-block px-1.5 py-0.5 font-mono text-[8px] font-black text-white mb-2 ${isActive ? '[background:var(--gc,var(--ac))]' : 'bg-muted/60'}`}>
                                                    {isActive ? 'Ativo' : 'Inativo'}
                                                </div>
                                                <p className={`font-black leading-tight text-white ${index === 0 ? 'text-2xl sm:text-3xl' : 'text-[17px]'}`}>{gname}</p>
                                                {group.acf?.name_hangul && (
                                                    <p className="text-white/50 font-mono text-[10px] mt-0.5">{group.acf.name_hangul}</p>
                                                )}
                                                {debutYear && (
                                                    <p className="font-mono text-[9px] text-white/35 mt-1.5">desde {debutYear}</p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>

                        {/* Remaining groups by generation */}
                        {groupsByGen.length > 0 && (
                            <div className="mt-10 space-y-8">
                                {groupsByGen.map(gen => (
                                    <div key={gen.label}>
                                        <div className="flex items-center gap-3 mb-4 border-b border-border/30 pb-3">
                                            <span className="font-mono text-[10px] font-black uppercase tracking-[0.12em] border border-border px-2 py-1"
                                                style={{ borderColor: toRgba(interfaceAccent, 0.4), color: interfaceAccent }}>
                                                {gen.shortLabel}
                                            </span>
                                            <span className="font-mono text-[11px] font-semibold text-muted">{gen.label}</span>
                                            <span className="font-mono text-[10px] text-muted/40">
                                                {gen.from}–{gen.to === 9999 ? 'hoje' : gen.to}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {gen.items.map(group => (
                                                <GroupCard key={group.id} group={group} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {groupsWithoutGeneration.length > 0 && (
                            <div className="mt-10">
                                <div className="mb-4 flex items-center gap-3 border-b border-border/30 pb-3">
                                    <span className="border border-border px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-muted">
                                        Outros
                                    </span>
                                    <span className="font-mono text-[11px] text-muted">Sem geração informada</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                    {groupsWithoutGeneration.map(group => (
                                        <GroupCard key={group.id} group={group} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Inativos / Disbandados */}
                        {inactiveGroups.length > 0 && (
                            <div className="mt-10">
                                <div className="flex items-center gap-3 mb-4 border-b border-border/20 pb-3">
                                    <span className="font-mono text-[10px] font-black uppercase tracking-[0.12em] border border-border/30 px-2 py-1 text-muted">
                                        Legado
                                    </span>
                                    <span className="font-mono text-[11px] text-muted">Grupos inativos ou disbandados</span>
                                    <span className="font-mono text-[10px] text-muted/40">{inactiveGroups.length}</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 opacity-60">
                                    {inactiveGroups.map(group => (
                                        <GroupCard key={group.id} group={group} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* ── ARTISTAS ─────────────────────────────────────────── */}
                {allArtists.length > 0 && (
                    <section id="artistas" className="scroll-mt-(--scroll-anchor-offset,106px)">
                        <SectionHeader label="Perfis relacionados" title="Artistas" count={allArtists.length} />

                        {/* Spotlight — perfil com maior sinal editorial de destaque */}
                        {topArtist && (() => {
                            const img = getWPImage(topArtist._embedded, topArtist.featured_image_url)
                            const aname = stripHtml(topArtist.title.rendered)
                            const roles = topArtist.acf?.roles ?? []
                            return (
                                <Link href={`/artists/${topArtist.slug}`} prefetch={false} className="group mt-6 mb-8 flex items-stretch gap-0 border border-border bg-surface overflow-hidden hover:border-(--ac) transition-colors">
                                    <div className="relative w-[120px] sm:w-[160px] shrink-0 aspect-3/4">
                                        {img ? (
                                            <Image src={img.src} alt={aname} fill
                                                className="object-cover object-top group-hover:scale-[1.04] transition-transform duration-500"
                                                sizes="160px" />
                                        ) : (
                                            <div className="w-full h-full [background:var(--ac-08)] flex items-center justify-center">
                                                <span className="font-black text-[48px] text-(--ac) opacity-30">{aname[0]}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-between p-5 sm:p-7 flex-1 min-w-0 [border-left:2px_solid_var(--ac)]">
                                        <div>
                                            <span className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-(--ac) mb-3 block">
                                                ● Perfil em destaque
                                            </span>
                                            <p className="text-[24px] sm:text-[32px] font-black leading-tight tracking-tight group-hover:text-(--ac) transition-colors">{aname}</p>
                                            {topArtist.acf?.name_hangul && (
                                                <p className="font-mono text-[13px] text-muted mt-1">{topArtist.acf.name_hangul}</p>
                                            )}
                                            {roles.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {roles.slice(0, 3).map(r => (
                                                        <span key={r} className="font-mono text-[9px] uppercase tracking-wider border border-border px-2 py-1 text-muted">{r}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-mono text-[11px] text-muted/60 mt-4 flex items-center gap-1 group-hover:text-muted transition-colors">
                                            Ver perfil completo <ChevronRight size={11} />
                                        </p>
                                    </div>
                                </Link>
                            )
                        })()}

                        <ExpandableArtistGrid
                            artists={[...allArtists]
                                .sort((a, b) => (b.acf?.trending_score ?? 0) - (a.acf?.trending_score ?? 0))
                                .filter(a => a.id !== topArtist?.id)}
                            accent={interfaceAccent}
                            initialCount={11}
                        />
                    </section>
                )}

                {/* ── ARTIGOS ─────────────────────────────────────────── */}
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

                {/* ── TRANSPARÊNCIA EDITORIAL ──────────────────────────── */}
                {sourcesByHost.length > 0 && (
                    <AgencySources citedSourcesCount={citedSources.length} sourcesByHost={sourcesByHost} />
                )}
            </div>
        </div>
    )
}

