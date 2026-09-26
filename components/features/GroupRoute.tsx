import { SITE_NAME } from '@/lib/constants/site'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getGroupBySlug, getRelatedGroups } from '@/lib/wordpress/groups'
import { getArtistsByIds } from '@/lib/wordpress/artists'
import { getPosts } from '@/lib/wordpress/posts'
import { getAgencies } from '@/lib/wordpress/agencies'
import { applyAgencyDirectoryManifestPreview, applyGroupManifestPreview } from '@/lib/agencies/preview'
import { resolveEntityOrganizationContext } from '@/lib/agencies/network'
import { SITE_URL, buildOgImageUrl } from '@/lib/constants/site'
import { WpEditSetter } from '@/components/ui/WpEditContext'
import { stripHtml, getWPImage } from '@/lib/utils'
import { getMusicReleases } from '@/lib/wordpress/music'
import { parseFormerMembers } from '@/lib/profiles/groupProfile'
import type { DiscographyAlbum } from '@/components/groups/GroupDiscography'
import { buildWordPressMetadata } from '@/lib/seo/wordpress'
import { buildBreadcrumbSchema } from '@/lib/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLd'
import { GroupDetailPage } from '@/components/features/GroupDetailPage'
import { getHubsForGroup } from '@/lib/guias/hub-lookup'
import { RastreioDeRolagem } from '@/components/analytics/RastreioDeRolagem'

import { href } from '@/lib/i18n/routes'
import type { Locale } from '@/lib/i18n/config'
import { availableLocales, hasLocale, localizeEntity } from '@/lib/i18n/entity-translation'
import { buildAlternates } from '@/lib/i18n/alternates'
import { buildLanguageLinks } from '@/lib/i18n/language-links'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { DEFAULT_LOCALE, LOCALE_META } from '@/lib/i18n/config'
import { metaDescription } from '@/lib/seo/metaDescription'

/**
 * Ficha de grupo, compartilhada entre idiomas — mesmo padrão de ArtistRoute.
 * As páginas por tipo (`/groups/girl-groups` etc.) ficam só em português, em
 * `app/(site)/groups/[slug]/page.tsx`.
 */
export async function buildGroupMetadata(slug: string, locale: Locale): Promise<Metadata> {
    const found = await getGroupBySlug(slug)
    if (!found || !hasLocale(found, locale)) return {}
    const group = localizeEntity(found, locale, 'group')
    const t = await getTranslations({ locale, namespace: 'entity' })

    // Use Rank Math SEO metadata if available
    const name = stripHtml(group.title.rendered)
    const hangul = group.acf?.name_hangul
    const title = (group.meta?.rank_math_title as string | undefined) || t('group.metaTitle', { name })
    const description = (group.meta?.rank_math_description as string | undefined)
        || (group.content.rendered
            ? metaDescription(stripHtml(group.content.rendered))
            : (hangul ? t('group.metaDescriptionHangul', { name, hangul }) : t('group.metaDescription', { name })))
    const image = getWPImage(group._embedded, group.featured_image_url)
    const url = `${SITE_URL}${href('group', { slug }, locale)}`

    return buildWordPressMetadata({
        title,
        description,
        url,
        image,
        ogImageOverride: buildOgImageUrl({ title, subtitle: description, image: image?.src, type: 'group' }),
        languages: buildAlternates('group', { slug }, locale, availableLocales(found)).languages,
        ogLocale: LOCALE_META[locale].ogLocale,
    })
}

export async function GroupRoute({ slug, locale }: { slug: string; locale: Locale }) {
    const sourceGroup = await getGroupBySlug(slug)
    if (!sourceGroup || !hasLocale(sourceGroup, locale)) notFound()
    const [languageLinks, tSwitcher] = await Promise.all([
        buildLanguageLinks('group', { slug }, locale, availableLocales(sourceGroup)),
        getTranslations({ locale, namespace: 'entity.switcher' }),
    ])
    const agencyDirectory = await getAgencies({ perPage: 100, orderby: 'title', order: 'asc' })
        .then(result => result.items)
        .then(applyAgencyDirectoryManifestPreview)
        .catch(() => [])
    const group = localizeEntity(await applyGroupManifestPreview(sourceGroup, agencyDirectory), locale, 'group')
    const organizationContext = resolveEntityOrganizationContext(group, agencyDirectory)
    const agency = organizationContext.directOrganizations[0]

    const memberIds = group.acf?.members ?? []
    const groupName = stripHtml(group.title.rendered)

    const [members, { items: relatedPosts }, relatedGroups, wpReleases] = await Promise.all([
        getArtistsByIds(memberIds),
        getPosts({ mentionsType: 'group', mentionsSlug: slug, perPage: 6, orderby: 'date', includeContent: false }),
        getRelatedGroups(group.id, group.acf?.agency ?? undefined),
        getMusicReleases({ groupId: group.id }),
    ])

    // Lançamentos solo das integrantes ativas (até 6, para limitar chamadas ao WP).
    const formerSet = new Set(parseFormerMembers(group.former_member_slugs, group.slug).map(e => e.slug))
    const soloBase = members.filter(m => !formerSet.has(m.slug)).slice(0, 6)
    const soloReleases: Record<string, DiscographyAlbum[]> = {}
    await Promise.all(soloBase.map(async m => {
        const rs = await getMusicReleases({ artistId: m.id, perPage: 12 })
        if (rs.length) soloReleases[m.slug] = rs.map(r => ({
            id: String(r.id), title: r.title,
            type: r.release_type === 'album' ? 'ALBUM' : r.release_type === 'ep' ? 'EP' : r.release_type === 'compilation' ? 'COMPILATION' : 'SINGLE',
            releaseYear: r.release_date ? parseInt(r.release_date.slice(0, 4)) : null,
            coverUrl: r.cover_url, spotifyUrl: r.spotify_url ?? '', tracks: [],
        }))
    }))

    const discography: DiscographyAlbum[] = wpReleases.map(r => ({
        id: String(r.id),
        title: r.title,
        type: r.release_type === 'album' ? 'ALBUM'
            : r.release_type === 'ep' ? 'EP'
            : r.release_type === 'compilation' ? 'COMPILATION'
            : 'SINGLE',
        releaseYear: r.release_date ? parseInt(r.release_date.slice(0, 4)) : null,
        coverUrl: r.cover_url,
        spotifyUrl: r.spotify_url ?? group.acf?.spotify ?? '',
        tracks: [],
    }))

    const relatedHubs = getHubsForGroup(group)
    const t = await getTranslations({ locale, namespace: 'entity' })

    const groupUrl = `${SITE_URL}${href('group', { slug }, locale)}`
    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: `${SITE_NAME}`, url: SITE_URL },
        { name: t('breadcrumb.groups'), url: `${SITE_URL}${href('groups', undefined, locale)}` },
        { name: groupName, url: groupUrl },
    ])

    return (
        <>
            <WpEditSetter postId={group.id} postType="group" />
            {languageLinks.length > 0 && <LanguageSwitcher availableIn={tSwitcher('availableIn')} dismissLabel={tSwitcher('dismiss')} links={languageLinks} />}
            <RastreioDeRolagem caminho={href('group', { slug }, locale)} />
            <JsonLd data={breadcrumbSchema} />
            <GroupDetailPage group={group} members={members} relatedPosts={locale === DEFAULT_LOCALE ? relatedPosts : []} agency={agency} organizationContext={organizationContext} relatedGroups={relatedGroups} discography={discography} soloReleases={soloReleases} relatedHubs={relatedHubs} />
        </>
    )
}
