'use client'
import { Fragment } from 'react'
import { SITE_NAME } from '@/lib/constants/site'

import { htmlLang } from '@/lib/i18n/format'
import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PageBreadcrumb } from '@/components/ui/PageBreadcrumb'
import { ResponsiveFilterBar } from '@/components/ui/ResponsiveFilterBar'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'
import { BrandDot } from '@/components/ui/BrandDot'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { EmptyState } from '@/components/ui/EmptyState'
import type { ArchiveHub } from '@/lib/guias'
import type { WPProduction, WPPost } from '@/lib/wordpress/types'
import type { WPArtist, WPGroup } from '@/lib/wordpress/types'
import { ProductionCard } from '@/components/productions/ProductionCard'
import { ArtistCard } from '@/components/artists/ArtistCard'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { trackHubView } from '@/lib/analytics'
import { stripHtml } from '@/lib/utils'
import { serializeJsonLd } from '@/lib/seo/serialize'
import { SITE_URL } from '@/lib/constants/site'
import {
    PRODUCTION_GENRE_MAP,
    PRODUCTION_PLATFORM_MAP,
    PRODUCTION_NETWORK_MAP,
} from '@/lib/guias/hub-maps'


interface ActiveFilters {
    genre?: string
    platform?: string
    network?: string
    type?: string
    year?: string
}

interface Props {
    hub: ArchiveHub
    relatedHubs: ArchiveHub[]
    productions?: WPProduction[]
    artists?: WPArtist[]
    groups?: WPGroup[]
    total: number
    blogPosts?: WPPost[]
    siteUrl?: string
    genreMap?: Record<number, { name: string; slug: string }>
    page?: number
    totalPages?: number
    activeFilters?: ActiveFilters
}

function JsonLd({ data }: { data: object }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
        />
    )
}

type HubDimension = 'genre' | 'platform' | 'network' | 'year' | null

function getHubDimension(hub: ArchiveHub): HubDimension {
    if (PRODUCTION_GENRE_MAP[hub.slug]) return 'genre'
    if (PRODUCTION_PLATFORM_MAP[hub.slug]) return 'platform'
    if (PRODUCTION_NETWORK_MAP[hub.slug]) return 'network'
    if (hub.filter.year) return 'year'
    return null
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={`px-3 py-1 text-[12px] font-semibold transition-colors whitespace-nowrap ${
                active
                    ? 'bg-foreground text-background'
                    : 'border border-border text-muted hover:border-foreground hover:text-foreground'
            }`}
        >
            {label}
        </Link>
    )
}

const TYPE_LABELS: Record<string, string> = {
    drama:   'Série',
    movie:   'Filme',
    special: 'Especial',
    variety: 'Variedade',
}

// Known filter options that are static (don't depend on current page items)
const KNOWN_YEARS = Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => String(new Date().getFullYear() - i))
const KNOWN_TYPES = ['drama', 'movie', 'special', 'variety']
const KNOWN_PLATFORMS = ['Netflix', 'Disney+', 'Prime Video', 'Apple TV+', 'Globoplay', 'Max', 'Viki', 'WeTV']

