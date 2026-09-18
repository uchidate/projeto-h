import type { Metadata } from 'next'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getFoods, FOOD_CATEGORY_LABELS, FOOD_CATEGORY_EMOJI, KOREA_REGIONS } from '@/lib/wordpress/foods'
import type { FoodCategory } from '@/lib/wordpress/types'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { stripHtml } from '@/lib/utils'
import { KoreaRegionMap } from '@/components/food/KoreaRegionMap'

export const revalidate = 600

type SearchParams = Promise<{ search?: string; page?: string; category?: string; vegetarian?: string; occasion?: string; season?: string; maxSpicy?: string; region?: string }>

type ComidasParams = { category?: string; vegetarian?: string; page?: string; occasion?: string; season?: string; maxSpicy?: string; region?: string }

function buildComidasPath(sp: ComidasParams) {
    const ps = new URLSearchParams()
    if (sp.category) ps.set('category', sp.category)
    if (sp.vegetarian) ps.set('vegetarian', sp.vegetarian)
    if (sp.occasion) ps.set('occasion', sp.occasion)
    if (sp.season) ps.set('season', sp.season)
    if (sp.maxSpicy) ps.set('maxSpicy', sp.maxSpicy)
    if (sp.region) ps.set('region', sp.region)
    if (sp.page && sp.page !== '1') ps.set('page', sp.page)
    return `/comidas${ps.toString() ? `?${ps}` : ''}`
}

function buildComidasUrl(sp: ComidasParams) {
    return `${SITE_URL}${buildComidasPath(sp)}`
}

const VALID_CATEGORIES = Object.keys(FOOD_CATEGORY_LABELS) as FoodCategory[]

const CURATED_COLLECTIONS: Array<{ label: string; emoji: string; params: { occasion?: string; season?: string; vegetarian?: string; maxSpicy?: string } }> = [
    { label: 'Pratos de inverno', emoji: '❄️', params: { season: 'winter' } },
    { label: 'Comida de festival', emoji: '🎉', params: { occasion: 'celebration' } },
    { label: 'Comfort food', emoji: '🤗', params: { occasion: 'comfort' } },
    { label: 'Cura de ressaca', emoji: '🍶', params: { occasion: 'hangover' } },
    { label: '100% vegetariano', emoji: '🥦', params: { vegetarian: 'true' } },
    { label: 'Sem pimenta', emoji: '✅', params: { maxSpicy: '0' } },
]

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const sp = await searchParams
    const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
    const url = buildComidasUrl(sp)
    const category = VALID_CATEGORIES.includes(sp.category as FoodCategory) ? (sp.category as FoodCategory) : undefined
    const vegetarian = sp.vegetarian === 'true' ? true : undefined
    const maxSpicy = sp.maxSpicy !== undefined ? parseInt(sp.maxSpicy, 10) : undefined
    const region = (KOREA_REGIONS as readonly string[]).includes(sp.region ?? '') ? sp.region : undefined
    const { totalPages } = await getFoods({ page, perPage: 48, search: sp.search, category, vegetarian, occasion: sp.occasion, season: sp.season, maxSpicy, region, orderby: 'date', order: 'desc' })
    const hasFacets = Boolean(sp.search || sp.category || sp.vegetarian || sp.occasion || sp.season || sp.maxSpicy || sp.region)
    const invalidPage = page > Math.max(1, totalPages)

    return {
        title: 'Comidas Coreanas — Guia Completo',
        description: 'Descubra a culinária coreana: bibimbap, tteokbokki, samgyeopsal e muito mais. Guia completo em português.',
        alternates: {
            canonical: url,
            ...(page > 1 ? { prev: buildComidasUrl({ ...sp, page: String(page - 1) }) } : {}),
            ...(page < totalPages ? { next: buildComidasUrl({ ...sp, page: String(page + 1) }) } : {}),
        },
        ...(hasFacets || invalidPage ? { robots: { index: false, follow: true } } : {}),
        openGraph: baseOG(url),
        twitter: baseTwitter(),
    }
}

