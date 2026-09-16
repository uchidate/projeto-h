import { SITE_NAME } from '@/lib/constants/site'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductionBySlug, getSmartRelatedProductions, getProductionGenres } from '@/lib/wordpress/productions'
import { getArtists } from '@/lib/wordpress/artists'
import { getPosts, getCategories } from '@/lib/wordpress/posts'
import { SITE_URL, buildOgImageUrl } from '@/lib/constants/site'
import { stripHtml, getWPImage } from '@/lib/utils'
import { buildWordPressMetadata } from '@/lib/seo/wordpress'
import { buildBreadcrumbSchema } from '@/lib/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLd'
import { WpEditSetter } from '@/components/ui/WpEditContext'
import { ProductionDetailPage } from '@/components/features/ProductionDetailPage'
import { getHubsForProduction } from '@/lib/guias/hub-lookup'
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
 * Ficha de produção, compartilhada entre idiomas — mesmo padrão de ArtistRoute.
 */
export async function buildProductionMetadata(slug: string, locale: Locale): Promise<Metadata> {
    const found = await getProductionBySlug(slug)
    if (!found || !hasLocale(found, locale)) return {}
    const production = localizeEntity(found, locale, 'production')

    const productionTitle = stripHtml(production.title.rendered)
    const t = await getTranslations({ locale, namespace: 'entity' })
    const productionType = t(
        production.acf?.type === 'movie' ? 'production.type.movie'
            : production.acf?.type === 'variety' ? 'production.type.variety'
            : 'production.type.drama',
    )
    // Título manual do Rank Math tem prioridade; fallback mantém nome + intenção de busca.
    const title = (production.meta?.rank_math_title as string | undefined) || t('production.metaTitle', { title: productionTitle, type: productionType })
    const description = (production.meta?.rank_math_description as string | undefined)
        || metaDescription(stripHtml(production.excerpt.rendered))
    const image = getWPImage(undefined, production.featured_image_url, title)
    const url = `${SITE_URL}${href('production', { slug }, locale)}`

    const ogImage = buildOgImageUrl({
        title,
        subtitle: description,
        image: image?.src,
        type: 'production',
    })

    return buildWordPressMetadata({
        title,
        description,
        url,
        image,
        ogImageOverride: ogImage,
        languages: buildAlternates('production', { slug }, locale, availableLocales(found)).languages,
        ogLocale: LOCALE_META[locale].ogLocale,
    })
}

export async function ProductionRoute({ slug, locale }: { slug: string; locale: Locale }) {
    const sourceProduction = await getProductionBySlug(slug)
    if (!sourceProduction || !hasLocale(sourceProduction, locale)) notFound()
    const [languageLinks, tSwitcher] = await Promise.all([
        buildLanguageLinks('production', { slug }, locale, availableLocales(sourceProduction)),
        getTranslations({ locale, namespace: 'entity.switcher' }),
    ])
    const production = localizeEntity(sourceProduction, locale, 'production')
    if (production.acf?.adult_content) notFound()

    const castDetails = production.production_cast?.length
        ? production.production_cast
        : (production.artist_slugs ?? []).map(castSlug => ({ slug: castSlug, role: '' }))
    const castSlugs = castDetails.map(item => item.slug)
    const productionTitle = stripHtml(production.title.rendered)

    const [castItems, related, { items: relatedPosts }, categories, allGenreTerms] = await Promise.all([
        castSlugs.length > 0
            ? getArtists({ slug: castSlugs.join(','), perPage: castSlugs.length }).then(r => r.items)
            : Promise.resolve([]),
        getSmartRelatedProductions({
            excludeId: production.id,
            genreId: (production.production_genre ?? [])[0],
            type: production.acf?.type,
            castSlugs,
            genres: [],
        }),
        getPosts({ search: productionTitle, perPage: 4, orderby: 'date', includeContent: false }),
        getCategories(),
        getProductionGenres(),
    ])

    const genreTermMap = Object.fromEntries(allGenreTerms.map(t => [t.id, { name: t.name, slug: t.slug }]))
    const genres = (production.production_genre ?? [])
        .map(id => genreTermMap[id])
        .filter((t): t is { name: string; slug: string } => !!t)
        .map((t, i) => ({ id: (production.production_genre ?? [])[i], ...t }))
    const categoryMap = Object.fromEntries(categories.map(c => [c.id, { name: c.name, slug: c.slug }]))
    const castBySlug = new Map(castItems.map(artist => [artist.slug, artist]))
    const cast = castDetails
        .map(item => castBySlug.get(item.slug))
        .filter((artist): artist is NonNullable<typeof artist> => artist !== undefined)

    const relatedHubs = getHubsForProduction(production)

    const title = stripHtml(production.title.rendered)
    const url = `${SITE_URL}${href('production', { slug }, locale)}`

    const t = await getTranslations({ locale, namespace: 'entity' })
    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: `${SITE_NAME}`, url: SITE_URL },
        { name: t('breadcrumb.productions'), url: `${SITE_URL}${href('productions', undefined, locale)}` },
        ...(genres[0] ? [{ name: genres[0].name, url: `${SITE_URL}${href('productions', undefined, locale)}?genero=${genres[0].slug}` }] : []),
        { name: title, url },
    ])

    return (
        <>
            <WpEditSetter postId={production.id} postType="production" />
            {languageLinks.length > 0 && <LanguageSwitcher availableIn={tSwitcher('availableIn')} dismissLabel={tSwitcher('dismiss')} links={languageLinks} />}
            <RastreioDeRolagem caminho={href('production', { slug }, locale)} />
            <JsonLd data={breadcrumbSchema} />
            <ProductionDetailPage production={production} cast={cast} related={related} relatedPosts={locale === DEFAULT_LOCALE ? relatedPosts : []} relatedHubs={relatedHubs} categoryMap={categoryMap} />
        </>
    )
}
