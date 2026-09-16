import { intlLocale } from '@/lib/i18n/format'
import type { Metadata } from 'next'
import { ShoppingBag, Sparkles, ExternalLink } from 'lucide-react'
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

    return (
        <main className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="border-b border-border bg-surface px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-5xl">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Vitrine</p>
                    <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                        Loja K-Pop
                    </h1>
                    <p className="mt-2 text-sm text-muted">
                        Álbuns · Lightsticks · Photocards · K-Beauty · Moda
                    </p>
                    {/* Aviso afiliado */}
                    <div className="mt-4 flex items-start gap-2 rounded-md border border-border bg-background p-3 text-[12px] text-muted">
                        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                        <span>
                            Os links desta página são de afiliados. Você paga o mesmo preço — a comissão ajuda a manter o {SITE_NAME} no ar. Obrigado pelo apoio!
                        </span>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-8">
                {/* Filtros */}
                <form className="flex flex-wrap gap-2 items-end">
                    <label className="flex flex-col gap-1">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Categoria</span>
                        <select name="categoria" defaultValue={sp.categoria ?? ''}
                            className="h-8 rounded-md border border-border bg-background px-2.5 text-[12px] font-bold text-foreground focus:border-foreground focus:outline-hidden">
                            <option value="">Todas</option>
                            {Object.entries(categoryCount)
                                .sort((a, b) => (CATEGORY_LABELS[a[0]] ?? a[0]).localeCompare(CATEGORY_LABELS[b[0]] ?? b[0], intlLocale()))
                                .map(([cat, count]) => (
                                    <option key={cat} value={cat}>{formatCategory(cat)} ({count})</option>
                                ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Loja</span>
                        <select name="loja" defaultValue={sp.loja ?? ''}
                            className="h-8 rounded-md border border-border bg-background px-2.5 text-[12px] font-bold text-foreground focus:border-foreground focus:outline-hidden">
                            <option value="">Todas</option>
                            {Object.entries(storeCount)
                                .sort((a, b) => (STORE_LABELS[a[0]] ?? a[0]).localeCompare(STORE_LABELS[b[0]] ?? b[0], intlLocale()))
                                .map(([s, count]) => (
                                    <option key={s} value={s}>{STORE_LABELS[s] ?? s} ({count})</option>
                                ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1 min-w-[180px]">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Busca</span>
                        <input name="busca" type="text" defaultValue={sp.busca ?? ''} placeholder="Buscar produto…"
                            className="h-8 rounded-md border border-border bg-background px-2.5 text-[12px] text-foreground placeholder:text-muted focus:border-foreground focus:outline-hidden" />
                    </label>
                    <button type="submit"
                        className="h-8 rounded-md bg-foreground px-3 text-[12px] font-bold text-background hover:opacity-85 transition-opacity">
                        Aplicar
                    </button>
                    {hasActive && (
                        <a href="/loja" className="h-8 rounded-md border border-border px-3 text-[12px] font-semibold text-muted hover:border-accent/50 hover:text-accent transition-colors flex items-center">
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
                                <div className="mb-4 flex items-center gap-2 border-b border-border pb-2">
                                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                                    <h2 className="text-[13px] font-black uppercase tracking-[0.08em]">Escolhas da curadoria</h2>
                                </div>
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
                                    <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
                                        <h2 className="text-[13px] font-black uppercase tracking-[0.08em]">
                                            {formatCategory(cat)}
                                        </h2>
                                        <span className="text-[11px] text-muted">{items.length} produto{items.length !== 1 ? 's' : ''}</span>
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
