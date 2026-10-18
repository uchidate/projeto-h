import { useLocale, useTranslations } from 'next-intl'
import { href } from '@/lib/i18n/routes'
import type { WPProduction, WPArtist, WPPost } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { SITE_URL } from '@/lib/constants/site'
import { JsonLd } from '@/components/seo/JsonLd'
import { SemAnuncios } from '@/components/providers/AdsProvider'
import { producaoMagra } from '@/lib/productions/fichaMagra'
import type { Disponibilidade } from '@/lib/tmdb/watchProviders'
import { ProductionPageB } from '@/components/productions/ProductionPageB'
import { ReadingBar } from '@/components/ui/ReadingBar'

import type { ArchiveHub } from '@/lib/guias/types'
import { type EntityFAQItem } from '@/components/seo/EntityFAQ'
import type { Episodio } from '@/lib/tmdb/episodios'
import type { Avaliacao } from '@/lib/tmdb/avaliacao'
import { buildProductionProfileModel } from '@/lib/profiles/productionProfile'

interface Props { production: WPProduction; cast?: WPArtist[]; related?: WPProduction[]; relatedPosts?: WPPost[]; relatedHubs?: ArchiveHub[]; categoryMap?: Record<number, { name: string; slug: string }>; disponibilidade?: Disponibilidade | null; avaliacao?: Avaliacao | null; episodios?: Episodio[] }

export function ProductionDetailPage(props: Props) {
    const pagina = <ProductionDetailPageConteudo {...props} />
    return producaoMagra(props.production) ? <SemAnuncios>{pagina}</SemAnuncios> : pagina
}

function ProductionDetailPageConteudo({ production, cast = [], related = [], relatedPosts = [], relatedHubs = [], categoryMap, disponibilidade = null, avaliacao = null, episodios = [] }: Props) {
    const t = useTranslations('profile')
    const tEntity = useTranslations('entity')
    const locale = useLocale()
    const model = buildProductionProfileModel(production, locale)
    const {
        title, acf, genres, platforms, synopsis,
        schemaType, galleryUrls, backdropUrl, facts,
        hasTrailer, primaryPlatform, releaseLabel,
    } = model
    const image = getWPImage(production._embedded, production.featured_image_url)
    const productionUrl = `${SITE_URL}${href('production', { slug: production.slug }, locale)}`

    const navLinks = [
        { href: '#sinopse', label: t('production.nav.synopsis'), visible: true },
        { href: '#trailer', label: t('production.nav.trailer'), visible: hasTrailer },
        { href: '#elenco', label: t('production.nav.cast'), visible: cast.length > 0 },
        { href: '#relacionados', label: t('production.nav.related'), visible: related.length > 0 },
        { href: '#galeria', label: t('production.nav.gallery'), visible: galleryUrls.length > 0 },
        { href: '#curiosidades', label: t('production.nav.trivia'), visible: facts.length > 0 },
        { href: '#artigos', label: t('production.nav.articles'), visible: relatedPosts.length > 0 },
        { href: '#faq', label: t('production.nav.faq'), visible: true },
    ].filter(l => l.visible)
    const faqItems = [
        {
            question: t('production.faq.aboutQ', { title }),
            answer: synopsis || t('production.faq.aboutA', { title }),
        },
        releaseLabel
            ? {
                question: t('production.faq.releaseQ', { title }),
                answer: t('production.faq.releaseA', { title, release: releaseLabel }),
            }
            : null,
        primaryPlatform
            ? {
                question: t('production.faq.watchQ', { title }),
                answer: t('production.faq.watchA', { title, platforms: platforms.map(platform => platform.name).join(', ') }),
            }
            : null,
        genres.length > 0
            ? {
                question: t('production.faq.genreQ', { title }),
                answer: t('production.faq.genreA', { title, genres: genres.map(genre => genre.name).join(', ') }),
            }
            : null,
        cast.length > 0
            ? {
                question: t('production.faq.castQ', { title }),
                answer: t('production.faq.castA', { title, count: cast.length }),
            }
            : null,
    ].filter(Boolean).slice(0, 5) as EntityFAQItem[]

    const jsonLd = (
        <JsonLd data={{
                '@context': 'https://schema.org', '@type': schemaType,
                name: title, alternateName: acf.original_title,
                description: synopsis,
                url: productionUrl, image: backdropUrl || image?.src,
                datePublished: acf.year ? `${acf.year}` : undefined,
                numberOfEpisodes: acf.episodes, inLanguage: 'ko',
                countryOfOrigin: { '@type': 'Country', name: 'Korea, Republic of' },
                genre: genres.map(g => g.name),
                // actor só com quem já tem ficha no site: o link prova a identidade.
                actor: cast.length > 0
                    ? cast.slice(0, 10).map(a => ({
                        '@type': 'Person',
                        name: stripHtml(a.title.rendered),
                        url: `${SITE_URL}${href('artist', { slug: a.slug }, locale)}`,
                    }))
                    : undefined,
            }} />
    )
    const readingBar = (
        <ReadingBar backHref={href('productions', undefined, locale)} backLabel={tEntity('breadcrumb.productions')} tagLabel={genres[0]?.name} title={title} pageUrl={productionUrl} pageAnchors={navLinks} />
    )

    return (
        <>
            <div hidden data-variante="producao-b" />
            {jsonLd}
            {readingBar}
            <ProductionPageB production={production} model={model} productionUrl={productionUrl} cast={cast} related={related}
                relatedPosts={relatedPosts} relatedHubs={relatedHubs} categoryMap={categoryMap} faqItems={faqItems} disponibilidade={disponibilidade} avaliacao={avaliacao} episodios={episodios} />
        </>
    )
}
