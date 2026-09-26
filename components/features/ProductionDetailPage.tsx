import { intlLocale } from '@/lib/i18n/format'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { href } from '@/lib/i18n/routes'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { Star, Tv, Film, Clock, Calendar, Play, Images, ShieldCheck } from 'lucide-react'
import type { WPProduction, WPArtist, WPPost } from '@/lib/wordpress/types'
import { formatDatePt, getWPImage } from '@/lib/utils'
import { SITE_URL, SITE_NAME } from '@/lib/constants/site'
import { JsonLd } from '@/components/seo/JsonLd'
import { RegistrarVisita } from '@/components/artists/lista/RegistrarVisita'
import { ShareBar } from '@/components/ui/ShareBar'
import { ReportButton } from '@/components/ui/ReportButton'
import { EntityActionBar } from '@/components/ui/EntityActionBar'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { SemAnuncios } from '@/components/providers/AdsProvider'
import { producaoMagra } from '@/lib/productions/fichaMagra'
import { ProductionContent } from '@/components/productions/ProductionContent'
import { ProductionCast } from '@/components/productions/ProductionCast'
import { ProductionRelated } from '@/components/productions/ProductionRelated'
import { AtribuicaoJustWatch } from '@/components/productions/AtribuicaoJustWatch'
import { ProductionPageB } from '@/components/productions/ProductionPageB'
import { variantePorId } from '@/lib/experimento'
import { ReadingBar } from '@/components/ui/ReadingBar'
import { ProductionSidebar } from '@/components/productions/ProductionSidebar'
import { ProductionActions } from '@/components/productions/ProductionActions'
import Image, { getImageProps } from 'next/image'

import type { ArchiveHub } from '@/lib/guias/types'
import { EntityFAQ, type EntityFAQItem } from '@/components/seo/EntityFAQ'
import { buildProductionProfileModel } from '@/lib/profiles/productionProfile'
import { BlockHeader } from '@/components/blocks/BlockHeader'
import { NumberedList } from '@/components/blocks/NumberedList'

interface Props { production: WPProduction; cast?: WPArtist[]; related?: WPProduction[]; relatedPosts?: WPPost[]; relatedHubs?: ArchiveHub[]; categoryMap?: Record<number, { name: string; slug: string }> }

export function ProductionDetailPage(props: Props) {
    const pagina = <ProductionDetailPageConteudo {...props} />
    return producaoMagra(props.production) ? <SemAnuncios>{pagina}</SemAnuncios> : pagina
}

