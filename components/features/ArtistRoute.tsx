import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArtistBySlug, getArtistsByIds, getRelatedArtists } from '@/lib/wordpress/artists'
import { getProductionsByArtist } from '@/lib/wordpress/productions'
import { getGroupsByIds, getGroupsByMemberId } from '@/lib/wordpress/groups'
import { getPosts, getCategories } from '@/lib/wordpress/posts'
import { getAgencyById } from '@/lib/wordpress/agencies'
import { SITE_URL, buildOgImageUrl } from '@/lib/constants/site'
import { stripHtml, getWPImage } from '@/lib/utils'
import { buildWordPressMetadata } from '@/lib/seo/wordpress'
import { WpEditSetter } from '@/components/ui/WpEditContext'
import { ArtistDetailPage } from '@/components/features/ArtistDetailPage'
import { getHubsForArtist } from '@/lib/guias/hub-lookup'
import { getMusicReleases } from '@/lib/wordpress/music'
import type { DiscographyAlbum } from '@/components/groups/GroupDiscography'
import { applyArtistManifestPreview, applyArtistProductionsPreview } from '@/lib/agencies/preview'
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
 * Ficha de artista, compartilhada entre idiomas — ver D2 em
 * docs/I18N-ARQUITETURA.md. As rotas de `app/(site)` e `app/(intl)/[locale]`
 * só resolvem o slug e o idioma e delegam para cá.
 *
 * Em outro idioma, a ficha só existe com tradução publicada (`hasLocale`) e o
 * texto vem da sobreposição `translations` (lib/i18n/entity-translation.ts).
 */
export async function buildArtistMetadata(slug: string, locale: Locale): Promise<Metadata> {
    const found = await getArtistBySlug(slug)
    if (!found || !hasLocale(found, locale)) return {}
    const artist = localizeEntity(found, locale, 'artist')
    const t = await getTranslations({ locale, namespace: 'entity' })

    const name = stripHtml(artist.title.rendered)
    const image = getWPImage(artist._embedded, artist.featured_image_url, name)
    const url = `${SITE_URL}${href('artist', { slug }, locale)}`

    // Título manual do Rank Math tem prioridade; fallback mantém a palavra-chave do perfil.
    const title = (artist.meta?.rank_math_title as string | undefined) || t('artist.metaTitle', { name })
    const description = (artist.meta?.rank_math_description as string | undefined)
        || (artist.content.rendered
            ? metaDescription(stripHtml(artist.content.rendered))
            : t('artist.metaDescription', { name }))

    const ogImage = buildOgImageUrl({
        title,
        subtitle: description,
        image: image?.src,
        type: 'artist',
    })

    return buildWordPressMetadata({
        title,
        description,
        url,
        image,
        ogImageOverride: ogImage,
        languages: buildAlternates('artist', { slug }, locale, availableLocales(found)).languages,
        ogLocale: LOCALE_META[locale].ogLocale,
    })
}

export async function ArtistRoute({ slug, locale }: { slug: string; locale: Locale }) {
    const sourceArtist = await getArtistBySlug(slug)
    if (!sourceArtist || !hasLocale(sourceArtist, locale)) notFound()
    const [languageLinks, tSwitcher] = await Promise.all([
        buildLanguageLinks('artist', { slug }, locale, availableLocales(sourceArtist)),
        getTranslations({ locale, namespace: 'entity.switcher' }),
    ])
    const artist = localizeEntity(await applyArtistManifestPreview(sourceArtist), locale, 'artist')

    const groupIds = artist.acf?.groups ?? []

    const [productionsRaw, groups, { items: relatedPosts }, agency, wpReleases, categories] = await Promise.all([
        getProductionsByArtist(slug),
        groupIds.length > 0 ? getGroupsByIds(groupIds) : getGroupsByMemberId(artist.id),
        getPosts({ mentionsType: 'artist', mentionsSlug: slug, perPage: 4, orderby: 'date', includeContent: false }),
        artist.acf?.agency ? getAgencyById(artist.acf.agency) : Promise.resolve(null),
        getMusicReleases({ artistId: artist.id }),
        getCategories(),
    ])
    const productions = await applyArtistProductionsPreview(slug, productionsRaw)
    const categoryMap = Object.fromEntries(categories.map(c => [c.id, { name: c.name, slug: c.slug }]))

    const discography: DiscographyAlbum[] = wpReleases.map(r => ({
        id: String(r.id),
        title: r.title,
        type: r.release_type === 'album' ? 'ALBUM'
            : r.release_type === 'ep' ? 'EP'
            : r.release_type === 'compilation' ? 'COMPILATION'
            : 'SINGLE',
        releaseYear: r.release_date ? parseInt(r.release_date.slice(0, 4)) : null,
        coverUrl: r.cover_url,
        spotifyUrl: r.spotify_url ?? '',
        tracks: [],
    }))

    const connectionGroup = groups.find(group => group.acf?.active !== false) ?? groups[0]
    const groupMemberIds = (connectionGroup?.acf?.members ?? []).filter(id => id !== artist.id)
    const primaryRole = artist.acf?.roles?.[0] ?? undefined
    const relatedArtists = groupMemberIds.length > 0
        ? await getArtistsByIds(groupMemberIds.slice(0, 10))
        : await getRelatedArtists(artist.id, artist.acf?.agency ?? undefined, primaryRole)

    const relatedHubs = getHubsForArtist(artist)

    return (
        <>
        <WpEditSetter postId={artist.id} postType="artist" />
            {languageLinks.length > 0 && <LanguageSwitcher availableIn={tSwitcher('availableIn')} dismissLabel={tSwitcher('dismiss')} links={languageLinks} />}
        <RastreioDeRolagem caminho={href('artist', { slug }, locale)} />
        <ArtistDetailPage
            artist={artist}
            productions={productions}
            groups={groups}
            relatedPosts={locale === DEFAULT_LOCALE ? relatedPosts : []}
            categoryMap={categoryMap}
            agency={agency ?? undefined}
            relatedArtists={relatedArtists}
            connectionGroup={groupMemberIds.length > 0 ? connectionGroup : undefined}
            discography={discography}
            relatedHubs={relatedHubs}
        />
        </>
    )
}
