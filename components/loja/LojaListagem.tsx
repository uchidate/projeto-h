import { intlLocale } from '@/lib/i18n/format'
import type { Metadata } from 'next'
import { ExternalLink, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import { getGroupsByIds } from '@/lib/wordpress/groups'
import { stripHtml } from '@/lib/utils'
import Link from '@/components/i18n/LocalizedLink'
import { getStoreProducts, STORE_LABELS, CATEGORY_LABELS, formatCategory, calcularDesconto, quedaDePreco } from '@/lib/wordpress/store'
import { ordenarPrateleira, ordenarCategorias } from '@/lib/wordpress/store-ranking'
import { StoreCard } from '@/components/ui/StoreCard'
import { getProductLinksMap } from '@/lib/wordpress/productLinks'
import { LojaClique } from '@/components/ui/LojaClique'
import { VitrineVista } from '@/components/ui/VitrineVista'
import { SITE_URL, SITE_NAME, baseOG, baseTwitter } from '@/lib/constants/site'
import { PageBreadcrumb } from '@/components/seo/PageBreadcrumb'

/** Por categoria na /loja sem filtro: os mais clicados primeiro; o resto fica em "Ver todos" (a página chegava a ~31 mil px no celular). */
const ITENS_POR_CATEGORIA = 12
/** No celular (2 colunas) a categoria abre com 6; os outros 6 só aparecem a partir de `sm`. */
const ITENS_POR_CATEGORIA_CELULAR = 6
/** Grupos na faixa "Por grupo": só quem tem pelo menos este tanto de produto, para a página de destino não ficar rala. */
const MINIMO_POR_GRUPO = 3

const precoNumero = (s: string | null) => (s ? Number(s.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) : NaN)

export const metadataLoja: Metadata = {
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

export type SearchParams = Promise<{ categoria?: string; loja?: string; busca?: string; ofertas?: string; queda?: string; ordem?: string }>

export async function LojaListagem({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams
    const [allProducts, productLinks] = await Promise.all([getStoreProducts(), getProductLinksMap()])

    // Filtrar ocultos
    const products = allProducts.filter(p => !p.acf.is_hidden)

    // Desconto real por produto (mesma conta do StoreCard) — usado no filtro e na ordenação de Ofertas
    const descontos = new Map(products.map(p => [p.id, calcularDesconto(p.acf.price, p.acf.original_price)]))
    const totalOfertas = products.filter(p => (descontos.get(p.id) ?? null) !== null).length

    // Queda real de preço (histórico diário): produto cujo preço atual está abaixo do maior dos últimos 30 dias
    const quedas = new Map(products.map(p => [p.id, quedaDePreco(p.acf.price, p.acf.price_history)]))
    const totalQuedas = products.filter(p => quedas.get(p.id) !== null).length

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
    if (sp.queda === '1') {
        filtered = filtered
            .filter(p => quedas.get(p.id) != null)
            .sort((a, b) => (quedas.get(b.id)?.percentual ?? 0) - (quedas.get(a.id)?.percentual ?? 0))
    } else if (sp.ofertas === '1') {
        filtered = filtered
            .filter(p => (descontos.get(p.id) ?? null) !== null)
            .sort((a, b) => (descontos.get(b.id) ?? 0) - (descontos.get(a.id) ?? 0))
    } else {
        filtered = ordenarPrateleira(filtered, 'loja:filtro')
    }
    // Ordem por preço é escolha explícita de quem compra: vence a ordem do filtro. Sem preço legível vai para o fim.
    if (sp.ordem === 'menor' || sp.ordem === 'maior') {
        const sinal = sp.ordem === 'menor' ? 1 : -1
        const valor = (p: (typeof filtered)[number]) => { const n = precoNumero(p.acf.price); return Number.isFinite(n) ? n * sinal : Infinity }
        filtered = [...filtered].sort((a, b) => valor(a) - valor(b))
    }

    // Faixa "Por grupo": leva às vitrines /loja/grupo/{slug}, que já existiam sem nenhuma entrada a partir da loja.
    const porGrupo = new Map<number, number>()
    for (const p of products) if (p.acf.related_group) porGrupo.set(p.acf.related_group, (porGrupo.get(p.acf.related_group) ?? 0) + 1)
    const idsDeGrupo = [...porGrupo].filter(([, n]) => n >= MINIMO_POR_GRUPO).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([id]) => id)
    const gruposDaLoja = idsDeGrupo.length > 0
        ? (await getGroupsByIds(idsDeGrupo).catch(() => [])).sort((a, b) => (porGrupo.get(b.id) ?? 0) - (porGrupo.get(a.id) ?? 0))
        : []

    // Destaques (sempre do total, não filtrado)
    const featured = ordenarPrateleira(products.filter(p => p.acf.featured), 'loja:destaques').slice(0, 8)

    // Agrupar por categoria para exibição — destaque e desconto primeiro dentro de cada uma
    const byCategory = filtered.reduce<Record<string, typeof filtered>>((acc, p) => {
        const cat = p.acf.category ?? 'outros'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(p)
        return acc
    }, {})
    for (const cat of Object.keys(byCategory)) byCategory[cat] = ordenarPrateleira(byCategory[cat], `loja:categoria:${cat}`)

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

    const hasActive = sp.categoria || sp.loja || sp.busca || sp.ofertas === '1' || sp.queda === '1' || !!sp.ordem

    const setParam = (key: 'categoria' | 'loja' | 'ofertas' | 'queda' | 'ordem', value: string) => {
        const ps = new URLSearchParams()
        if (key !== 'categoria' && sp.categoria) ps.set('categoria', sp.categoria)
        if (key !== 'loja' && sp.loja) ps.set('loja', sp.loja)
        if (key !== 'ofertas' && sp.ofertas === '1') ps.set('ofertas', '1')
        if (key !== 'queda' && sp.queda === '1') ps.set('queda', '1')
        if (sp.busca) ps.set('busca', sp.busca)
        if (key !== 'ordem' && sp.ordem) ps.set('ordem', sp.ordem)
        if (value) ps.set(key, value)
        const qs = ps.toString()
        return qs ? `/loja?${qs}` : '/loja'
    }

    return (
        <>
            <PageBreadcrumb items={[{ name: 'Loja', path: '/loja' }]} />
        <main className="min-h-dvh bg-background pb-20">
            {/* Header — mesmo padrão de /artists */}
            <section className="page-wrap pb-2 pt-6 sm:pt-7">
                <h1 className="font-[family-name:var(--font-playfair)] whitespace-nowrap text-[34px] font-bold leading-none sm:text-[44px]">
                    Loja<span className="text-accent">.</span>
                    <span className="ml-3.5 font-sans text-[13px] font-semibold text-muted sm:text-[14px]">{products.length} produtos</span>
                </h1>
                <p className="mt-1 text-[11px] text-foreground-subtle">Links de afiliado — podemos ganhar comissão sem custo extra pra você.</p>
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
                        {totalQuedas > 0 && (
                            <a href={setParam('queda', sp.queda === '1' ? '' : '1')}
                                className={`shrink-0 whitespace-nowrap px-4 py-2 text-[13px] font-black transition-colors ${sp.queda === '1' ? 'border border-accent bg-accent text-white' : 'border border-accent/60 text-accent hover:bg-accent/10'}`}>
                                📉 Baixou de preço ({totalQuedas})
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
                <p className="mt-3 hidden items-start gap-2 text-[12px] text-muted sm:flex">
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    Os links desta página são de afiliados. Você paga o mesmo preço — a comissão ajuda a manter o {SITE_NAME} no ar.
                </p>

                {/* Mosaico — mesmas imagens da vitrine, com desconto/preço no hover em vez de decoração pura.
                    No celular fica escondido: repete os produtos de "Escolhas da curadoria" logo abaixo e empurra o 1º card para ~650px. */}
                {featured.length > 0 && (
                    <div className="mt-5 hidden grid-cols-6 gap-2 sm:grid lg:grid-cols-8">
                        {featured.slice(0, 8).map(p => {
                            const descontoMosaico = calcularDesconto(p.acf.price, p.acf.original_price)
                            return (
                                <LojaClique key={p.id} href={p.acf.affiliate_url ?? '#'} productId={p.id} store={p.acf.store ?? 'outro'} contexto="loja:mosaico"
                                    className="group relative aspect-square overflow-hidden bg-surface">
                                    {p.acf.image_url && (
                                        <Image src={p.acf.image_url} alt="" fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
                                    )}
                                    {descontoMosaico !== null && (
                                        <span className="absolute left-1 top-1 bg-foreground px-1 py-0.5 font-mono text-[10px] font-black tabular-nums text-background">
                                            -{descontoMosaico}%
                                        </span>
                                    )}
                                    {p.acf.price && (
                                        <span className="absolute inset-x-0 bottom-0 translate-y-full bg-foreground/90 px-1 py-1 text-center font-mono text-[10px] font-black text-background transition-transform duration-200 group-hover:translate-y-0">
                                            {p.acf.price}
                                        </span>
                                    )}
                                </LojaClique>
                            )
                        })}
                    </div>
                )}
            </section>

            <div className="page-wrap py-6 space-y-8">
                {/* Filtros secundários */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
                    <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Loja</span>
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
                    <form className="order-first flex items-end gap-2 lg:order-none lg:shrink-0">
                        {sp.categoria && <input type="hidden" name="categoria" value={sp.categoria} />}
                        {sp.loja && <input type="hidden" name="loja" value={sp.loja} />}
                        {sp.ofertas === '1' && <input type="hidden" name="ofertas" value="1" />}
                        {sp.queda === '1' && <input type="hidden" name="queda" value="1" />}
                        {sp.ordem && <input type="hidden" name="ordem" value={sp.ordem} />}
                        <label className="flex min-w-0 flex-1 flex-col gap-1 lg:min-w-70">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Busca</span>
                            <input name="busca" type="search" defaultValue={sp.busca ?? ''} placeholder="Buscar produto, grupo ou marca…"
                                className="h-11 sm:h-8 border border-border bg-surface px-2.5 text-[12px] text-foreground placeholder:text-muted focus:border-foreground focus:outline-hidden" />
                        </label>
                        <button type="submit"
                            className="h-11 bg-foreground px-4 text-[12px] font-bold text-background transition-opacity hover:opacity-85 sm:h-8 sm:px-3">
                            Buscar
                        </button>
                        {hasActive && (
                            <a href="/loja" className="flex h-11 items-center sm:h-8 border border-border px-3 text-[12px] font-semibold text-muted transition-colors hover:border-accent/50 hover:text-accent">
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
                        {!hasActive && gruposDaLoja.length >= 3 && (
                            <nav data-bloco="loja-por-grupo" aria-label="Produtos por grupo">
                                <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Por grupo</p>
                                <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                                    {gruposDaLoja.map(g => (
                                        <Link key={g.id} href={`/loja/grupo/${g.slug}`}
                                            className="flex h-11 shrink-0 items-center whitespace-nowrap border border-border-strong px-4 text-[13px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent sm:h-9">
                                            {stripHtml(g.title.rendered)} <span className="ml-1.5 text-[11px] font-medium text-muted">{porGrupo.get(g.id)}</span>
                                        </Link>
                                    ))}
                                </div>
                            </nav>
                        )}

                        {/* Destaques — só quando não há filtro ativo */}
                        {!hasActive && featured.length > 0 && (
                            <section>
                                <h2 className="font-[family-name:var(--font-playfair)] mb-4 text-[22px] font-semibold">
                                    Escolhas da curadoria
                                </h2>
                                <VitrineVista contexto="loja:destaques" produtoIds={featured.slice(0, 5).map(p => p.id)} className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                                    {/* 5º card só no desktop: em 2 ou 4 colunas ele sobrava sozinho na última linha. */}
                                    {featured.slice(0, 5).map((p, i) => <div key={p.id} className={`[&>*]:h-full ${i === 4 ? 'max-lg:hidden' : ''}`}><StoreCard product={p} contexto="loja:destaques" link={productLinks.get(p.id)} /></div>)}
                                </VitrineVista>
                            </section>
                        )}

                        {/* Resultado filtrado sem agrupamento */}
                        {hasActive ? (
                            filtered.length === 0 ? (
                                <p className="py-16 text-center text-sm text-muted">Nenhum produto encontrado.</p>
                            ) : (
                                <section>
                                    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                                        <p className="text-[12px] text-muted">{filtered.length} produto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
                                        <div className="flex items-center gap-2" role="group" aria-label="Ordenar por preço">
                                            {([['', 'Relevância'], ['menor', 'Menor preço'], ['maior', 'Maior preço']] as const).map(([valor, rotulo]) => (
                                                <a key={rotulo} href={setParam('ordem', valor)} aria-current={(sp.ordem ?? '') === valor ? 'true' : undefined}
                                                    className={`flex h-9 items-center whitespace-nowrap border px-3 text-[12px] font-bold transition-colors ${(sp.ordem ?? '') === valor ? 'border-accent text-accent' : 'border-border-strong text-foreground-subtle hover:border-accent/50 hover:text-accent'}`}>
                                                    {rotulo}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                    <VitrineVista contexto="loja:filtro" produtoIds={filtered.slice(0, 8).map(p => p.id)} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                        {filtered.map(p => <StoreCard key={p.id} product={p} contexto="loja:filtro" link={productLinks.get(p.id)} />)}
                                    </VitrineVista>
                                </section>
                            )
                        ) : (
                            /* Agrupado por categoria */
                            ordenarCategorias(byCategory).map(cat => [cat, byCategory[cat]] as const).map(([cat, items]) => (
                                <section key={cat} id={`categoria-${cat}`}>
                                    <div className="mb-4 flex items-baseline justify-between">
                                        <h2 className="font-[family-name:var(--font-playfair)] text-[22px] font-semibold">
                                            {formatCategory(cat)}
                                        </h2>
                                        <span className="text-[12px] font-semibold text-muted">{items.length} produto{items.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <VitrineVista contexto={`loja:categoria:${cat}`} produtoIds={items.slice(0, 8).map(p => p.id)} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                        {items.slice(0, ITENS_POR_CATEGORIA).map((p, i) => <div key={p.id} className={`[&>*]:h-full ${i >= ITENS_POR_CATEGORIA_CELULAR ? 'max-sm:hidden' : ''}`}><StoreCard product={p} contexto={`loja:categoria:${cat}`} link={productLinks.get(p.id)} /></div>)}
                                    </VitrineVista>
                                    {items.length > ITENS_POR_CATEGORIA_CELULAR && (
                                        <a href={setParam('categoria', cat)}
                                            className={`mt-4 h-11 ${items.length > ITENS_POR_CATEGORIA ? 'flex' : 'flex sm:hidden'} items-center justify-center border border-border-strong text-[13px] font-bold text-foreground transition-colors hover:border-accent hover:text-accent`}>
                                            Ver todos os {items.length} de {formatCategory(cat)} →
                                        </a>
                                    )}
                                </section>
                            ))
                        )}
                    </>
                )}
            </div>
        </main>
        </>
    )
}
