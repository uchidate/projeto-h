import { Fragment } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Building2, Calendar, Music2, Star, ArrowUpDown, SlidersHorizontal } from 'lucide-react'
import { getAgencies } from '@/lib/wordpress/agencies'
import { getArtists } from '@/lib/wordpress/artists'
import { getAllGroups } from '@/lib/wordpress/groups'
import { SITE_URL } from '@/lib/constants/site'
import { getWPImage, stripHtml } from '@/lib/utils'
import { JsonLd } from '@/components/seo/JsonLd'
import { agencyMark, optionalAccent, type CSSVariableProperties } from '@/lib/agencies/presentation'
import { ResponsiveFilterBar } from '@/components/ui/ResponsiveFilterBar'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import type { WPArtist, WPGroup } from '@/lib/wordpress/types'

export const revalidate = 3600

const BIG4_SLUGS = new Set(['sm-entertainment', 'hybe', 'yg-entertainment', 'jyp-entertainment'])
const AGENCY_DESCRIPTION = 'Conheça as principais agências de entretenimento coreanas — HYBE, SM, YG, JYP e muito mais.'

type RawSearchParams = { search?: string | string[]; type?: string | string[]; sortBy?: string | string[] }
type SearchParams = Promise<RawSearchParams>

function firstParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const raw = await searchParams
    const hasFilters = Boolean(firstParam(raw.search)?.trim() || firstParam(raw.type) || firstParam(raw.sortBy))

    return {
        title: 'Agências K-Pop',
        description: AGENCY_DESCRIPTION,
        alternates: { canonical: `${SITE_URL}/agencies` },
        robots: hasFilters ? { index: false, follow: true } : undefined,
        openGraph: {
            title: 'Agências K-Pop',
            description: 'As maiores agências de entretenimento da Coreia do Sul.',
            url: `${SITE_URL}/agencies`,
            type: 'website',
        },
    }
}

