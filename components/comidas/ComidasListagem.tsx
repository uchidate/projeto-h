import { getTranslations } from 'next-intl/server'
import { defaultCatalogLanguages, buildCatalogMetadata } from '@/components/features/LocalizedCatalog'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { hasLocale, localizeEntity } from '@/lib/i18n/entity-translation'
import { localizarCaminho } from '@/lib/i18n/localizar-caminho'
import { href } from '@/lib/i18n/routes'
import type { Metadata } from 'next'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import { getFoods, FOOD_CATEGORY_LABELS, FOOD_CATEGORY_EMOJI, KOREA_REGIONS } from '@/lib/wordpress/foods'
import type { FoodCategory } from '@/lib/wordpress/types'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { stripHtml } from '@/lib/utils'
import { KoreaRegionMap } from '@/components/food/KoreaRegionMap'
import { PageBreadcrumb } from '@/components/seo/PageBreadcrumb'
import { buildVitrineMatcher } from '@/lib/wordpress/vitrine'
import { getPosts, getCategories } from '@/lib/wordpress/posts'
import { BlogGuiaCard } from '@/components/blog/BlogGuiaCard'
import { ShopRelatedSection } from '@/components/ui/ShopRelatedSection'
import { CATEGORIAS_COM_LOJA } from '@/lib/blog/categoriaLoja'
import { carregarLojaDoTema } from '@/lib/blog/lojaDoTema'
import { BlogMarcasFaixa } from '@/components/blog/BlogMarcasFaixa'
import { receitasEmDestaque } from '@/lib/comidas/receitasEmDestaque'

export type SearchParams = Promise<{ search?: string; page?: string; category?: string; vegetarian?: string; occasion?: string; season?: string; maxSpicy?: string; region?: string }>

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

function buildComidasUrl(sp: ComidasParams, locale: Locale = DEFAULT_LOCALE) {
    return `${SITE_URL}${localizarCaminho(buildComidasPath(sp), locale)}`
}

const VALID_CATEGORIES = Object.keys(FOOD_CATEGORY_LABELS) as FoodCategory[]

const CURATED_COLLECTIONS: Array<{ id: 'winter' | 'festival' | 'comfort' | 'hangover' | 'vegetarian' | 'noSpice'; emoji: string; params: { occasion?: string; season?: string; vegetarian?: string; maxSpicy?: string } }> = [
    { id: 'winter', emoji: '❄️', params: { season: 'winter' } },
    { id: 'festival', emoji: '🎉', params: { occasion: 'celebration' } },
    { id: 'comfort', emoji: '🤗', params: { occasion: 'comfort' } },
    { id: 'hangover', emoji: '🍶', params: { occasion: 'hangover' } },
    { id: 'vegetarian', emoji: '🥦', params: { vegetarian: 'true' } },
    { id: 'noSpice', emoji: '✅', params: { maxSpicy: '0' } },
]

export async function metadataComidas({ searchParams, locale = DEFAULT_LOCALE }: { searchParams: SearchParams; locale?: Locale }): Promise<Metadata> {
    const [sp, t] = await Promise.all([searchParams, getTranslations({ locale, namespace: 'entity.foodsList' })])
    const emPt = locale === DEFAULT_LOCALE
    const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
    const url = buildComidasUrl(sp, locale)
    const category = VALID_CATEGORIES.includes(sp.category as FoodCategory) ? (sp.category as FoodCategory) : undefined
    const vegetarian = sp.vegetarian === 'true' ? true : undefined
    const maxSpicy = sp.maxSpicy !== undefined ? parseInt(sp.maxSpicy, 10) : undefined
    const region = (KOREA_REGIONS as readonly string[]).includes(sp.region ?? '') ? sp.region : undefined
    const { totalPages } = await getFoods({ page, perPage: 48, search: sp.search, category, vegetarian, occasion: sp.occasion, season: sp.season, maxSpicy, region, orderby: 'date', order: 'desc', locale: emPt ? undefined : locale })
    const hasFacets = Boolean(sp.search || sp.category || sp.vegetarian || sp.occasion || sp.season || sp.maxSpicy || sp.region)
    const invalidPage = page > Math.max(1, totalPages)
    const languages = page === 1 && !hasFacets
        ? (emPt ? await defaultCatalogLanguages('foods') : (await buildCatalogMetadata('foods', locale)).alternates?.languages)
        : undefined

    return {
        title: t('metaTitle'),
        description: t('metaDescription'),
        alternates: {
            canonical: url,
            ...(languages ? { languages } : {}),
            ...(page > 1 ? { prev: buildComidasUrl({ ...sp, page: String(page - 1) }, locale) } : {}),
            ...(page < totalPages ? { next: buildComidasUrl({ ...sp, page: String(page + 1) }, locale) } : {}),
        },
        ...(hasFacets || invalidPage ? { robots: { index: false, follow: true } } : {}),
        openGraph: baseOG(url),
        twitter: baseTwitter(),
    }
}