export default async function ComidasPage({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams
    const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
    const category = VALID_CATEGORIES.includes(sp.category as FoodCategory) ? (sp.category as FoodCategory) : undefined
    const vegetarian = sp.vegetarian === 'true' ? true : undefined
    const maxSpicy = sp.maxSpicy !== undefined ? parseInt(sp.maxSpicy, 10) : undefined
    const region = (KOREA_REGIONS as readonly string[]).includes(sp.region ?? '') ? sp.region : undefined
    const activeCollection = CURATED_COLLECTIONS.find(c =>
        (c.params.occasion ?? undefined) === sp.occasion &&
        (c.params.season ?? undefined) === sp.season &&
        (c.params.vegetarian ?? undefined) === sp.vegetarian &&
        (c.params.maxSpicy ?? undefined) === sp.maxSpicy,
    )

    const { items: foods, total, totalPages } = await getFoods({
        page,
        perPage: 48,
        search: sp.search,
        category,
        vegetarian,
        occasion: sp.occasion,
        season: sp.season,
        maxSpicy,
        region,
        orderby: 'date',
        order: 'desc',
    })
    if (page > Math.max(1, totalPages)) notFound()

    return (
        <div>
            {/* Header */}
            <div className="border-b border-border/40">
                <div className="page-wrap py-6 sm:py-10">
                    <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em] mb-1">Gastronomia Coreana</p>
                    <h1 className="text-[28px] sm:text-[40px] font-black tracking-[-0.03em] leading-tight">
                        Comidas Coreanas
                    </h1>
                    <p className="text-[14px] leading-relaxed text-foreground/70 mt-3 max-w-2xl">
                        Da cozinha tradicional ao street food de Seul — conheça os pratos que definem a culinária coreana, com dicas de onde comer, ingredientes e curiosidades.
                    </p>
                </div>
            </div>

            {/* Filtros por categoria */}
            <div className="border-b border-border/40 bg-surface/30">
                <div className="page-wrap py-3 flex flex-wrap gap-2">
                    <Link
                        href="/comidas"
                        scroll={false}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11px] font-semibold transition-colors border ${
                            !category
                                ? 'bg-accent-a11y text-white border-accent-a11y'
                                : 'border-border text-muted hover:text-foreground hover:border-border-strong'
                        }`}
                    >
                        Todos
                    </Link>
                    {VALID_CATEGORIES.map(cat => (
                        <Link
                            key={cat}
                            href={`/comidas?category=${cat}`}
                            scroll={false}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11px] font-semibold transition-colors border ${
                                category === cat
                                    ? 'bg-accent-a11y text-white border-accent-a11y'
                                    : 'border-border text-muted hover:text-foreground hover:border-border-strong'
                            }`}
                        >
                            <span>{FOOD_CATEGORY_EMOJI[cat]}</span>
                            {FOOD_CATEGORY_LABELS[cat]}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Coleções curadas */}
            <div className="border-b border-border/40">
                <div className="page-wrap py-3 flex flex-wrap gap-2">
                    {CURATED_COLLECTIONS.map(col => {
                        const isActive = col === activeCollection
                        return (
                            <Link
                                key={col.label}
                                href={buildComidasPath(col.params)}
                                scroll={false}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11px] font-semibold transition-colors border ${
                                    isActive
                                        ? 'bg-accent-a11y text-white border-accent-a11y'
                                        : 'border-border text-muted hover:text-foreground hover:border-border-strong'
                                }`}
                            >
                                <span>{col.emoji}</span>
                                {col.label}
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* Mapa por região */}
            {page === 1 && (
                <div className="page-wrap py-8">
                    <KoreaRegionMap activeRegion={region} />
                </div>
            )}

            {/* Grid */}
            <div className="page-wrap py-8">
                {foods.length === 0 ? (
                    <div className="flex flex-col items-center py-20 text-center">
                        <p className="text-[48px] mb-4">🍜</p>
                        <p className="text-[16px] font-bold mb-1">Nenhuma comida encontrada</p>
                        <p className="text-[13px] text-muted mb-4">Em breve mais pratos no catálogo.</p>
                        <Link href="/comidas" className="text-[13px] font-semibold text-accent hover:underline">
                            ← Ver todas as comidas
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="font-mono text-[11px] text-muted mb-6">
                            {total} prato{total !== 1 ? 's' : ''}
                            {category ? ` em ${FOOD_CATEGORY_LABELS[category]}` : ''}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {foods.map(food => {
                                const name = stripHtml(food.title.rendered)
                                const acf = food.acf ?? {}
                                const img = food.featured_image_url
                                const catLabel = acf.category ? FOOD_CATEGORY_LABELS[acf.category] : null
                                const catEmoji = acf.category ? FOOD_CATEGORY_EMOJI[acf.category] : '🍽️'
                                const spicy = acf.spicy_level ?? 0

                                return (
                                    <Link
                                        key={food.id}
                                        href={`/comidas/${food.slug}`}
                                        className="group flex flex-col rounded-xl border border-border hover:border-accent transition-colors bg-background hover:bg-surface/60 overflow-hidden"
                                    >
                                        <div className="relative aspect-square overflow-hidden bg-surface">
                                            {img ? (
                                                <Image
                                                    src={img} alt={name} fill
                                                    className="object-cover group-hover:scale-[1.05] transition-transform duration-500"
                                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="text-[40px]">{catEmoji}</span>
                                                </div>
                                            )}
                                            {spicy > 0 && (
                                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs rounded-full px-1.5 py-0.5">
                                                    <span className="text-[10px]">{'🌶️'.repeat(Math.min(spicy, 3))}</span>
                                                </div>
                                            )}
                                            {(acf.is_vegetarian || acf.is_vegan) && (
                                                <div className="absolute top-2 left-2 bg-green-600/80 backdrop-blur-xs rounded-full px-1.5 py-0.5">
                                                    <span className="font-mono text-[8px] text-white font-bold">
                                                        {acf.is_vegan ? 'VEGAN' : 'VEG'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <p className="text-[13px] font-bold leading-tight group-hover:text-accent transition-colors line-clamp-2">
                                                {name}
                                            </p>
                                            {acf.name_korean && (
                                                <p className="text-[11px] text-muted mt-0.5">{acf.name_korean}</p>
                                            )}
                                            {catLabel && (
                                                <p className="font-mono text-[10px] text-muted/60 mt-1">{catLabel}</p>
                                            )}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>

                        {/* Página sem anúncio nenhum até 2026-09-17 (inventário de todas as rotas no celular). */}
                        {foods.length > 0 && ADSENSE.slots.inline && (
                            <div className="mt-10">
                                <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="comidas_lista" />
                            </div>
                        )}

                        {/* Paginação */}
                        {totalPages > 1 && (
                            <div className="flex items-center gap-3 mt-10 pt-6 border-t border-border">
                                {page > 1 && (
                                    <Link href={buildComidasPath({ ...sp, page: String(page - 1) })}
                                        className="font-mono text-[12px] font-semibold text-muted hover:text-foreground transition-colors">
                                        ← Anterior
                                    </Link>
                                )}
                                <span className="font-mono text-[11px] text-muted ml-auto">
                                    Página {page} de {totalPages}
                                </span>
                                {page < totalPages && (
                                    <Link href={buildComidasPath({ ...sp, page: String(page + 1) })}
                                        className="font-mono text-[12px] font-semibold text-accent hover:underline">
                                        Próxima →
                                    </Link>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
