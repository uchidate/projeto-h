import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Images } from 'lucide-react'
import type { WPProduction, WPArtist, WPPost } from '@/lib/wordpress/types'
import type { ArchiveHub } from '@/lib/guias/types'
import type { ProductionProfileModel } from '@/lib/profiles/productionProfile'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { ADSENSE } from '@/lib/config/ads'
import { getWPImage, extractYoutubeId } from '@/lib/utils'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { BlockHeader } from '@/components/blocks/BlockHeader'
import { NumberedList } from '@/components/blocks/NumberedList'
import { ProductionTrailer } from '@/components/productions/ProductionTrailer'
import { EntityFAQ, type EntityFAQItem } from '@/components/seo/EntityFAQ'
import { ProductionHeroB, ProductionHeroBMobile } from '@/components/productions/ProductionHeroB'
import { ProductionResumo } from '@/components/productions/ProductionResumo'
import { ProductionElencoB } from '@/components/productions/ProductionElencoB'
import { ProductionRelated } from '@/components/productions/ProductionRelated'
import { ProductionBlogGrid } from '@/components/productions/ProductionBlogGrid'
import { ProductionSidebar, FichaLinhas } from '@/components/productions/ProductionSidebar'

interface Props {
    production: WPProduction
    model: ProductionProfileModel
    productionUrl: string
    cast: WPArtist[]
    related: WPProduction[]
    relatedPosts: WPPost[]
    relatedHubs: ArchiveHub[]
    categoryMap?: Record<number, { name: string; slug: string }>
    faqItems: EntityFAQItem[]
}

const ANCORA = 'scroll-mt-(--scroll-anchor-offset,134px)'

/**
 * Página de produção, estrutura "apresentação" (id par no teste).
 *
 * Ordem pensada para quem chega por busca: hero baixo → resumo (sinopse e onde assistir)
 * → elenco → anúncio → trailer → dossiê, com a ficha técnica na lateral (desktop) ou
 * em duas colunas (celular) → recomendações → blog → FAQ. O HTML indexável é o mesmo
 * da estrutura anterior (H1, sinopse, elenco, FAQ e dados estruturados): muda a ordem
 * e a apresentação, não o conteúdo.
 *
 * Anúncios: um depois do elenco e a lateral fixa no desktop; no celular, um depois do
 * elenco e outro depois das recomendações. O rodapé de página (`production_end_leaderboard`,
 * 27% de preenchimento) e o `production_discovery` da estrutura anterior saem.
 */