export async function ComidasListagem({ searchParams, locale = DEFAULT_LOCALE }: { searchParams: SearchParams; locale?: Locale }) {
    const [sp, t, tCat] = await Promise.all([
        searchParams,
        getTranslations({ locale, namespace: 'entity.foodsList' }),
        getTranslations({ locale, namespace: 'entity.food.categories' }),
    ])
    const emPt = locale === DEFAULT_LOCALE
    const rotuloCategoria = (c: string) => tCat(c as 'rice')
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

    // Guias e vitrine do tema só na primeira página sem filtro: com filtro ou busca, a lista de pratos é o assunto.
    const semFiltro = page === 1 && !(sp.search || sp.category || sp.vegetarian || sp.occasion || sp.season || sp.maxSpicy || sp.region)
    const cfgLoja = CATEGORIAS_COM_LOJA['comida']
    const [{ items: foodsBrutos, total, totalPages }, temVitrine, artigos, lojaDoTema, todosPratos] = await Promise.all([
        getFoods({
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
            locale: emPt ? undefined : locale,
        }),
        // Loja, marcas e receitas com preço em reais e link de afiliado são só em português (manifesto de rotas).
        buildVitrineMatcher(),
        semFiltro ? artigosDoTema('comida', locale) : Promise.resolve(null),
        emPt && semFiltro && cfgLoja ? carregarLojaDoTema(cfgLoja, 'comidas:lista') : Promise.resolve(undefined),
        // As receitas saem do acervo todo: as 48 mais novas da página podem não incluir nenhuma com modo de preparo.
        semFiltro ? getFoods({ perPage: 100, locale: emPt ? undefined : locale }).catch(() => null) : Promise.resolve(null),
    ])
    // Outro idioma: só prato com ficha traduzida, já com o texto do idioma.
    const foods = emPt ? foodsBrutos : foodsBrutos.filter(f => hasLocale(f, locale)).map(f => localizeEntity(f, locale, 'food'))
    const pratosDasReceitas = todosPratos
        ? (emPt ? todosPratos.items : todosPratos.items.filter(f => hasLocale(f, locale)).map(f => localizeEntity(f, locale, 'food')))
        : []
    const receitas = receitasEmDestaque(pratosDasReceitas, 4, locale)
    if (page > Math.max(1, totalPages)) notFound()

    return (
        <>
            <PageBreadcrumb items={[{ name: t('breadcrumb'), path: href('foods', undefined, locale) }]} />
        <div>
            {/* Header */}
            <div className="border-b border-border/40">
                <div className="page-wrap py-6 sm:py-10">
                    <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em] mb-1">{t('kicker')}</p>
                    <h1 className="text-[28px] sm:text-[40px] font-black tracking-[-0.03em] leading-tight">
                        {t('h1')}
                    </h1>
                    <p className="text-[14px] leading-relaxed text-foreground/70 mt-3 max-w-2xl">
                        {t('intro')}
                    </p>
                </div>
            </div>

            {/* Filtros por categoria */}
            <div className="border-b border-border/40 bg-surface/30">
                <div className="page-wrap py-3 flex flex-wrap gap-2">
                    <Link
                        href={buildComidasPath({ ...sp, category: undefined })}
                        scroll={false}
                        className={`inline-flex min-h-10 items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11px] font-semibold transition-colors border ${
                            !category
                                ? 'bg-accent-a11y text-white border-accent-a11y'
                                : 'border-border text-muted hover:text-foreground hover:border-border-strong'
                        }`}
                    >
                        {t('all')}
                    </Link>
                    {VALID_CATEGORIES.map(cat => (
                        <Link
                            key={cat}
                            href={buildComidasPath({ ...sp, category: cat, page: undefined })}
                            scroll={false}
                            className={`inline-flex min-h-10 items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11px] font-semibold transition-colors border ${
                                category === cat
                                    ? 'bg-accent-a11y text-white border-accent-a11y'
                                    : 'border-border text-muted hover:text-foreground hover:border-border-strong'
                            }`}
                        >
                            <span>{FOOD_CATEGORY_EMOJI[cat]}</span>
                            {rotuloCategoria(cat)}
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
                                key={col.id}
                                href={buildComidasPath(col.params)}
                                scroll={false}
                                className={`inline-flex min-h-10 items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11px] font-semibold transition-colors border ${
                                    isActive
                                        ? 'bg-accent-a11y text-white border-accent-a11y'
                                        : 'border-border text-muted hover:text-foreground hover:border-border-strong'
                                }`}
                            >
                                <span>{col.emoji}</span>
                                {t(`curated.${col.id}`)}
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* Guias e artigos do tema: quem chega pelo catálogo encontra também a leitura e a loja. */}
            {artigos && artigos.posts.length >= 3 && (
                <section data-bloco="comidas-artigos" className="border-b border-border/40">
                    <div className="page-wrap py-8">
                        <div className="mb-4 flex items-baseline gap-3">
                            <h2 className="font-serif text-[24px] font-semibold leading-tight sm:text-[28px]">{t('articlesTitle')}</h2>
                            <Link href="/blog?category=comida" className="ml-auto shrink-0 font-mono text-[11px] text-muted transition-colors hover:text-accent">{t('articlesAll')}</Link>
                        </div>
                        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {artigos.posts.map(p => <BlogGuiaCard key={p.id} post={p} categoryMap={artigos.categoryMap} locale={locale} />)}
                        </div>
                    </div>
                </section>
            )}

            {lojaDoTema && lojaDoTema.marcas.length >= 4 && (
                <div className="page-wrap border-b border-border/40 pb-6">
                    <BlogMarcasFaixa marcas={lojaDoTema.marcas} rotulo={lojaDoTema.rotulo} todasHref={`/empresas?industry=${lojaDoTema.industria}`} />
                </div>
            )}

            {/* Mapa por região */}
            {page === 1 && (
                <div className="page-wrap py-8">
                    <KoreaRegionMap activeRegion={region} locale={locale} />
                </div>
            )}

            {/* Grid */}
            <div className="page-wrap py-8">
                {foods.length === 0 ? (
                    <div className="flex flex-col items-center py-20 text-center">
                        <p className="text-[48px] mb-4">🍜</p>
                        <p className="text-[16px] font-bold mb-1">{t('emptyTitle')}</p>
                        <p className="text-[13px] text-muted mb-4">{t('emptyText')}</p>
                        <Link href="/comidas" className="text-[13px] font-semibold text-accent hover:underline">
                            {t('emptyBack')}
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="font-mono text-[11px] text-muted mb-6">
                            {t('count', { count: total })}
                            {category ? t('countIn', { category: rotuloCategoria(category) }) : ''}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {foods.map(food => {
                                const name = stripHtml(food.title.rendered)
                                const acf = food.acf ?? {}
                                const img = food.featured_image_url
                                const catLabel = acf.category ? rotuloCategoria(acf.category) : null
                                const catEmoji = acf.category ? FOOD_CATEGORY_EMOJI[acf.category] : '🍽️'
                                const spicy = acf.spicy_level ?? 0
                                const naLoja = emPt && temVitrine([name, ...(acf.main_ingredients ?? [])])

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
                                                    <span className="font-mono text-[10px] text-white font-bold">
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
                                            {naLoja && (
                                                <p className="font-mono text-[10px] font-semibold text-accent mt-1">{t('inStore')}</p>
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
                                        {t('prev')}
                                    </Link>
                                )}
                                <span className="font-mono text-[11px] text-muted ml-auto">
                                    {t('pageOf', { page, total: totalPages })}
                                </span>
                                {page < totalPages && (
                                    <Link href={buildComidasPath({ ...sp, page: String(page + 1) })}
                                        className="font-mono text-[12px] font-semibold text-accent hover:underline">
                                        {t('next')}
                                    </Link>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {receitas.length > 0 && (
                <section data-bloco="comidas-receitas" className="border-b border-border/40">
                    <div className="page-wrap py-8">
                        <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">{t('recipesKicker')}</p>
                        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {receitas.map(r => (
                                <li key={r.slug}>
                                    <Link href={`/comidas/${r.slug}`} className="group flex items-center gap-3 border border-border bg-background p-2.5 transition-colors hover:border-foreground">
                                        <span className="relative h-14 w-14 shrink-0 overflow-hidden bg-surface">
                                            <Image src={r.imagem} alt="" fill sizes="56px" className="object-cover" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-[14px] font-bold leading-tight text-foreground [overflow-wrap:anywhere] group-hover:text-accent">{r.nome}</span>
                                            {r.tempo && <span className="mt-1 block font-mono text-[10px] text-muted">{r.tempo}</span>}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            {lojaDoTema && lojaDoTema.produtos.length >= 4 && (
                <ShopRelatedSection
                    title="Na loja: Comida"
                    products={lojaDoTema.produtos}
                    href={`/loja?categoria=${lojaDoTema.categoriaLoja}`}
                    verTudoLabel="Ver todos de Comida"
                    contexto="comidas:lista"
                    bloco="comidas-vitrine"
                />
            )}
        </div>
        </>
    )
}

/** Artigos mais recentes da categoria do blog; falha do WordPress não derruba o catálogo. */
async function artigosDoTema(categoria: string, locale: Locale) {
    try {
        const emPt = locale === DEFAULT_LOCALE
        const [{ items }, categorias, rotulos] = await Promise.all([
            getPosts({ category: categoria, perPage: 4, includeContent: false, lang: emPt ? undefined : locale }),
            getCategories(),
            getTranslations({ locale, namespace: 'home.categorias' }) as unknown as Promise<{ (chave: string): string; has(chave: string): boolean }>,
        ])
        // Categorias vêm do WordPress em português; fora dele o rótulo traduzido, quando existe.
        const nome = (c: { name: string; slug: string }) => (!emPt && rotulos.has(c.slug) ? rotulos(c.slug) : c.name)
        return { posts: items, categoryMap: Object.fromEntries(categorias.map(c => [c.id, { name: nome(c), slug: c.slug }])) }
    } catch {
        return null
    }
}
