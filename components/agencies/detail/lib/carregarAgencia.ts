import { SITE_NAME } from '@/lib/constants/site'
import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { localizeEntity } from '@/lib/i18n/entity-translation'
import { href } from '@/lib/i18n/routes'
import { intlLocale } from '@/lib/i18n/format'
import { getAgencies, getAgencyBySlug } from '@/lib/wordpress/agencies'
import { getArtists } from '@/lib/wordpress/artists'
import { getGroups } from '@/lib/wordpress/groups'
import { getPosts } from '@/lib/wordpress/posts'
import { SITE_URL } from '@/lib/constants/site'
import { getWPImage, stripHtml, getYear } from '@/lib/utils'
import { buildBreadcrumbSchema } from '@/lib/seo/jsonld'
import { type FactItem } from '@/components/blocks/FactGrid'
import { type EntityFAQItem } from '@/components/seo/EntityFAQ'
import { splitContentForAd } from '@/lib/utils/injectAd'
import { entityBelongsToOrganizations, resolveAgencyNetwork } from '@/lib/agencies/network'
import { getStoreProductsByGroupId, type StoreProduct } from '@/lib/wordpress/store'
import { ordenarPrateleira } from '@/lib/wordpress/store-ranking'
import { applyAgencyDirectoryManifestPreview, applyAgencyManifestPreview, applyEntityAffiliationsManifestPreview } from '@/lib/agencies/preview'
import { agencyMark, accessibleAccent, normalizeAccent, toRgba, type CSSVariableProperties } from '@/lib/agencies/presentation'
import { BIG4_SLUGS, GENERATIONS } from '@/components/agencies/detail/lib/helpers'

const TIPOS = { major: 1, mid: 1, indie: 1, subsidiary: 1 } as const
const KINDS = { conglomerate: 1, label: 1, agency: 1, joint_venture: 1, division: 1 } as const

