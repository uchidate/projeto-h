import { SITE_NAME } from '@/lib/constants/site'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getFoodBySlug, getFoods, getRelatedFoods, FOOD_CATEGORY_LABELS, FOOD_CATEGORY_EMOJI, KOREA_REGIONS } from '@/lib/wordpress/foods'
import { getProductionsByIds } from '@/lib/wordpress/productions'
import { SITE_URL } from '@/lib/constants/site'
import { stripHtml, getWPImage } from '@/lib/utils'
import { buildWordPressMetadata } from '@/lib/seo/wordpress'
import { buildBreadcrumbSchema, buildRecipeSchema } from '@/lib/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLd'
import { WpEditSetter } from '@/components/ui/WpEditContext'
import { metaDescription } from '@/lib/seo/metaDescription'

export const revalidate = 600

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
    try {
        const { items, totalPages } = await getFoods({ perPage: 100, orderby: 'date' })
        const slugs = items.map(f => ({ slug: f.slug }))
        if (totalPages > 1) {
            for (let p = 2; p <= totalPages; p++) {
                const { items: more } = await getFoods({ page: p, perPage: 100 })
                slugs.push(...more.map(f => ({ slug: f.slug })))
            }
        }
        return slugs
    } catch { return [] }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { slug } = await params
    const food = await getFoodBySlug(slug)
    if (!food) return {}

    const name = stripHtml(food.title.rendered)
    const korean = food.acf?.name_korean
    const title = `${name}${korean ? ` (${korean})` : ''} — Culinária Coreana`
    const description = food.excerpt?.rendered
        ? metaDescription(stripHtml(food.excerpt.rendered))
        : `Tudo sobre ${name}: ingredientes, onde comer, curiosidades e mais.`
    const image = getWPImage(food._embedded, food.featured_image_url)
    const url = `${SITE_URL}/comidas/${slug}`

    return buildWordPressMetadata({ title, description, url, image })
}

const SPICY_LABELS = ['Sem pimenta', 'Levemente picante', 'Picante', 'Bem picante', 'Muito picante', 'Extremamente picante']

