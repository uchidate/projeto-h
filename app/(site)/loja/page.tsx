import { intlLocale } from '@/lib/i18n/format'
import type { Metadata } from 'next'
import { ExternalLink, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import { getStoreProducts, STORE_LABELS, CATEGORY_LABELS, formatCategory, calcularDesconto, ordenarPrateleira } from '@/lib/wordpress/store'
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

type SearchParams = Promise<{ categoria?: string; loja?: string; busca?: string; ofertas?: string }>

export default async function LojaPage({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams
    const allProducts = await getStoreProducts()

    // Filtrar ocultos
    const products = allProducts.filter(p => !p.acf.is_hidden)

    // Desconto real por produto (mesma conta do StoreCard) — usado no filtro e na ordenação de Ofertas
    const descontos = new Map(products.map(p => [p.id, calcularDesconto(p.acf.price, p.acf.original_price)]))
    const totalOfertas = products.filter(p => (descontos.get(p.id) ?? null) !== null).length

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
    if (sp.ofertas === '1') {
        filtered = filtered
            .filter(p => (descontos.get(p.id) ?? null) !== null)
            .sort((a, b) => (descontos.get(b.id) ?? 0) - (descontos.get(a.id) ?? 0))
    } else {
        filtered = ordenarPrateleira(filtered)
    }

    // Destaques (sempre do total, não filtrado)
    const featured = products.filter(p => p.acf.featured).slice(0, 5)

    // Agrupar por categoria para exibição — destaque e desconto primeiro dentro de cada uma
    const byCategory = filtered.reduce<Record<string, typeof filtered>>((acc, p) => {
        const cat = p.acf.category ?? 'outros'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(p)
        return acc
    }, {})
    for (const cat of Object.keys(byCategory)) byCategory[cat] = ordenarPrateleira(byCategory[cat])

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

    const hasActive = sp.categoria || sp.loja || sp.busca || sp.ofertas === '1'

    const setParam = (key: 'categoria' | 'loja' | 'ofertas', value: string) => {
        const ps = new URLSearchParams()
        if (key !== 'categoria' && sp.categoria) ps.set('categoria', sp.categoria)
        if (key !== 'loja' && sp.loja) ps.set('loja', sp.loja)
        if (key !== 'ofertas' && sp.ofertas === '1') ps.set('ofertas', '1')
        if (sp.busca) ps.set('busca', sp.busca)
        if (value) ps.set(key, value)
        const qs = ps.toString()
        return qs ? `/loja?${qs}` : '/loja'
    }

    return (
        <main className="min-h-screen bg-background pb-20">
            {/* Header — mesmo padrão de /artists */}
            <section className="page-wrap pb-2 pt-6 sm:pt-7">
                <h1 className="font-[family-name:var(--font-playfair)] whitespace-nowrap text-[34px] font-bold leading-none sm:text-[44px]">
                    Loja<span className="text-accent">.</span>
                    <span className="ml-3.5 font-sans text-[13px] font-semibold text-muted sm:text-[14px]">{products.length} produtos</span>
                </h1>
                <div className="sticky top-0 z-20 -mx-4 mt-3.5 border-y border-border bg-background px-4 py-2.5">
                    <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group">
                        <a href={setParam('categoria', '')}
                            className={`shrink-0 px-4 py-2 text-[13px] font-semibold transition-colors ${!sp.categoria ? 'border border-accent text-accent' : 'border border-border-strong text-foreground-subtle hover:border-accent/50 hover:text-accent'}`}>
                            Todos
                        </a>
                        {totalOfertas > 0 && (
                            <a href={setParam('ofertas', sp.ofertas === '1' ? '' : '1')}
                                className={`shrink-0 whitespace-nowrap px-4 py-2 text-[13px] font-black transition-colors ${sp.ofertas === '1' ? 'border border-red-500 bg-red-500 text-white' : 'border border-red-500/50 text-red-500 hover:bg-red-500/10'}`}>
                                🔥 Ofertas ({totalOfertas})
                            </a>
                        )}
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

                {/* Mosaico — mesmas imagens da vitrine, com desconto/preço no hover em vez de decoração pura */}
                {featured.length > 0 && (
                    <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                        {featured.slice(0, 8).map(p => {
                            const descontoMosaico = calcularDesconto(p.acf.price, p.acf.original_price)
                            return (
                                <a key={p.id} href={p.acf.affiliate_url ?? '#'} target="_blank" rel="noopener noreferrer sponsored"
                                    className="group relative aspect-square overflow-hidden bg-surface">
                                    {p.acf.image_url && (
                                        <Image src={p.acf.image_url} alt="" fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
                                    )}
                                    {descontoMosaico !== null && (
                                        <span className="absolute left-1 top-1 bg-foreground px-1 py-0.5 font-mono text-[9px] font-black tabular-nums text-background">
                                            -{descontoMosaico}%
                                        </span>
                                    )}
                                    {p.acf.price && (
                                        <span className="absolute inset-x-0 bottom-0 translate-y-full bg-foreground/90 px-1 py-1 text-center font-mono text-[10px] font-black text-background transition-transform duration-200 group-hover:translate-y-0">
                                            {p.acf.price}
                                        </span>
                                    )}
                                </a>
                            )
                        })}
                    </div>
                )}
            </section>

            <div className="page-wrap py-6 space-y-8">
                {/* Filtros secundários */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
                    <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Loja</span>
                        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group">
                            <a href={setParam('loja', '')}
                                className={`shrink-0 px-3 py-1.5 text-[12px] font-bold transition-colors ${!sp.loja ? 'border border-accent text-accent' : 'border border-border-strong text-foreground-subtle hover:border-accent/50 hover:text-accent'}`}>
                                Todas
                            </a>
                            {Object.entries(storeCount)
                                .sort((a, b) => (STORE_LABELS[a[0]] ?? a[0]).localeCompare(STORE_LABELS[b[0]] ?? b[0], intlLocale()))
                                .map(([s, count]) => (
                                    <a key={s} href={setParam('loja', s)}
                                        className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-[12px] font-bold transition-colors ${sp.loja === s ? 'border border-accent text-accent' : 'border border-border-strong text-foreground-subtle hover:border-accent/50 hover:text-accent'}`}>
                                        {STORE_LABELS[s] ?? s} ({count})
                                    </a>
                                ))}
                        </div>
                    </div>
                    <form className="flex flex-wrap items-end gap-2 lg:shrink-0">
                        {sp.categoria && <input type="hidden" name="categoria" value={sp.categoria} />}
                        {sp.loja && <input type="hidden" name="loja" value={sp.loja} />}
                        {sp.ofertas === '1' && <input type="hidden" name="ofertas" value="1" />}
                        <label className="flex min-w-[220px] flex-col gap-1 lg:min-w-70">
                            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Busca</span>
                            <input name="busca" type="text" defaultValue={sp.busca ?? ''} placeholder="Buscar produto…"
                                className="h-8 border border-border bg-surface px-2.5 text-[12px] text-foreground placeholder:text-muted focus:border-foreground focus:outline-hidden" />
                        </label>
                        <button type="submit"
                            className="h-8 bg-foreground px-3 text-[12px] font-bold text-background hover:opacity-85 transition-opacity">
                            Aplicar
                        </button>
                        {hasActive && (
                            <a href="/loja" className="flex h-8 items-center border border-border px-3 text-[12px] font-semibold text-muted transition-colors hover:border-accent/50 hover:text-accent">
                                Limpar
                            </a>
                        )}
                    </form>
                </div>

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
