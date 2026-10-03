import { SITE_NAME } from '@/lib/constants/site'
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
import { applyAgencyDirectoryManifestPreview, applyAgencyManifestPreview, applyEntityAffiliationsManifestPreview } from '@/lib/agencies/preview'
import { agencyMark, accessibleAccent, countryLabel, normalizeAccent, toRgba, type CSSVariableProperties, AGENCY_TYPE_LABELS, ORGANIZATION_KIND_LABELS } from '@/lib/agencies/presentation'
import { BIG4_SLUGS, GENERATIONS } from '@/app/(site)/agencies/[slug]/lib/helpers'

// Tudo o que a página da agência precisa, já resolvido: os componentes de
// seção só desenham. Devolve null quando a agência não existe.
export async function carregarAgencia(slug: string) {
    const sourceAgency = await getAgencyBySlug(slug)
    if (!sourceAgency) return null
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
    return {
        slug,
        
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