export default async function FoodPage({ params }: { params: Params }) {
    const { slug } = await params
    const food = await getFoodBySlug(slug)
    if (!food) notFound()

    const acf = food.acf ?? {}
    const name = stripHtml(food.title.rendered)
    const img = getWPImage(food._embedded, food.featured_image_url)
    const imageCredit = stripHtml(food._embedded?.['wp:featuredmedia']?.[0]?.caption?.rendered ?? '')
    const catLabel = acf.category ? FOOD_CATEGORY_LABELS[acf.category] : null
    const catEmoji = acf.category ? FOOD_CATEGORY_EMOJI[acf.category] : '🍽️'
    const spicy = acf.spicy_level ?? 0
    const foodUrl = `${SITE_URL}/comidas/${slug}`

    const [relatedFoods, dramasInFood] = await Promise.all([
        getRelatedFoods(food.id, acf.category, 6),
        acf.featured_in_dramas?.length
            ? getProductionsByIds(acf.featured_in_dramas)
            : Promise.resolve([]),
    ])

    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: `${SITE_NAME}`, url: SITE_URL },
        { name: 'Comidas', url: `${SITE_URL}/comidas` },
        { name: name, url: foodUrl },
    ])

    const recipeSchema = buildRecipeSchema({
        name,
        nameKorean: acf.name_korean,
        description: stripHtml(food.excerpt?.rendered ?? ''),
        image: img?.src,
        url: foodUrl,
        category: catLabel,
        region: acf.region,
        ingredients: acf.main_ingredients,
        keywords: acf.curiosidades?.length ? [name] : undefined,
        isVegetarian: acf.is_vegetarian,
        isVegan: acf.is_vegan,
        datePublished: food.date,
        dateModified: food.modified,
    })

    return (
        <>
            <WpEditSetter postId={food.id} postType="food" />
            <JsonLd data={breadcrumbSchema} />
            <JsonLd data={recipeSchema} />

            {/* Hero */}
            <div className="border-b border-border/40">
                <div className="page-wrap py-6 sm:py-10">
                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
                        {/* Imagem */}
                        <div className="w-full sm:w-64 shrink-0">
                            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-surface border border-border">
                                {img ? (
                                    <Image src={img.src} alt={name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 256px" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-[80px]">{catEmoji}</span>
                                    </div>
                                )}
                            </div>
                            {img && imageCredit && (
                                <p className="font-mono text-[10px] text-muted/60 mt-1.5 leading-snug">{imageCredit}</p>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            {catLabel && (
                                <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em] mb-2">
                                    {catEmoji} {catLabel}
                                </p>
                            )}
                            <h1 className="text-[32px] sm:text-[44px] font-black tracking-[-0.03em] leading-none">
                                {name}
                            </h1>
                            {acf.name_korean && (
                                <p className="text-[20px] text-muted mt-1">{acf.name_korean}</p>
                            )}
                            {acf.name_romanized && acf.name_romanized !== name && (
                                <p className="font-mono text-[13px] text-muted/70 mt-0.5 italic">{acf.name_romanized}</p>
                            )}

                            {food.excerpt?.rendered && (
                                <p className="text-[15px] leading-relaxed text-foreground/80 mt-4 max-w-xl"
                                    dangerouslySetInnerHTML={{ __html: food.excerpt.rendered }} />
                            )}

                            {/* Badges rápidos */}
                            <div className="flex flex-wrap gap-2 mt-5">
                                {spicy >= 0 && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface font-mono text-[11px]">
                                        {spicy === 0 ? '✅' : '🌶️'.repeat(Math.min(spicy, 3))}
                                        <span className="text-muted">{SPICY_LABELS[spicy] ?? 'Picante'}</span>
                                    </span>
                                )}
                                {acf.is_vegan && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-green-600/40 bg-green-600/10 font-mono text-[11px] text-green-600">
                                        🌱 Vegano
                                    </span>
                                )}
                                {!acf.is_vegan && acf.is_vegetarian && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-green-600/40 bg-green-600/10 font-mono text-[11px] text-green-600">
                                        🥦 Vegetariano
                                    </span>
                                )}
                                {acf.price_range && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface font-mono text-[11px] text-muted">
                                        {acf.price_range}
                                    </span>
                                )}
                                {acf.region && (
                                    (KOREA_REGIONS as readonly string[]).includes(acf.region) ? (
                                        <Link
                                            href={`/comidas?region=${acf.region}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface font-mono text-[11px] text-muted hover:text-foreground hover:border-border-strong transition-colors"
                                        >
                                            📍 {acf.region}
                                        </Link>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface font-mono text-[11px] text-muted">
                                            📍 {acf.region}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-wrap py-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
                {/* Conteúdo principal */}
                <div>
                    {food.content.rendered && (
                        <div
                            className="wp-article-content"
                            dangerouslySetInnerHTML={{ __html: food.content.rendered }}
                        />
                    )}

                    {/* Dramas que mencionam este prato */}
                    {dramasInFood.length > 0 && (
                        <section className="mt-10 pt-8 border-t border-border">
                            <h2 className="text-[18px] font-black tracking-tight mb-5">Aparece em K-Dramas</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {dramasInFood.map(prod => {
                                    const title = stripHtml(prod.title.rendered)
                                    const prodImg = prod.featured_image_url
                                    return (
                                        <Link key={prod.id} href={`/productions/${prod.slug}`}
                                            className="group flex items-center gap-3 p-3 rounded-xl border border-border hover:border-accent transition-colors bg-surface/40">
                                            {prodImg && (
                                                <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-surface">
                                                    <Image src={prodImg} alt={title} fill className="object-cover" sizes="48px" />
                                                </div>
                                            )}
                                            <p className="text-[12px] font-semibold leading-tight group-hover:text-accent transition-colors line-clamp-2">
                                                {title}
                                            </p>
                                        </Link>
                                    )
                                })}
                            </div>
                        </section>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="space-y-6">
                    {/* Ingredientes */}
                    {acf.main_ingredients && acf.main_ingredients.length > 0 && (
                        <div className="rounded-xl border border-border bg-surface/40 p-5">
                            <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted mb-3">Ingredientes principais</h3>
                            <ul className="space-y-1">
                                {acf.main_ingredients.map(ing => (
                                    <li key={ing} className="text-[13px] text-foreground/80">• {ing}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Onde comer */}
                    {acf.where_to_find && (
                        <div className="rounded-xl border border-border bg-surface/40 p-5">
                            <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted mb-3">Onde comer</h3>
                            <p className="text-[13px] text-foreground/80 leading-relaxed">{acf.where_to_find}</p>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${acf.region ?? 'Coreia do Sul'}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 mt-3 text-[12px] font-semibold text-accent hover:underline"
                            >
                                📍 Ver no mapa
                            </a>
                        </div>
                    )}

                    {/* Ocasiões e estações */}
                    {(acf.occasion?.length || acf.season?.length) && (
                        <div className="rounded-xl border border-border bg-surface/40 p-5 space-y-4">
                            {acf.occasion && acf.occasion.length > 0 && (
                                <div>
                                    <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted mb-2">Ocasião</h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {acf.occasion.map(occ => (
                                            <span key={occ} className="px-2 py-0.5 rounded-full border border-border font-mono text-[10px] text-muted">{occ}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {acf.season && acf.season.length > 0 && (
                                <div>
                                    <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted mb-2">Melhor época</h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {acf.season.map(s => (
                                            <span key={s} className="px-2 py-0.5 rounded-full border border-border font-mono text-[10px] text-muted">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Curiosidades */}
                    {acf.curiosidades && acf.curiosidades.length > 0 && (
                        <div className="rounded-xl border border-surface-editorial bg-surface-editorial/30 p-5">
                            <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-accent mb-3">Curiosidades</h3>
                            <ul className="space-y-2">
                                {acf.curiosidades.map((c, i) => (
                                    <li key={i} className="text-[13px] text-foreground/80 leading-relaxed">💡 {c}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Alérgenos */}
                    {acf.allergens && acf.allergens.length > 0 && (
                        <div className="rounded-xl border border-border bg-surface/40 p-5">
                            <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted mb-2">Alérgenos</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {acf.allergens.map(a => (
                                    <span key={a} className="px-2 py-0.5 rounded-full border border-border font-mono text-[10px] text-muted">⚠️ {a}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>
            </div>

            {/* Comidas relacionadas */}
            {relatedFoods.length > 0 && (
                <div className="border-t border-border/40">
                    <div className="page-wrap py-8">
                        <h2 className="text-[18px] font-black tracking-tight mb-5">Mais da culinária coreana</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {relatedFoods.map(f => {
                                const fname = stripHtml(f.title.rendered)
                                const fImg = f.featured_image_url
                                const fCatEmoji = f.acf?.category ? FOOD_CATEGORY_EMOJI[f.acf.category] : '🍽️'
                                return (
                                    <Link key={f.id} href={`/comidas/${f.slug}`}
                                        className="group flex flex-col rounded-xl border border-border hover:border-accent transition-colors overflow-hidden">
                                        <div className="relative aspect-square bg-surface overflow-hidden">
                                            {fImg ? (
                                                <Image src={fImg} alt={fname} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 16vw" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="text-[32px]">{fCatEmoji}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2.5">
                                            <p className="text-[12px] font-bold leading-tight group-hover:text-accent transition-colors line-clamp-2">{fname}</p>
                                            {f.acf?.name_korean && (
                                                <p className="text-[10px] text-muted mt-0.5">{f.acf.name_korean}</p>
                                            )}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                        <div className="mt-6">
                            <Link href="/comidas" className="font-mono text-[12px] font-semibold text-muted hover:text-foreground transition-colors">
                                ← Ver todas as comidas
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