export default async function AgenciesPage({ searchParams }: { searchParams: SearchParams }) {
    const raw = await searchParams
    const search = firstParam(raw.search)?.trim() || undefined
    const rawType = firstParam(raw.type)
    const rawSort = firstParam(raw.sortBy)
    const type = rawType === 'big4' || rawType === 'mid' || rawType === 'subsidiary' ? rawType : 'all'
    const sortBy = rawSort === 'name' || rawSort === 'founded' ? rawSort : 'roster'

    const [agenciesResult, artistsResult, groupsResult] = await Promise.allSettled([
        getAgencies({ perPage: 100, orderby: 'title', order: 'asc', search }),
        getArtists({ perPage: 100, orderby: 'date', order: 'desc' }),
        getAllGroups({ orderby: 'date', order: 'desc' }),
    ])
    const agencies = agenciesResult.status === 'fulfilled' ? agenciesResult.value.items : []
    const artists = artistsResult.status === 'fulfilled' ? artistsResult.value.items : []
    const groups = groupsResult.status === 'fulfilled' ? groupsResult.value : []

    const artistsByAgency = new Map<number, WPArtist[]>()
    const groupsByAgency = new Map<number, WPGroup[]>()
    artists.forEach(artist => {
        const id = artist.acf?.agency
        if (!id) return
        artistsByAgency.set(id, [...(artistsByAgency.get(id) ?? []), artist])
    })
    groups.forEach(group => {
        const id = group.acf?.agency
        if (!id) return
        groupsByAgency.set(id, [...(groupsByAgency.get(id) ?? []), group])
    })

    // Filter by type
    const filtered = agencies.filter(a => {
        if (type === 'big4') return BIG4_SLUGS.has(a.slug)
        if (type === 'subsidiary') return a.agency_type === 'subsidiary'
        if (type === 'mid') return !BIG4_SLUGS.has(a.slug) && a.agency_type !== 'subsidiary'
        return true
    })

    // Sort
    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'name') return stripHtml(a.title.rendered).localeCompare(stripHtml(b.title.rendered))
        if (sortBy === 'founded') {
            const ay = a.acf?.founded_year ?? 9999
            const by_ = b.acf?.founded_year ?? 9999
            return ay - by_
        }
        // roster (default): Big 4 first, then by roster size
        const aBig4 = BIG4_SLUGS.has(a.slug) ? 1 : 0
        const bBig4 = BIG4_SLUGS.has(b.slug) ? 1 : 0
        if (bBig4 !== aBig4) return bBig4 - aBig4
        const aTotal = a.acf?.artists_count ?? 0
        const bTotal = b.acf?.artists_count ?? 0
        if (bTotal !== aTotal) return bTotal - aTotal
        return stripHtml(a.title.rendered).localeCompare(stripHtml(b.title.rendered))
    })

    const big4 = sorted.filter(a => BIG4_SLUGS.has(a.slug))
    const rest = sorted.filter(a => !BIG4_SLUGS.has(a.slug))

    const buildHref = (overrides: Record<string, string>) => {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (type !== 'all') params.set('type', type)
        if (sortBy !== 'roster') params.set('sortBy', sortBy)
        Object.entries(overrides).forEach(([k, v]) => {
            if (!v || v === 'all' || (k === 'sortBy' && v === 'roster')) params.delete(k)
            else params.set(k, v)
        })
        const q = params.toString()
        return q ? `/agencies?${q}` : '/agencies'
    }

    const searchLabel = search ? `“${search}”` : undefined
    const typeLabel = type === 'big4' ? 'Big 4' : type === 'mid' ? 'Mid & Indie' : type === 'subsidiary' ? 'Subsidiárias' : undefined
    const sortLabel = sortBy === 'name' ? 'A-Z' : sortBy === 'founded' ? 'Fundação' : undefined
    const activeLabel = [searchLabel, typeLabel, sortLabel].filter(Boolean).join(', ') || undefined

    const chipClass = (active: boolean) =>
        `h-8 shrink-0 rounded-md px-3 text-[12px] font-bold transition-colors ${
            active ? 'bg-foreground text-background' : 'text-muted hover:bg-surface hover:text-foreground'
        }`

    return (
        <>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: 'Agências K-Pop',
                url: `${SITE_URL}/agencies`,
                description: 'As principais agências de entretenimento coreanas.',
                mainEntity: {
                    '@type': 'ItemList',
                    numberOfItems: sorted.length,
                    itemListElement: sorted.map((agency, index) => ({
                        '@type': 'ListItem',
                        position: index + 1,
                        name: stripHtml(agency.title.rendered),
                        url: `${SITE_URL}/agencies/${agency.slug}`,
                    })),
                },
            }} />

            {/* ── Filter bar ──────────────────────────────────── */}
            <ResponsiveFilterBar label={activeLabel ? `Filtros: ${activeLabel}` : 'Filtros'} value={activeLabel}>
                <div className="space-y-3 lg:flex lg:w-full lg:items-center lg:gap-4 lg:space-y-0">
                    {/* Tipo */}
                    <div className="flex shrink-0 items-center gap-1.5">
                        <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                            <SlidersHorizontal className="h-3 w-3" />
                            Tipo
                        </span>
                        <nav aria-label="Filtrar por tipo de agência" className="flex items-center gap-1 rounded-md bg-surface p-1">
                            <Link href={buildHref({ type: 'all' })} aria-current={type === 'all' ? 'page' : undefined} className={chipClass(type === 'all')}>Todas</Link>
                            <Link href={buildHref({ type: 'big4' })} aria-current={type === 'big4' ? 'page' : undefined} className={chipClass(type === 'big4')}>
                                Big 4 <Star size={10} className="inline ml-0.5 mb-0.5" />
                            </Link>
                            <Link href={buildHref({ type: 'mid' })} aria-current={type === 'mid' ? 'page' : undefined} className={chipClass(type === 'mid')}>Mid & Indie</Link>
                            <Link href={buildHref({ type: 'subsidiary' })} aria-current={type === 'subsidiary' ? 'page' : undefined} className={chipClass(type === 'subsidiary')}>Subsidiárias</Link>
                        </nav>
                    </div>

                    <div className="hidden lg:block h-5 w-px bg-border/50" />

                    {/* Ordenação */}
                    <div className="flex shrink-0 items-center gap-1.5">
                        <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                            <ArrowUpDown className="h-3 w-3" />
                            Ordenar
                        </span>
                        <nav aria-label="Ordenar agências" className="flex items-center gap-1 rounded-md bg-surface p-1">
                            <Link href={buildHref({ sortBy: 'roster' })} aria-current={sortBy === 'roster' ? 'page' : undefined} className={chipClass(sortBy === 'roster')}>Elenco</Link>
                            <Link href={buildHref({ sortBy: 'name' })} aria-current={sortBy === 'name' ? 'page' : undefined} className={chipClass(sortBy === 'name')}>A–Z</Link>
                            <Link href={buildHref({ sortBy: 'founded' })} aria-current={sortBy === 'founded' ? 'page' : undefined} className={chipClass(sortBy === 'founded')}>Fundação</Link>
                        </nav>
                    </div>

                    {activeLabel && (
                        <Link href="/agencies" className="ml-auto shrink-0 font-mono text-[11px] text-muted underline underline-offset-2 hover:text-foreground">
                            Limpar
                        </Link>
                    )}
                </div>
            </ResponsiveFilterBar>

            {/* ── Header ──────────────────────────────────────── */}
            <div className="border-b border-border/40">
                <div className="page-wrap py-6 sm:py-10">
                    <div className="mt-4">
                        <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em] mb-1">Entretenimento</p>
                        <h1 className="text-[28px] sm:text-[40px] font-black tracking-[-0.03em] leading-tight">
                            Agências K-Pop
                        </h1>
                        <p className="text-[14px] text-muted mt-2 max-w-lg">
                            As empresas por trás dos maiores artistas e grupos da Coreia do Sul — das Big 4 às independentes.
                        </p>
                    </div>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <form method="get" action="/agencies" className="flex gap-2">
                            {type && type !== 'all' && <input type="hidden" name="type" value={type} />}
                            {sortBy && sortBy !== 'roster' && <input type="hidden" name="sortBy" value={sortBy} />}
                            <label htmlFor="agency-search" className="sr-only">Buscar agência</label>
                            <input
                                id="agency-search"
                                type="search"
                                name="search"
                                defaultValue={search}
                                placeholder="Buscar agência..."
                                className="h-9 w-full max-w-xs rounded-md border border-border bg-surface px-3 text-[13px] placeholder:text-muted/60 focus:border-foreground focus:outline-hidden"
                            />
                            <button type="submit" className="h-9 shrink-0 rounded-md bg-foreground px-3 text-[12px] font-bold text-background">Buscar</button>
                        </form>
                        {sorted.length > 0 && (
                            <p className="shrink-0 font-mono text-[11px] text-muted" aria-live="polite">
                                {sorted.length} {sorted.length === 1 ? 'agência encontrada' : 'agências encontradas'}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Content ─────────────────────────────────────── */}
            <div className="page-wrap py-8 space-y-10">
                {sorted.length === 0 ? (
                    <div className="flex flex-col items-center py-20 text-center">
                        <Building2 size={48} className="text-muted/20 mb-4" />
                        <p className="text-[16px] font-bold mb-1">Nenhuma agência encontrada</p>
                        <p className="text-[13px] text-muted">
                            {search ? <>Não encontramos resultados para “{search}”.</> : 'Tente remover os filtros selecionados.'}
                        </p>
                        <Link href="/agencies" className="mt-5 rounded-md border border-border px-4 py-2 text-[12px] font-bold hover:border-foreground">
                            Ver todas as agências
                        </Link>
                    </div>
                ) : (
                    <>
                        {big4.length > 0 && type !== 'mid' && (
                            <section>
                                <div className="flex items-center gap-3 mb-5 border-b border-foreground pb-3">
                                    <div className="h-7 w-1 shrink-0 bg-accent" />
                                    <div>
                                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">As maiores</p>
                                        <h2 className="text-lg font-black tracking-[-0.03em] flex items-center gap-2">
                                            Big 4 <Star size={14} className="text-accent" fill="currentColor" />
                                        </h2>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {big4.map(agency => (
                                        <AgencyCard
                                            key={agency.id}
                                            agency={agency}
                                            agencyGroups={groupsByAgency.get(agency.id) ?? []}
                                            agencyArtists={artistsByAgency.get(agency.id) ?? []}
                                            featured
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {ADSENSE.slots.inline && big4.length > 0 && rest.length > 0 && (
                            <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="agencies_feed" />
                        )}

                        {rest.length > 0 && (
                            <section>
                                {big4.length > 0 && type !== 'mid' && (
                                    <div className="flex items-center gap-3 mb-5 border-b border-foreground/10 pb-3">
                                        <div className="h-7 w-1 shrink-0 bg-foreground/20" />
                                        <div>
                                            <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Além das Big 4</p>
                                            <h2 className="text-lg font-black tracking-[-0.03em]">Outras agências</h2>
                                        </div>
                                    </div>
                                )}
                                {type === 'mid' && (
                                    <div className="flex items-center gap-3 mb-5 border-b border-foreground/10 pb-3">
                                        <div className="h-7 w-1 shrink-0 bg-foreground/20" />
                                        <div>
                                            <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Mid & Independentes</p>
                                            <h2 className="text-lg font-black tracking-[-0.03em]">{rest.length} agências</h2>
                                        </div>
                                    </div>
                                )}
                                {type === 'subsidiary' && (
                                    <div className="flex items-center gap-3 mb-5 border-b border-foreground/10 pb-3">
                                        <div className="h-7 w-1 shrink-0 bg-foreground/20" />
                                        <div>
                                            <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Selos e empresas vinculadas</p>
                                            <h2 className="text-lg font-black tracking-[-0.03em]">{rest.length} subsidiárias</h2>
                                        </div>
                                    </div>
                                )}
                                {/* Grade cortada em duas, com anúncio entre elas.
                                    Medido em 2026-09-17: esta página tem 23.000px de rolagem
                                    no celular e não tinha anúncio nenhum. Cortar a grade (em
                                    vez de inserir no meio dela) evita fileira pela metade. */}
                                {(() => {
                                    // A cada 12 subsidiárias, não só uma vez: com um corte só,
                                    // a página ficou com 2 anúncios em 27 telas de rolagem.
                                    const CORTE = 12
                                    const blocos: typeof rest[] = []
                                    if (ADSENSE.slots.inline) for (let i = 0; i < rest.length; i += CORTE) blocos.push(rest.slice(i, i + CORTE))
                                    else blocos.push(rest)
                                    return blocos.map((bloco, indice) => (
                                        <Fragment key={`subsidiarias-${indice}`}>
                                            {indice > 0 && (
                                                <div className="my-6">
                                                    <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="agencies_grid" />
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                {bloco.map(agency => (
                                                    <AgencyCard
                                                        key={agency.id}
                                                        agency={agency}
                                                        agencyGroups={groupsByAgency.get(agency.id) ?? []}
                                                        agencyArtists={artistsByAgency.get(agency.id) ?? []}
                                                        featured={false}
                                                    />
                                                ))}
                                            </div>
                                        </Fragment>
                                    ))
                                })()}
                            </section>
                        )}

                        {/* Big 4 only, no rest */}
                        {type === 'big4' && rest.length === 0 && big4.length > 0 && null}
                    </>
                )}
            </div>
        </>
    )
}

type AgencyCardProps = {
    agency: Awaited<ReturnType<typeof getAgencies>>['items'][number]
    agencyGroups: WPGroup[]
    agencyArtists: WPArtist[]
    featured: boolean
}

function AgencyCard({ agency, agencyGroups, agencyArtists, featured }: AgencyCardProps) {
    const image = getWPImage(agency._embedded, agency.featured_image_url)
    const name = stripHtml(agency.title.rendered)
    const acf = agency.acf ?? {}
    const accentColor = optionalAccent(agency.accent_color)
    const description = stripHtml(agency.excerpt?.rendered ?? '')
    const mark = agencyMark(name)
    const classification = BIG4_SLUGS.has(agency.slug)
        ? 'Big 4'
        : agency.agency_type === 'subsidiary'
            ? 'Subsidiária'
            : agency.agency_type === 'major' ? 'Grande agência' : null

    const roster = [...agencyGroups, ...agencyArtists]
        .map(item => ({
            id: item.id,
            name: stripHtml(item.title.rendered),
            image: getWPImage(item._embedded, item.featured_image_url),
        }))
        .filter(item => item.image)
        .slice(0, featured ? 4 : 5)

    // artists_count was migrated as the full roster total (artists + groups).
    // The arrays above are intentionally only a visual sample for the collage.
    const rosterCount = acf.artists_count ?? (agencyGroups.length + agencyArtists.length)

    const cardStyle: CSSVariableProperties = accentColor
        ? { '--card-ac': accentColor, borderTopColor: 'var(--card-ac)', borderTopWidth: 3 }
        : { borderTopWidth: 3, borderTopColor: 'transparent' }

    return (
        <Link
            href={`/agencies/${agency.slug}`}
            prefetch={false}
            style={cardStyle}
            className="group flex flex-col overflow-hidden border border-border bg-background transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/20 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-(--card-ac,var(--color-foreground)) focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
            <div className={`relative overflow-hidden bg-surface ${featured ? 'h-44' : 'h-36'}`}>
                {roster.length > 0 ? (
                    <div className="absolute inset-0 flex">
                        {roster.map(item => (
                            <div key={item.id} className="relative min-w-0 flex-1 border-r border-black/10 last:border-r-0 overflow-hidden">
                                <Image
                                    src={item.image!.src}
                                    alt={item.name}
                                    fill
                                    className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                                    sizes="120px"
                                />
                            </div>
                        ))}
                    </div>
                ) : image ? (
                    <Image src={image.src} alt={image.alt || name} fill className="object-contain p-8" sizes="420px" />
                ) : (
                    <div
                        className="relative flex h-full w-full items-center justify-center overflow-hidden bg-surface"
                        style={accentColor ? { background: `linear-gradient(135deg, ${accentColor}35, ${accentColor}0d 70%)` } : undefined}
                    >
                        <span className="absolute font-black tracking-[-0.08em] text-[clamp(52px,7vw,84px)] text-foreground/[0.07] transition-transform duration-500 group-hover:scale-105 text-(--card-ac,var(--color-foreground))">
                            {mark}
                        </span>
                        <span className="relative mb-8 border border-foreground/10 bg-background/60 px-3 py-1.5 font-mono text-[11px] font-black tracking-[0.18em] text-foreground/45 backdrop-blur-xs">
                            {mark}
                        </span>
                    </div>
                )}

                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-black/10" />
                {classification && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 border border-white/20 bg-black/55 px-2 py-1 font-mono text-[8px] font-black uppercase tracking-[0.12em] text-white/80 backdrop-blur-xs">
                        {classification === 'Big 4' && <Star size={8} fill="currentColor" />}
                        {classification}
                    </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                    <div className="min-w-0">
                        <h3 className="truncate text-[16px] sm:text-[17px] font-black leading-tight text-white">{name}</h3>
                        {acf.name_hangul && (
                            <p className="mt-0.5 font-mono text-[10px] text-white/50">{acf.name_hangul}</p>
                        )}
                    </div>
                    {image && roster.length > 0 && (
                        <div className="relative h-10 w-10 shrink-0 border border-white/20 bg-white/90 overflow-hidden">
                            <Image src={image.src} alt="" fill className="object-contain p-1.5" sizes="40px" />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
                {description && (
                    <p className="mb-3 line-clamp-2 text-[12px] leading-relaxed text-muted">{description}</p>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/40 pt-3 font-mono text-[10px] text-muted">
                    {acf.founded_year && (
                        <span className="flex items-center gap-1.5">
                            <Calendar size={10} /> {acf.founded_year}
                        </span>
                    )}
                    {rosterCount > 0 && (
                        <span className="flex items-center gap-1.5">
                            <Music2 size={10} />
                            {rosterCount} {rosterCount === 1 ? 'nome no elenco' : 'nomes no elenco'}
                        </span>
                    )}
                    {rosterCount === 0 && (
                        <span className="text-muted/40">Sem elenco cadastrado</span>
                    )}
                </div>
            </div>
        </Link>
    )
}