export function HubPageContent({
    hub, relatedHubs, productions, artists, groups, total, blogPosts = [],
    siteUrl = SITE_URL, genreMap: _genreMap = {},
    page = 1, totalPages = 1, activeFilters = {},
}: Props) {
    const { genre: activeGenre = '', platform: activePlatform = '', network: activeNetwork = '', type: activeType = '', year: activeYear = '' } = activeFilters

    useEffect(() => {
        trackHubView({ slug: hub.slug, kind: hub.kind, title: hub.title })
    }, [hub.slug, hub.kind, hub.title])

    const dimension = getHubDimension(hub)
    const baseUrl = `/guias/${hub.slug}`

    function buildHref(overrides: Record<string, string>): string {
        const p = new URLSearchParams()
        if (activeYear     ) p.set('year',     activeYear)
        if (activePlatform ) p.set('platform', activePlatform)
        if (activeGenre    ) p.set('genre',    activeGenre)
        if (activeNetwork  ) p.set('network',  activeNetwork)
        if (activeType     ) p.set('type',     activeType)
        // Apply overrides (empty string = remove)
        for (const [k, v] of Object.entries(overrides)) {
            if (v) p.set(k, v); else p.delete(k)
        }
        // Changing a filter resets page
        p.delete('page')
        const qs = p.toString()
        return qs ? `${baseUrl}?${qs}` : baseUrl
    }

    function buildPageHref(p: number): string {
        const params = new URLSearchParams()
        if (activeYear     ) params.set('year',     activeYear)
        if (activePlatform ) params.set('platform', activePlatform)
        if (activeGenre    ) params.set('genre',    activeGenre)
        if (activeNetwork  ) params.set('network',  activeNetwork)
        if (activeType     ) params.set('type',     activeType)
        if (p > 1) params.set('page', String(p))
        const qs = params.toString()
        return qs ? `${baseUrl}?${qs}` : baseUrl
    }

    const showYear     = hub.kind === 'productions' && dimension !== 'year'
    const showPlatform = hub.kind === 'productions' && dimension !== 'platform'
    const showType     = hub.kind === 'productions'
    const hasFilters   = showYear || showPlatform || showType

    const hasActiveFilter = !!(activeGenre || activePlatform || activeNetwork || activeType || activeYear)

    const activeFilterLabel = [
        activeGenre,
        activePlatform,
        activeNetwork,
        activeType ? TYPE_LABELS[activeType] : '',
        activeYear,
    ].filter(Boolean).join(', ') || 'Todos'

    const displayCount = productions?.length ?? artists?.length ?? groups?.length ?? 0

    const canonical = `${siteUrl}/guias/${hub.slug}`
    const kindLabel = hub.kind === 'productions' ? 'produções' : hub.kind === 'artists' ? 'artistas' : 'grupos'

    const allItems = [
        ...(productions ?? []).map(p => ({ id: p.id, name: p.title.rendered, url: `${siteUrl}/productions/${p.slug}` })),
        ...(artists ?? []).map(a => ({ id: a.id, name: a.title.rendered, url: `${siteUrl}/artists/${a.slug}` })),
        ...(groups ?? []).map(g => ({ id: g.id, name: g.title.rendered, url: `${siteUrl}/groups/${g.slug}` })),
    ]

    return (
        <>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: hub.title,
                description: hub.description,
                url: canonical,
                inLanguage: htmlLang(),
                publisher: { '@type': 'Organization', name: `${SITE_NAME}`, url: siteUrl },
            }} />

            {allItems.length > 0 && (
                <JsonLd data={{
                    '@context': 'https://schema.org',
                    '@type': 'ItemList',
                    name: hub.title,
                    url: canonical,
                    numberOfItems: total,
                    itemListElement: allItems.map((item, i) => ({
                        '@type': 'ListItem',
                        position: (page - 1) * 48 + i + 1,
                        url: item.url,
                        name: item.name,
                    })),
                }} />
            )}

            {hub.faq.length > 0 && (
                <JsonLd data={{
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: hub.faq.map(item => ({
                        '@type': 'Question',
                        name: item.question,
                        acceptedAnswer: { '@type': 'Answer', text: item.answer },
                    })),
                }} />
            )}

            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Guias', item: `${siteUrl}/guias` },
                    { '@type': 'ListItem', position: 2, name: hub.shortTitle, item: canonical },
                ],
            }} />

            {hasFilters && (
                <ResponsiveFilterBar label="Filtros" value={activeFilterLabel}>
                    <div className="flex items-center gap-3">
                        {showType && (
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-muted shrink-0">Tipo</span>
                                <FilterChip label="Todos" href={buildHref({ type: '' })} active={!activeType} />
                                {KNOWN_TYPES.map(t => (
                                    <FilterChip key={t} label={TYPE_LABELS[t]} href={buildHref({ type: t })} active={activeType === t} />
                                ))}
                            </div>
                        )}
                        {showPlatform && (
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-muted shrink-0">Plataforma</span>
                                <FilterChip label="Todas" href={buildHref({ platform: '' })} active={!activePlatform} />
                                {KNOWN_PLATFORMS.map(p => (
                                    <FilterChip key={p} label={p} href={buildHref({ platform: p })} active={activePlatform === p} />
                                ))}
                            </div>
                        )}
                        {showYear && (
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-muted shrink-0">Ano</span>
                                <FilterChip label="Todos" href={buildHref({ year: '' })} active={!activeYear} />
                                {KNOWN_YEARS.slice(0, 10).map(y => (
                                    <FilterChip key={y} label={y} href={buildHref({ year: y })} active={activeYear === y} />
                                ))}
                            </div>
                        )}
                    </div>
                </ResponsiveFilterBar>
            )}

            <PageBreadcrumb
                crumbs={[
                    { label: 'Início', href: '/' },
                    { label: 'Guias', href: '/guias' },
                    { label: hub.shortTitle },
                ]}
                description={`${total} ${kindLabel}`}
            />

            <div className="page-wrap py-8 space-y-12">

                {/* Header */}
                <header className="border-b-2 border-foreground pb-6 space-y-3">
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent">
                        {hub.kind === 'productions' ? 'Guia de produções' : hub.kind === 'artists' ? 'Guia de artistas' : 'Guia de grupos'}
                    </p>
                    <h1 className="text-[32px] font-black leading-[0.95] tracking-[-0.04em] sm:text-[44px]">
                        {hub.title}<BrandDot />
                    </h1>
                    <p className="text-[14px] leading-7 text-muted max-w-2xl">{hub.description}</p>
                    {hub.intro.length > 0 && (
                        <div className="pt-2 grid gap-3 text-sm leading-7 text-muted md:grid-cols-2 border-t border-border/40">
                            {hub.intro.map((p, i) => <p key={i}>{p}</p>)}
                        </div>
                    )}
                </header>

                {hub.whatYouWillFind && (
                    <div className="border-l-2 border-accent pl-4 py-1">
                        <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-accent mb-1">O que você vai encontrar</p>
                        <p className="text-sm leading-7 text-muted">{hub.whatYouWillFind}</p>
                    </div>
                )}

                {hub.relatedSearches && hub.relatedSearches.length > 0 && page === 1 && (
                    <nav className="border border-border bg-surface/40 p-4" aria-label="Buscas relacionadas">
                        <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-3">Buscas relacionadas</p>
                        <div className="flex flex-wrap gap-2">
                            {hub.relatedSearches.map(item => (
                                <Link
                                    key={`${item.href}-${item.label}`}
                                    href={item.href}
                                    className="rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-semibold text-muted transition-colors hover:border-foreground hover:text-foreground"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </nav>
                )}

                <section>
                    <SectionTitleBar
                        eyebrow={`${total} ${kindLabel}`}
                        title={page > 1 ? `Explorar — página ${page}` : 'Explorar'}
                        action={
                            hasActiveFilter
                                ? <Link href={baseUrl} className="text-[10px] font-mono font-black uppercase tracking-widest text-muted hover:text-accent transition-colors">Limpar ×</Link>
                                : undefined
                        }
                    />

                    {ADSENSE.slots.inline && <div className="mb-6"><AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="hub_feed" /></div>}

                    {displayCount === 0 ? (
                        <EmptyState description="Nenhum resultado encontrado." layout="compact" className="border border-border bg-surface" />
                    ) : (
                        (() => {
                        // Cards montados numa lista só, e a grade cortada a cada 12 com um
                        // anúncio entre os pedaços. Medido em 2026-09-18: guias têm ~11.000px
                        // de rolagem no celular e só um anúncio, no topo. Cortar a grade (em
                        // vez de inserir no meio) evita fileira pela metade.
                        const cards = [
                            ...(hub.kind === 'productions' ? (productions ?? []).map(p => <ProductionCard key={p.id} production={p} />) : []),
                            ...(hub.kind === 'artists' ? (artists ?? []).map(a => <ArtistCard key={a.id} artist={a} />) : []),
                            ...(hub.kind === 'groups' ? (groups ?? []).map(g => (
                                <Link key={g.id} href={`/groups/${g.slug}`} className="group block">
                                    <div className="relative aspect-4/5 overflow-hidden bg-surface">
                                        {g.featured_image_url ? (
                                            <Image src={g.featured_image_url} alt={g.title.rendered} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw" className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-3xl font-black text-muted/20">{g.title.rendered[0]}</div>
                                        )}
                                    </div>
                                    <div className="py-2 border-b border-border/50">
                                        <h3 className="truncate text-[13px] font-bold text-foreground group-hover:text-accent transition-colors">{g.title.rendered}</h3>
                                    </div>
                                </Link>
                            )) : []),
                        ]
                        const PEDACO = 12
                        const pedacos: typeof cards[] = []
                        for (let i = 0; i < cards.length; i += PEDACO) pedacos.push(cards.slice(i, i + PEDACO))
                        return pedacos.map((pedaco, indice) => (
                            <Fragment key={`pedaco-${indice}`}>
                                {indice > 0 && ADSENSE.slots.inline && (
                                    <div className="my-6">
                                        <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="hub_grid" />
                                    </div>
                                )}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                    {pedaco}
                                </div>
                            </Fragment>
                        ))
                        })()
                    )}

                    {totalPages > 1 && (
                        <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Paginação">
                            {page > 1 && (
                                <Link href={buildPageHref(page - 1)}
                                    className="px-3 py-2 text-[12px] font-semibold border border-border text-muted hover:border-foreground hover:text-foreground transition-colors">
                                    ← Anterior
                                </Link>
                            )}
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                // Show pages around current
                                let p: number
                                if (totalPages <= 7) {
                                    p = i + 1
                                } else if (page <= 4) {
                                    p = i + 1
                                } else if (page >= totalPages - 3) {
                                    p = totalPages - 6 + i
                                } else {
                                    p = page - 3 + i
                                }
                                return (
                                    <Link key={p} href={buildPageHref(p)}
                                        aria-current={p === page ? 'page' : undefined}
                                        className={`px-3 py-2 text-[12px] font-semibold transition-colors ${
                                            p === page
                                                ? 'bg-foreground text-background'
                                                : 'border border-border text-muted hover:border-foreground hover:text-foreground'
                                        }`}>
                                        {p}
                                    </Link>
                                )
                            })}
                            {page < totalPages && (
                                <Link href={buildPageHref(page + 1)}
                                    className="px-3 py-2 text-[12px] font-semibold border border-border text-muted hover:border-foreground hover:text-foreground transition-colors">
                                    Próxima →
                                </Link>
                            )}
                        </nav>
                    )}
                </section>

                {hub.faq.length > 0 && page === 1 && (
                    <section itemScope itemType="https://schema.org/FAQPage">
                        <SectionTitleBar eyebrow="Tire suas dúvidas" title="Perguntas frequentes" />
                        <div className="grid gap-px bg-border sm:grid-cols-2">
                            {hub.faq.map(item => (
                                <div key={item.question} className="bg-background p-5" itemScope itemType="https://schema.org/Question" itemProp="mainEntity">
                                    <h3 className="text-[13px] font-black text-foreground leading-snug" itemProp="name">{item.question}</h3>
                                    <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                                        <p className="mt-2 text-[13px] leading-6 text-muted" itemProp="text">{item.answer}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {blogPosts.length > 0 && page === 1 && (
                    <section>
                        <SectionTitleBar eyebrow="Do blog" title="Artigos relacionados" href="/blog" linkText="ver todos →" />
                        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
                            {blogPosts.map(post => {
                                const img = post.featured_image_url ?? null
                                const excerpt = stripHtml(post.excerpt?.rendered ?? '')
                                return (
                                    <Link key={post.id} href={`/blog/${post.slug}`}
                                        className="group bg-background transition-colors hover:bg-surface">
                                        {img && (
                                            <div className="relative aspect-video overflow-hidden">
                                                { }
                                                <Image src={img} alt={post.title.rendered} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                                            </div>
                                        )}
                                        <div className="p-4">
                                            <h3 className="text-[13px] font-black leading-snug text-foreground line-clamp-2 group-hover:text-accent transition-colors"
                                                dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                                            {excerpt && <p className="mt-1.5 text-[12px] leading-5 text-muted line-clamp-2">{excerpt}</p>}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </section>
                )}

                {relatedHubs.length > 0 && page === 1 && (
                    <section>
                        <SectionTitleBar eyebrow="Continue explorando" title="Guias relacionados" href="/guias" linkText="ver todos →" />
                        <ul className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
                            {relatedHubs.map(related => (
                                <li key={related.slug}>
                                    <Link href={`/guias/${related.slug}`}
                                        className="flex flex-col gap-1 bg-background p-4 h-full transition-colors hover:bg-surface group">
                                        <span className="text-[13px] font-black text-foreground group-hover:text-accent transition-colors leading-snug">
                                            {related.shortTitle}
                                        </span>
                                        <p className="text-[11px] line-clamp-2 leading-5 text-muted">{related.description}</p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

            </div>

            <ScrollToTop />
        </>
    )
}