// Tudo o que a página da agência precisa, já resolvido: os componentes de
// seção só desenham. Devolve null quando a agência não existe.
export async function carregarAgencia(slug: string, locale: Locale = DEFAULT_LOCALE) {
    const sourceAgency = await getAgencyBySlug(slug)
    if (!sourceAgency) return null
    const agency = localizeEntity(await applyAgencyManifestPreview(sourceAgency), locale, 'agency')

    const ui = await getTranslations({ locale, namespace: 'entity.agency.ui' })
    const country = !agency.country || agency.country === 'KR' || agency.country === 'Korea, Republic of' ? ui('countryKR') : agency.country
    const name = stripHtml(agency.title.rendered)
    const mark = agencyMark(name)
    const logo = getWPImage(agency._embedded, agency.featured_image_url)
    const acf = agency.acf ?? {}
    const accent = normalizeAccent(agency.accent_color)
    const interfaceAccent = accessibleAccent(accent)
    const isBig4 = BIG4_SLUGS.has(slug)
    const tierLabel = isBig4
        ? ui('tierBig4')
        : agency.agency_type && agency.agency_type in TIPOS ? ui(`types.${agency.agency_type as keyof typeof TIPOS}`) : null
    const entityLabel = acf.organization_kind && acf.organization_kind in KINDS ? ui(`kinds.${acf.organization_kind as keyof typeof KINDS}`)
        : (agency.agency_type === 'indie' ? ui('entityIndie') : ui('entityDefault'))
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
    const pageUrl = `${SITE_URL}${href('agency', { slug }, locale)}`
    const updatedAtLabel = agency.modified
        ? new Intl.DateTimeFormat(intlLocale(locale), { month: 'long', year: 'numeric' }).format(new Date(agency.modified))
        : null
    const leadershipUpdatedDate = /^\d{4}-\d{2}-\d{2}$/.test(acf.leadership_updated_at ?? '')
        ? new Date(`${acf.leadership_updated_at}T00:00:00Z`)
        : null
    const leadershipUpdatedLabel = leadershipUpdatedDate && !Number.isNaN(leadershipUpdatedDate.getTime())
        ? new Intl.DateTimeFormat(intlLocale(locale), { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(leadershipUpdatedDate)
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
    const productsPorGrupo = await Promise.all(allGroups.map(g => getStoreProductsByGroupId(g.id)))
    const produtosPorId = new Map<number, StoreProduct>()
    productsPorGrupo.flat().forEach(p => { if (!produtosPorId.has(p.id)) produtosPorId.set(p.id, p) })
    const shopProducts = ordenarPrateleira([...produtosPorId.values()], `agencia:${slug}`).slice(0, 8)

    const agencyVideos = (acf.featured_videos?.length
        ? acf.featured_videos
        : activeGroups
            .filter(group => group.acf?.mv_url)
            .map(group => ({ title: ui('videoTitle', { group: stripHtml(group.title.rendered) }), url: group.acf!.mv_url! })))
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
            eyebrow: ui('lens.network.eyebrow'),
            title: ui('lens.network.title', { name }),
            body: ui('lens.network.body', { site: SITE_NAME }),
        }
        : acf.organization_kind === 'label' || agency.agency_type === 'subsidiary'
            ? {
                eyebrow: ui('lens.piece.eyebrow'),
                title: ui('lens.piece.title', { name }),
                body: ui('lens.piece.body'),
            }
            : {
                eyebrow: ui('lens.data.eyebrow'),
                title: ui('lens.data.title'),
                body: ui('lens.data.body', { site: SITE_NAME }),
            }
    const pillarsHeading = acf.organization_kind === 'conglomerate'
        ? { label: ui('pillars.conglomerate.label'), title: ui('pillars.conglomerate.title', { name }) }
        : acf.organization_kind === 'joint_venture'
            ? { label: ui('pillars.joint_venture.label'), title: ui('pillars.joint_venture.title', { name }) }
            : acf.organization_kind === 'label'
                ? { label: ui('pillars.label.label'), title: ui('pillars.label.title', { name }) }
                : { label: ui('pillars.other.label'), title: ui('pillars.other.title', { name }) }
    const aboutFallback = [
        ui('about1', { name, country }),
        originYear ? ui('about2', { year: originYear }) : null,
        allGroups.length || allArtists.length
            ? ui('about3', { site: SITE_NAME, groups: allGroups.length, artists: allArtists.length })
            : null,
    ].filter(Boolean).join(' ')

    // A capa precisa contextualizar a agência sem transformar o elenco em textura.
    const visualContext = businessPillars
        .map(pillar => `${pillar.title} ${pillar.description}`)
        .join(' ')
        .toLocaleLowerCase(intlLocale(locale))
    const heroVisuals = [...groupsSorted]
        .filter(g => getWPImage(g._embedded, g.featured_image_url))
        .sort((first, second) => {
            const firstMentioned = visualContext.includes(stripHtml(first.title.rendered).toLocaleLowerCase(intlLocale(locale)))
            const secondMentioned = visualContext.includes(stripHtml(second.title.rendered).toLocaleLowerCase(intlLocale(locale)))
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
    const chapterCountLabel = ui('chapterCount', { count: narrativeChapters.length })
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
        { name: ui('breadcrumb'), url: `${SITE_URL}${href('agencies', undefined, locale)}` },
        { name, url: pageUrl },
    ])

    // Build nav anchors dynamically
    const navLinks = [
        { href: '#sobre', label: ui('nav.about') },
        ...(keyMetrics.length > 0 ? [{ href: '#numeros', label: ui('nav.numbers') }] : []),
        ...(narrativeChapters.length > 0 || milestones.length > 0 ? [{ href: '#historia', label: ui('nav.history') }] : []),
        ...(narrativeChapters.length === 0 && achievements.length > 0 ? [{ href: '#conquistas', label: ui('nav.impact') }] : []),
        ...(businessPillars.length > 0 ? [{ href: '#modelo', label: ui('nav.model') }] : []),
        ...(currentDevelopments.length > 0 ? [{ href: '#agora', label: ui('nav.now') }] : []),
        ...(agencyVideos.length > 0 ? [{ href: '#mvs', label: ui('nav.videos') }] : []),
        ...(network.organizations.length > 1 ? [{ href: '#ecossistema', label: ui('nav.ecosystem') }] : []),
        ...(allGroups.length > 0 ? [{ href: '#catalogo', label: ui('nav.groups') }] : []),
        ...(allArtists.length > 0 ? [{ href: '#artistas', label: ui('nav.artists') }] : []),
        ...(relatedPosts.length > 0 ? [{ href: '#artigos', label: ui('nav.articles') }] : []),
        { href: '#faq', label: ui('nav.faq') },
    ]
    const pageStyle: CSSVariableProperties = {
        '--ac': interfaceAccent,
        '--ac-brand': accent,
        '--ac-08': toRgba(interfaceAccent, 0.08),
        '--ac-15': toRgba(interfaceAccent, 0.15),
    }
    const summaryFacts = [
        { label: ui('facts.country'), value: country },
        acf.ceo && leadershipUpdatedLabel && {
            label: ui('facts.ceo'),
            value: acf.ceo,
            description: ui('facts.verifiedOn', { date: leadershipUpdatedLabel }),
        },
        originYear && {
            label: ui('facts.trajectory'),
            value: currentIdentitySince ? ui('facts.trajectoryBoth', { origin: originYear, since: currentIdentitySince }) : ui('facts.trajectorySince', { year: originYear }),
        },
        { label: ui('facts.coverage', { site: SITE_NAME }), value: ui('facts.coverageValue', { groups: allGroups.length, artists: allArtists.length }) },
    ].filter(Boolean) as FactItem[]
    const faqItems = [
        {
            question: ui('faq.q1', { name }),
            answer: originYear ? ui('faq.a1Since', { name, country, year: originYear, site: SITE_NAME }) : ui('faq.a1', { name, country, site: SITE_NAME }),
        },
        allGroups.length > 0
            ? {
                question: ui('faq.q2', { name }),
                answer: ui('faq.a2', { site: SITE_NAME, count: allGroups.length, name }),
            }
            : null,
        allArtists.length > 0
            ? {
                question: ui('faq.q3', { name }),
                answer: ui('faq.a3', { site: SITE_NAME, count: allArtists.length, name }),
            }
            : null,
        isBig4
            ? {
                question: ui('faq.q4', { name }),
                answer: ui('faq.a4', { name }),
            }
            : null,
    ].filter(Boolean).slice(0, 5) as EntityFAQItem[]
    return {
        slug,
        locale,
        
        agency,
        name,
        mark,
        logo,
        acf,
        accent,
        interfaceAccent,
        isBig4,
        tierLabel,
        entityLabel,
        milestones,
        originYear,
        achievements,
        businessPillars,
        currentDevelopments,
        contentHtml,
        contentLead,
        contentRest,
        excerptText,
        pageUrl,
        updatedAtLabel,
        network,
        allArtists,
        allGroups,
        shopProducts,
        relatedPosts,
        activeGroups,
        inactiveGroups,
        featuredGroups,
        currentVisualGroup,
        currentVisualImage,
        agencyVideos,
        groupsByGen,
        groupsWithoutGeneration,
        topArtist,
        editorialLens,
        pillarsHeading,
        aboutFallback,
        heroImages,
        editorialVisualStories,
        narrativeChapters,
        chapterCountLabel,
        keyMetrics,
        citedSources,
        sourcesByHost,
        breadcrumbSchema,
        navLinks,
        pageStyle,
        summaryFacts,
        faqItems,
    }
}

export type AgencyView = NonNullable<Awaited<ReturnType<typeof carregarAgencia>>>