function ProductionDetailPageConteudo({ production, cast = [], related = [], relatedPosts = [], relatedHubs = [], categoryMap }: Props) {
    const t = useTranslations('profile')
    const tEntity = useTranslations('entity')
    const locale = useLocale()
    const model = buildProductionProfileModel(production, locale)
    const {
        title, acf, genres, platforms, contentBefore, contentAfter, synopsis,
        displayType, schemaType, galleryUrls, backdropUrl, facts, castRoles,
        statusInfo, hasTrailer, primaryPlatform, releaseLabel,
    } = model
    const image = getWPImage(production._embedded, production.featured_image_url)
    const productionUrl = `${SITE_URL}${href('production', { slug: production.slug }, locale)}`

    const navLinks = [
        { href: '#sinopse', label: t('production.nav.synopsis'), visible: true },
        { href: '#trailer', label: t('production.nav.trailer'), visible: hasTrailer },
        { href: '#elenco', label: t('production.nav.cast'), visible: cast.length > 0 },
        { href: '#galeria', label: t('production.nav.gallery'), visible: galleryUrls.length > 0 },
        { href: '#curiosidades', label: t('production.nav.trivia'), visible: facts.length > 0 },
        { href: '#artigos', label: t('production.nav.articles'), visible: relatedPosts.length > 0 },
        { href: '#relacionados', label: t('production.nav.related'), visible: related.length > 0 },
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
                publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
            }} />
    )
    const readingBar = (
        <ReadingBar backHref={href('productions', undefined, locale)} backLabel={tEntity('breadcrumb.productions')} tagLabel={genres[0]?.name} title={title} pageUrl={productionUrl} pageAnchors={navLinks} />
    )

    // Teste de estrutura: id par recebe a página "apresentação"; ímpar, a atual. Mesma
    // regra do `variantePorId` para todo o site, e `data-variante` marca os eventos.
    const variante = variantePorId(production.id)
    if (variante === 'b') {
        return (
            <>
                <div hidden data-variante="producao-b" />
                {jsonLd}
                {readingBar}
                <ProductionPageB production={production} model={model} productionUrl={productionUrl} cast={cast} related={related}
                    relatedPosts={relatedPosts} relatedHubs={relatedHubs} categoryMap={categoryMap} faqItems={faqItems} />
            </>
        )
    }

    return (
        <>
            <div hidden data-variante="producao-a" />
            <RegistrarVisita item={{ slug: production.slug, nome: title, foto: image?.src ?? null, papel: displayType || null, tipo: 'producao' }} />
            {/* Sem <h1> sr-only aqui: o hero sempre renderiza o <h1> visível, e
                dois h1 com o mesmo texto confundiam a hierarquia da página. */}
            {jsonLd}

            {readingBar}

            {/* ── HERO ── */}
            <section className="relative flex min-h-[620px] overflow-hidden bg-[#09080c] lg:min-h-[680px] max-w-[1440px] mx-auto">
                {/* Pôster no celular, backdrop a partir de sm. Com <picture> o navegador
                    baixa só a imagem da tela atual; dois <Image priority> com
                    `hidden` pré-carregavam as duas, e no celular o backdrop do TMDB
                    disputava banda com a imagem do LCP. */}
                {image && backdropUrl ? (
                    <HeroArtDirection
                        poster={image.src}
                        backdrop={backdropUrl}
                        alt={t('production.posterAltShort', { title })}
                    />
                ) : (image || backdropUrl) && (
                    <Image src={(image?.src ?? backdropUrl)!} alt={image ? t('production.posterAltShort', { title }) : t('production.coverAlt', { title })} fill priority
                        className={`object-cover ${image ? 'object-top' : 'object-center'}`} sizes="100vw" />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-black/10 sm:from-[#09080c] sm:via-black/45" />
                <div className="absolute inset-0 hidden bg-linear-to-r from-black/70 via-black/15 to-transparent sm:block" />
                <div className="page-wrap relative z-10 mt-auto w-full pb-10 pt-28 sm:pb-12 lg:pb-16">
                    <div className="mx-auto flex  items-end gap-8 lg:gap-10">
                        <div className="min-w-0 flex-1">
                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                {acf.year && <span className="text-[13px] font-black text-accent">{acf.year}</span>}
                                {acf.year && <span className="h-1 w-1 rounded-full bg-white/40" />}
                                {acf.type && (
                                    <span className="inline-flex items-center gap-1.5 border border-white/20 bg-black/30 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-white/75 backdrop-blur-xs">
                                        {acf.type === 'movie' ? <Film size={11} /> : <Tv size={11} />}
                                        {displayType}
                                    </span>
                                )}
                                {acf.episodes && <span className="text-[11px] font-black text-white/70">{t('production.episodesShort', { count: acf.episodes })}</span>}
                                {acf.duration_minutes && <span className="text-[11px] font-black text-white/70">{t('production.durationShort', { count: acf.duration_minutes })}</span>}
                                {acf.age_rating && (
                                    <span className="inline-flex items-center gap-1 border border-orange-500/40 bg-orange-700/70 px-2.5 py-1 font-mono text-[10px] font-black text-orange-100">
                                        <ShieldCheck size={11} /> {acf.age_rating === 'L' ? t('production.ageRatingFree') : `${acf.age_rating}+`}
                                    </span>
                                )}
                            </div>
                            <h1 className="max-w-[14ch] text-[36px] font-black leading-[0.95] tracking-tighter text-white sm:text-[58px] lg:text-[72px]">
                                {title}
                            </h1>
                            {acf.original_title && (
                                <p className="mt-3 text-[15px] font-bold text-accent sm:text-[19px]">{acf.original_title}</p>
                            )}
                            {acf.subtitle && (
                                <p className="mt-2 max-w-2xl text-[14px] italic leading-relaxed text-white/65 sm:text-[16px]">&ldquo;{acf.subtitle}&rdquo;</p>
                            )}
                            <div className="mt-6 flex flex-wrap gap-2">
                                {hasTrailer && (
                                    <a href="#trailer"
                                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.04em] text-black transition-opacity hover:opacity-90">
                                        <Play size={14} fill="currentColor" /> {t('production.watchTrailer')}
                                    </a>
                                )}
                                <ProductionActions productionId={production.id} mode="watch" variant="hero" />
                            </div>
                        </div>
                        {image && (
                            <div className="relative hidden aspect-2/3 w-40 shrink-0 overflow-hidden border border-white/20 bg-surface shadow-2xl sm:block lg:w-48">
                                <Image src={image.src} alt={t('production.posterAlt', { title })} fill className="object-cover" sizes="192px" />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── INFO STRIP + AÇÕES ── */}
            <div className="page-wrap">
                <div className="border-b border-border py-3">
                    <div className="mx-auto  flex flex-wrap items-center justify-between gap-3">
                        {/* métricas rápidas */}
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                            {acf.rating != null && (
                                <div className="flex items-center gap-1.5">
                                    <Star size={13} className="text-amber-400" fill="currentColor" />
                                    <span className="text-[13px] font-black text-foreground">{Number(acf.rating).toFixed(1)}</span>
                                    <span className="text-[11px] text-muted">/10</span>
                                </div>
                            )}
                            {acf.network && (
                                <div className="flex items-center gap-1.5">
                                    <Tv size={11} className="text-muted" />
                                    <span className="text-[12px] font-semibold text-foreground">{acf.network as string}</span>
                                </div>
                            )}
                            {acf.release_date && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={11} className="text-muted" />
                                    <span className="text-[12px] text-muted">{formatDatePt(acf.release_date, intlLocale(locale))}</span>
                                </div>
                            )}
                            {acf.episodes != null && acf.episodes > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <Clock size={11} className="text-muted" />
                                    <span className="text-[12px] text-muted">
                                        {acf.episodes} ep.{acf.duration_minutes ? ` · ${acf.duration_minutes} min` : ''}
                                    </span>
                                </div>
                            )}
                            {statusInfo && (
                                <span className={`px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider ${statusInfo.color}`}>
                                    {statusInfo.label}
                                </span>
                            )}
                            {platforms.length > 0 && (
                                <div className="hidden sm:flex items-center gap-1.5">
                                    <span className="font-mono text-[9px] font-black uppercase tracking-wider text-muted">On</span>
                                    {platforms.map(p => (
                                        <span key={p.id} className="text-[11px] font-semibold text-foreground">{p.name}</span>
                                    ))}
                                    <AtribuicaoJustWatch className="ml-1" />
                                </div>
                            )}
                        </div>
                        {/* ações */}
                        <EntityActionBar density="wide">
                            <ProductionActions productionId={production.id} mode="favorite" />
                            <ShareBar url={productionUrl} title={title} />
                            <ReportButton targetType="production" targetId={production.id} />
                        </EntityActionBar>
                    </div>
                </div>

                {/* ── CONTEÚDO PRINCIPAL ── */}
                <div className="flex gap-10 items-start pt-6">
                    <div className="min-w-0 flex-1">

                        <div id="sinopse" className="scroll-mt-(--scroll-anchor-offset,134px)">
                            <ProductionContent
                                title={title}
                                contentBefore={contentBefore}
                                contentAfter={contentAfter}
                                acf={acf as Record<string, unknown>}
                                relatedPosts={relatedPosts}
                                categoryMap={categoryMap}
                                hasTrailerInline={hasTrailer}
                            />
                        </div>

                        <div id="elenco" className="scroll-mt-(--scroll-anchor-offset,134px)">
                            <ProductionCast cast={cast} details={production.production_cast ?? []} />
                        </div>

                        {galleryUrls.length > 0 && (
                            <section id="galeria" className="mt-12 scroll-mt-(--scroll-anchor-offset,134px)">
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
                            <section id="curiosidades" className="mt-12 scroll-mt-(--scroll-anchor-offset,134px)">
                                <BlockHeader title={t('production.nav.trivia')} eyebrow={t('production.triviaEyebrow')} tone="muted" size="lg" />
                                <NumberedList items={facts.map((fact, index) => ({ key: `${fact}-${index}`, content: fact }))} />
                            </section>
                        )}

                        {genres.length > 0 && (
                            <div className="mt-8 flex flex-wrap gap-2">
                                {genres.map(g => (
                                    <Link key={g.id} href={`${href('productions', undefined, locale)}?genre=${g.slug}`}
                                        className="border border-border px-3 py-1 text-[12px] font-semibold text-muted hover:border-accent hover:text-accent transition-colors">
                                        {g.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <ProductionSidebar
                        rating={acf.rating as number | null}
                        platforms={platforms}
                        type={acf.type}
                        year={acf.year as number | undefined}
                        episodes={acf.episodes as number | undefined}
                        durationMinutes={acf.duration_minutes as number | undefined}
                        ageRating={acf.age_rating as string | undefined}
                        network={acf.network as string | undefined}
                        director={acf.director as string | undefined}
                        writer={acf.writer as string | undefined}
                        statusProduction={acf.status_production}
                        cast={cast.slice(0, 5)}
                        castRoles={castRoles}
                    />
                </div>

                {ADSENSE.slots.leaderboard && (
                    <div className="mt-12 mx-auto ">
                        <AdSlotInline slot={ADSENSE.slots.leaderboard} layout="leaderboard" analyticsPlacement="production_end_leaderboard" />
                    </div>
                )}

                <div id="relacionados" className="scroll-mt-(--scroll-anchor-offset,134px) mx-auto ">
                    <ProductionRelated related={related} genres={genres} />
                </div>

                {/* Ponto de descoberta: quem chega aqui está decidindo o que assistir
                    a seguir. É o equivalente ao `artist_discovery`, que preenche 71%
                    (Umami, sessões do Brasil, 28 dias até 2026-09-17). Também cobre o
                    vazio medido no celular, onde a metade final da ficha não tinha
                    anúncio nenhum. */}
                {ADSENSE.slots.inline && related.length > 0 && (
                    <div className="mt-12 mx-auto">
                        <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="production_discovery" />
                    </div>
                )}

                <EntityFAQ
                    items={faqItems}
                    className="mt-12 scroll-mt-(--scroll-anchor-offset,134px) mx-auto"
                    title={t('faqTitle', { name: title })}
                />

                {locale === DEFAULT_LOCALE && relatedHubs.length > 0 && (
                    <div className="mt-12 mx-auto">
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

function HeroArtDirection({ poster, backdrop, alt }: { poster: string; backdrop: string; alt: string }) {
    const comum = { alt, fill: true, sizes: '100vw' } as const
    const { props: { srcSet: desktop } } = getImageProps({ ...comum, src: backdrop })
    const { props: mobile } = getImageProps({ ...comum, src: poster, fetchPriority: 'high', loading: 'eager' })
    return (
        <picture>
            <source media="(min-width: 640px)" srcSet={desktop} sizes="100vw" />
            <img {...mobile} alt={alt} className="object-cover object-top sm:object-center" />
        </picture>
    )
}