export function ProductionPageB({ production, model, productionUrl, cast, related, relatedPosts, relatedHubs, categoryMap, faqItems }: Props) {
    const t = useTranslations('profile')
    const locale = useLocale()
    const {
        title, acf, genres, platforms, contentBefore, contentAfter, sinopseResumo, displayType, galleryUrls, backdropUrl,
        facts, castRoles, statusInfo, hasTrailer,
    } = model
    const poster = getWPImage(production._embedded, production.featured_image_url)
    const trailerId = hasTrailer && acf.trailer_url ? extractYoutubeId(acf.trailer_url) : null
    const ficha = {
        type: acf.type, year: acf.year, episodes: acf.episodes, durationMinutes: acf.duration_minutes,
        ageRating: acf.age_rating ?? undefined, network: (acf.network as string | undefined) ?? undefined,
        director: acf.director ?? undefined, writer: acf.writer ?? undefined, statusProduction: acf.status_production,
    }
    const temFicha = Object.values(ficha).some(Boolean)

    return (
        <>
            <ProductionHeroB
                productionId={production.id} productionUrl={productionUrl} title={title}
                originalTitle={acf.original_title} subtitle={acf.subtitle} year={acf.year} typeLabel={displayType}
                genres={genres} rating={acf.rating} episodes={acf.episodes} durationMinutes={acf.duration_minutes}
                status={statusInfo} backdrop={backdropUrl} poster={poster} hasTrailer={hasTrailer}
            />
            <ProductionHeroBMobile
                productionId={production.id} productionUrl={productionUrl} title={title} rating={acf.rating}
                episodes={acf.episodes} durationMinutes={acf.duration_minutes} status={statusInfo} hasTrailer={hasTrailer}
            />

            <div className="page-wrap">
                <ProductionResumo title={title} synopsis={sinopseResumo} genres={genres} platforms={platforms} />

                <div className="flex items-start gap-10 pt-10 lg:gap-16 lg:pt-14">
                    <div className="flex min-w-0 flex-1 flex-col gap-14 lg:gap-16">
                        <ProductionElencoB title={title} cast={cast} castRoles={castRoles} />

                        {ADSENSE.slots.inline && (
                            <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="production_after_cast" />
                        )}

                        {temFicha && (
                            <section aria-labelledby="h-ficha" className="xl:hidden">
                                <h2 id="h-ficha" className="font-serif text-[26px] font-semibold text-foreground">{t('ui.sidebar.technical')}</h2>
                                <FichaLinhas {...ficha} grade />
                            </section>
                        )}

                        {trailerId && (
                            <section id="trailer" className={ANCORA}>
                                <BlockHeader title={t('ui.officialTrailer')} eyebrow={t('ui.video')} tone="muted" size="lg" />
                                <ProductionTrailer videoId={trailerId} title={t('ui.trailerOf', { title })} playLabel={t('production.watchTrailer')} />
                            </section>
                        )}

                        <section id="dossie" className={ANCORA}>
                            <BlockHeader title={t('ui.synopsis')} eyebrow={t('ui.dossier')} tone="muted" size="lg" />
                            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-black prose-a:text-accent prose-a:no-underline prose-a:hover:underline"
                                dangerouslySetInnerHTML={{ __html: contentBefore }} />
                            {contentAfter && (
                                <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-black prose-a:text-accent prose-a:no-underline prose-a:hover:underline"
                                    dangerouslySetInnerHTML={{ __html: contentAfter }} />
                            )}
                        </section>

                        {galleryUrls.length > 0 && (
                            <section id="galeria" className={ANCORA}>
                                <BlockHeader title={t('production.nav.gallery')} eyebrow={t('production.galleryEyebrow')} tone="muted" size="lg"
                                    action={<Images size={18} className="text-accent" />} />
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {galleryUrls.slice(0, 9).map((url: string, index: number) => (
                                        <a key={`${url}-${index}`} href={url} target="_blank" rel="noopener noreferrer"
                                            className={`group relative aspect-video overflow-hidden bg-surface ${index === 0 ? 'col-span-2' : ''}`}>
                                            <Image src={url} alt={t('production.galleryImageAlt', { title, index: index + 1 })} fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                                sizes={index === 0 ? '(max-width: 640px) 100vw, 66vw' : '(max-width: 640px) 50vw, 33vw'} />
                                        </a>
                                    ))}
                                </div>
                            </section>
                        )}

                        {facts.length > 0 && (
                            <section id="curiosidades" className={ANCORA}>
                                <BlockHeader title={t('production.nav.trivia')} eyebrow={t('production.triviaEyebrow')} tone="muted" size="lg" />
                                <NumberedList items={facts.map((fact, index) => ({ key: `${fact}-${index}`, content: fact }))} />
                            </section>
                        )}
                    </div>

                    <ProductionSidebar compacto rating={acf.rating} platforms={platforms} {...ficha} />
                </div>

                <div id="relacionados" className={`${ANCORA} mt-16 lg:mt-20`}>
                    <ProductionRelated related={related} genres={genres} />
                </div>

                {ADSENSE.slots.inline && related.length > 0 && (
                    <div className="mt-12 xl:hidden">
                        <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="production_after_related" />
                    </div>
                )}

                <div className="mt-16 lg:mt-20">
                    <ProductionBlogGrid title={title} posts={relatedPosts} categoryMap={categoryMap} />
                </div>

                <EntityFAQ items={faqItems} className={`mt-16 lg:mt-20 ${ANCORA}`} title={t('faqTitle', { name: title })} />

                {locale === DEFAULT_LOCALE && relatedHubs.length > 0 && (
                    <div className="mt-16">
                        <div className="mb-4 border-b border-border pb-3">
                            <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">{t('explore')}</p>
                            <h2 className="text-[18px] font-black tracking-[-0.03em]">{t('relatedGuides')}</h2>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {relatedHubs.map(hub => (
                                <Link key={hub.slug} href={`/guias/${hub.slug}`}
                                    className="border border-border bg-surface p-4 transition-colors hover:border-accent/60 hover:bg-accent/5">
                                    <h3 className="text-sm font-black text-foreground">{hub.shortTitle}</h3>
                                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{hub.description}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
