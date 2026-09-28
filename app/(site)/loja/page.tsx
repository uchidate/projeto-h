import { intlLocale } from '@/lib/i18n/format'
import type { Metadata } from 'next'
import { ExternalLink, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import { getStoreProducts, STORE_LABELS, CATEGORY_LABELS, formatCategory } from '@/lib/wordpress/store'
import { StoreCard } from '@/components/ui/StoreCard'
import { SITE_URL, SITE_NAME, baseOG, baseTwitter } from '@/lib/constants/site'

export const revalidate = 300

export const metadata: Metadata = {
    title: 'Loja K-Pop',
    description: `Produtos K-Pop, K-Beauty e K-Drama selecionados pela curadoria ${SITE_NAME}: álbuns, lightsticks, photocards, skincare coreana e muito mais.`,
    alternates: { canonical: `${SITE_URL}/loja` },
    openGraph: {
        ...baseOG(`${SITE_URL}/loja`),
        title: `Loja K-Pop — ${SITE_NAME}`,
        description: 'Curadoria de produtos K-Pop, K-Beauty e K-Drama. Comprar pelo nosso link apoia o site sem custo extra.',
    },
    twitter: { ...baseTwitter() },
}

type SearchParams = Promise<{ categoria?: string; loja?: string; busca?: string }>

export default async function LojaPage({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams
    const allProducts = await getStoreProducts()

    // Filtrar ocultos
    const products = allProducts.filter(p => !p.acf.is_hidden)

    // Filtros do cliente
    let filtered = products
    if (sp.categoria) filtered = filtered.filter(p => p.acf.category === sp.categoria)
    if (sp.loja) filtered = filtered.filter(p => p.acf.store === sp.loja)
    if (sp.busca) {
        const q = sp.busca.toLowerCase()
        filtered = filtered.filter(p =>
            p.title.rendered.toLowerCase().includes(q)
        )
    }

    // Destaques (sempre do total, não filtrado)
    const featured = products.filter(p => p.acf.featured).slice(0, 5)

    // Agrupar por categoria para exibição
    const byCategory = filtered.reduce<Record<string, typeof filtered>>((acc, p) => {
        const cat = p.acf.category ?? 'outros'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(p)
        return acc
    }, {})

    // Contagens para filtros
    const categoryCount = products.reduce<Record<string, number>>((acc, p) => {
        const cat = p.acf.category ?? 'outros'
        acc[cat] = (acc[cat] ?? 0) + 1
        return acc
    }, {})
    const storeCount = products.reduce<Record<string, number>>((acc, p) => {
        const s = p.acf.store ?? 'outro'
        acc[s] = (acc[s] ?? 0) + 1
        return acc
    }, {})

    const hasActive = sp.categoria || sp.loja || sp.busca

    const setParam = (key: 'categoria' | 'loja', value: string) => {
        const ps = new URLSearchParams()
        if (key !== 'categoria' && sp.categoria) ps.set('categoria', sp.categoria)
        if (key !== 'loja' && sp.loja) ps.set('loja', sp.loja)
        if (sp.busca) ps.set('busca', sp.busca)
        if (value) ps.set(key, value)
        const qs = ps.toString()
        return qs ? `/loja?${qs}` : '/loja'
    }

    return (
        <main className="min-h-screen bg-background pb-20">
            {/* Header — mesmo padrão de /artists */}
            <section className="page-wrap pb-2 pt-6 sm:pt-7">
                <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:gap-7">
                    <h1 className="font-[family-name:var(--font-playfair)] whitespace-nowrap text-[34px] font-bold leading-none sm:text-[44px]">
                        Loja<span className="text-accent">.</span>
                        <span className="ml-3.5 font-sans text-[13px] font-semibold text-muted sm:text-[14px]">{products.length} produtos</span>
                    </h1>
                    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:ml-auto lg:overflow-visible lg:px-0" role="group">
                        <a href={setParam('categoria', '')}
                            className={`shrink-0 px-4 py-2 text-[13px] font-semibold transition-colors ${!sp.categoria ? 'border border-accent text-accent' : 'border border-border-strong text-foreground-subtle hover:border-accent/50 hover:text-accent'}`}>
                            Todos
                        </a>
                        {Object.entries(categoryCount)
                            .sort((a, b) => (CATEGORY_LABELS[a[0]] ?? a[0]).localeCompare(CATEGORY_LABELS[b[0]] ?? b[0], intlLocale()))
                            .map(([cat, count]) => (
                                <a key={cat} href={setParam('categoria', cat)}
                                    className={`shrink-0 whitespace-nowrap px-4 py-2 text-[13px] font-semibold transition-colors ${sp.categoria === cat ? 'border border-accent text-accent' : 'border border-border-strong text-foreground-subtle hover:border-accent/50 hover:text-accent'}`}>
                                    {formatCategory(cat)} ({count})
                                </a>
                            ))}
                    </div>
                </div>
                <p className="mt-3 flex items-start gap-2 text-[12px] text-muted">
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    Os links desta página são de afiliados. Você paga o mesmo preço — a comissão ajuda a manter o {SITE_NAME} no ar.
                </p>

                {/* Mosaico — mesmas imagens da vitrine, sem espaço vazio no hero */}
                {featured.length > 0 && (
                    <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                        {featured.slice(0, 8).map(p => (
                            <div key={p.id} className="relative aspect-square overflow-hidden bg-surface">
                                {p.acf.image_url && (
                                    <Image src={p.acf.image_url} alt="" fill className="object-cover" unoptimized />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className="page-wrap py-6 space-y-8">
                {/* Filtros secundários */}
                <form className="flex flex-wrap gap-2 items-end">
                    <label className="flex flex-col gap-1">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Loja</span>
                        <select name="loja" defaultValue={sp.loja ?? ''}
                            className="h-8 border border-border bg-surface px-2.5 text-[12px] font-bold text-foreground focus:border-foreground focus:outline-hidden">
                            <option value="">Todas</option>
                            {Object.entries(storeCount)
                                .sort((a, b) => (STORE_LABELS[a[0]] ?? a[0]).localeCompare(STORE_LABELS[b[0]] ?? b[0], intlLocale()))
                                .map(([s, count]) => (
                                    <option key={s} value={s}>{STORE_LABELS[s] ?? s} ({count})</option>
                                ))}
                        </select>
                    </label>
                    {sp.categoria && <input type="hidden" name="categoria" value={sp.categoria} />}
                    <label className="flex flex-col gap-1 min-w-[220px]">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Busca</span>
                        <input name="busca" type="text" defaultValue={sp.busca ?? ''} placeholder="Buscar produto…"
                            className="h-8 border border-border bg-surface px-2.5 text-[12px] text-foreground placeholder:text-muted focus:border-foreground focus:outline-hidden" />
                    </label>
                    <button type="submit"
                        className="h-8 bg-foreground px-3 text-[12px] font-bold text-background hover:opacity-85 transition-opacity">
                        Aplicar
                    </button>
                    {hasActive && (
                        <a href="/loja" className="h-8 border border-border px-3 text-[12px] font-semibold text-muted hover:border-accent/50 hover:text-accent transition-colors flex items-center">
                            Limpar
                        </a>
                    )}
                </form>

                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
                        <ShoppingBag className="h-12 w-12 opacity-20" />
                        <p className="text-sm">Em breve: produtos selecionados chegando.</p>
                    </div>
                ) : (
                    <>
                        {/* Destaques — só quando não há filtro ativo */}
                        {!hasActive && featured.length > 0 && (
                            <section>
                                <h2 className="font-[family-name:var(--font-playfair)] mb-4 text-[22px] font-semibold">
                                    Escolhas da curadoria
                                </h2>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                    {featured.map(p => <StoreCard key={p.id} product={p} />)}
                                </div>
                            </section>
                        )}

                        {/* Resultado filtrado sem agrupamento */}
                        {hasActive ? (
                            filtered.length === 0 ? (
                                <p className="py-16 text-center text-sm text-muted">Nenhum produto encontrado.</p>
                            ) : (
                                <section>
                                    <p className="mb-4 text-[12px] text-muted">{filtered.length} produto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                        {filtered.map(p => <StoreCard key={p.id} product={p} />)}
                                    </div>
                                </section>
                            )
                        ) : (
                            /* Agrupado por categoria */
                            Object.entries(byCategory).map(([cat, items]) => (
                                <section key={cat} id={`categoria-${cat}`}>
                                    <div className="mb-4 flex items-baseline justify-between">
                                        <h2 className="font-[family-name:var(--font-playfair)] text-[22px] font-semibold">
                                            {formatCategory(cat)}
                                        </h2>
                                        <span className="text-[12px] font-semibold text-muted">{items.length} produto{items.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                        {items.map(p => <StoreCard key={p.id} product={p} />)}
                                    </div>
                                </section>
                            ))
                        )}
                    </>
                )}
            </div>
        </main>
    )
}
