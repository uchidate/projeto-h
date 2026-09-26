import Link from 'next/link'
import { BookOpen, Sparkles, ArrowRight } from 'lucide-react'
import type { WPPost, WPTerm } from '@/lib/wordpress/types'
import type { ArchiveHub } from '@/lib/guias'
import { tituloDoBlog } from '@/lib/blog-titulo'
import { SearchInput } from '@/components/ui/SearchInput'
import { BlogPostCard } from '@/components/blog/BlogPostCard'
import { BlogCompactCard } from '@/components/blog/BlogCompactCard'
import { BlogSidebar } from '@/components/blog/BlogSidebar'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { EmptyState } from '@/components/ui/EmptyState'
import { BlogDestaque } from '@/components/blog/BlogDestaque'
import { BlogHeroCompacto } from '@/components/blog/BlogHeroCompacto'
import { BlogEmAlta } from '@/components/blog/BlogEmAlta'
import { BlogGuiaCard } from '@/components/blog/BlogGuiaCard'
import { BlogListaSidebarAd } from '@/components/blog/BlogListaSidebarAd'
import { RastreioDeFiltros } from '@/components/analytics/RastreioDeFiltros'

type Props = {
    posts: WPPost[]
    total: number
    totalPages: number
    categories: WPTerm[]
    currentPage: number
    currentCategory?: string
    currentTag?: string
    currentSearch?: string
    sidebarPosts?: WPPost[]
    guias?: ArchiveHub[]
    /** Candidatos a destaque, do melhor ao pior (o navegador escolhe entre eles). */
    destaques?: WPPost[]
    /** Conteúdo-chave: passa dos 45 dias e continua entre os mais lidos. */
    perenes?: WPPost[]
    order?: string
    /** Próximos por interesse, ao lado do destaque. */
    emAlta?: WPPost[]
}

export function BlogPage({ posts, total, totalPages, categories, currentPage, currentCategory, currentTag, currentSearch, sidebarPosts: sidebarPostsProp, guias = [], destaques = [], perenes = [], order, emAlta = [] }: Props) {
    const categoryMap = Object.fromEntries(categories.map(c => [c.id, { name: c.name, slug: c.slug }]))
    function buildHref(overrides: Record<string, string | undefined> = {}) {
        const params = new URLSearchParams()
        const next = { category: currentCategory, tag: currentTag, search: currentSearch, order, ...overrides }
        if (next.order) params.set('order', next.order)
        if (next.category) params.set('category', next.category)
        if (next.tag) params.set('tag', next.tag)
        if (next.search) params.set('search', next.search)
        const page = overrides.page
        if (page && page !== '1') params.set('page', page)
        const qs = params.toString()
        return `/blog${qs ? `?${qs}` : ''}`
    }

    const isFiltered = !!(currentCategory || currentTag || currentSearch)
    // Cinco categorias com mais artigos (mais a atual, se estiver fora delas); as demais ficam na lateral.
    const chipCategoria = (ativo: boolean) =>
        `touch-target flex h-9 shrink-0 items-center border px-3.5 text-[13px] font-bold transition-colors ${ativo ? 'border-foreground bg-foreground text-background' : 'border-border-strong text-foreground hover:border-accent/60'}`
    const maisUsadas = [...categories].filter(c => c.slug !== 'uncategorized').sort((a, b) => b.count - a.count).slice(0, 5)
    const categoriasChip = currentCategory && !maisUsadas.some(c => c.slug === currentCategory)
        ? [...maisUsadas.slice(0, 4), ...categories.filter(c => c.slug === currentCategory)]
        : maisUsadas
    // O destaque padrão é o primeiro candidato (não mais o artigo mais novo); os demais cabem na grade normalmente.
    const hero = destaques[0] ?? posts[0]
    const rest = posts.filter(p => p.id !== hero?.id)
    const currentCategoryLabel = categories.find(c => c.slug === currentCategory)?.name ?? currentCategory

    const showHero = !isFiltered && currentPage === 1 && !order && !!hero
    const gridPosts = showHero ? rest : posts
    /* Célula vazia no fim da linha é aritmética. A grade tem 1, 2 e 3 colunas,
       então só fecha toda linha com um múltiplo de 6. A página traz 12 posts e
       o hero consome um, deixando 11 — que não divide nem por 2 nem por 3, e
       era o buraco visível na primeira página.

       Por isso a página busca 13, não 12: com o hero fora, a grade recebe 12
       exatos na primeira página, e 12 + 1 nas demais. O resto vai para "Mais
       publicações", que já existia para isso e nunca renderizava — `slice(12)`
       de um array de 11 ou 12 é sempre vazio, então o ramo era morto. Numa
       lista de uma coluna o resto não deixa buraco. */
    const CICLO = 6
    const cheios = Math.floor(gridPosts.length / CICLO) * CICLO
    const primaryPosts = gridPosts.slice(0, cheios || gridPosts.length)
    const compactPosts = gridPosts.slice(primaryPosts.length)
    /* O bloco lateral repetia a grade ao lado: os 5 mais recentes, numa
       listagem também ordenada por data — na primeira página o item nº 1 era o
       próprio post do hero. `getSidebarPosts` agora busca a partir do offset da
       página, então já vem com conteúdo posterior ao que está na tela. O filtro
       aqui é a rede de segurança para quando a paginação e o offset divergirem
       (post publicado entre as duas requisições, por exemplo). */
    const visibleIds = new Set(posts.map(p => p.id))
    const sidebarPosts = (sidebarPostsProp ?? posts).filter(p => !visibleIds.has(p.id)).slice(0, 5)

    // Paginação com números: janela de 5 páginas centrada na atual
    function pageNumbers(): (number | '…')[] {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
        const pages: (number | '…')[] = [1]
        const start = Math.max(2, currentPage - 2)
        const end = Math.min(totalPages - 1, currentPage + 2)
        if (start > 2) pages.push('…')
        for (let i = start; i <= end; i++) pages.push(i)
        if (end < totalPages - 1) pages.push('…')
        pages.push(totalPages)
        return pages
    }

    return (
        <div className="bg-background">
            {/* Chaves iguais ao SearchParams de app/(site)/blog/page.tsx. */}
            <RastreioDeFiltros listagem="blog" filtros={['category', 'tag', 'page', 'search', 'order']} />
            {/* H1 só para leitor de tela e robô: o cabeçalho visual da página é o
                breadcrumb, e um título grande aqui mexeria no layout. */}
            <section className="page-wrap pb-2 pt-6 sm:pt-7" data-bloco="lista-topo">
                <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:gap-7">
                    <h1 className="whitespace-nowrap font-[family-name:var(--font-playfair)] text-[34px] font-bold leading-none sm:text-[44px]">
                        {currentCategoryLabel ?? 'Artigos'}
                        <span className="sr-only"> {tituloDoBlog({ categoria: currentCategoryLabel, tag: currentTag, busca: currentSearch })}</span>
                        <span className="text-accent">.</span>
                        <span className="ml-3.5 font-sans text-[13px] font-semibold text-muted sm:text-[14px]">{total.toLocaleString('pt-BR')}</span>
                    </h1>
                    <SearchInput placeholder="Buscar artigo por título" param="search" current={currentSearch} className="!h-12 border-border-strong bg-surface lg:!w-full lg:max-w-[520px] lg:flex-1" />
                    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:ml-auto lg:overflow-visible lg:px-0" role="group" aria-label="Categorias">
                        <Link href="/blog" className={chipCategoria(!currentCategory)}>Todas</Link>
                        {categoriasChip.map(c => (
                            <Link key={c.id} href={`/blog?category=${c.slug}`} className={chipCategoria(currentCategory === c.slug)}>{c.name}</Link>
                        ))}
                    </div>
                </div>
            </section>

            <div className="page-wrap pt-6 pb-16">

                {showHero && (
                    <div className={`grid items-start gap-6 lg:gap-8 ${emAlta.length > 0 ? 'lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]' : ''}`}>
                        {destaques.length > 1
                            ? <BlogDestaque candidatos={destaques.map((p, i) => ({
                                slug: p.slug,
                                categoria: categoryMap[p.categories?.[0]]?.slug ?? null,
                                node: <BlogHeroCompacto post={p} categoryMap={categoryMap} priority={i === 0} />,
                            }))} />
                            : <BlogHeroCompacto post={hero} categoryMap={categoryMap} priority />}
                        <BlogEmAlta posts={emAlta} />
                    </div>
                )}
                {showHero && ADSENSE.slots.leaderboard && (
                    <div className="mt-6"><AdSlotInline slot={ADSENSE.slots.leaderboard} layout="leaderboard" analyticsPlacement="blog_leaderboard" /></div>
                )}

                {/* Conteúdo-chave: guias que continuam sendo lidos meses depois; quem chega sem saber por onde começar entra por aqui. */}
                {showHero && perenes.length >= 3 && (
                    <section data-bloco="blog-comece-por-aqui" className="mt-10 border-t border-border pt-6">
                        <div className="mb-4">
                            <h2 className="font-serif text-[26px] font-semibold leading-tight sm:text-[32px]">Comece por aqui</h2>
                            <p className="mt-1 text-[14px] text-muted">Os guias que continuam sendo lidos, meses depois de publicados</p>
                        </div>
                        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {perenes.slice(0, 4).map(p => <BlogGuiaCard key={p.id} post={p} categoryMap={categoryMap} />)}
                        </div>
                    </section>
                )}

                {/* Guias saíram da navbar e reaparecem aqui, ao lado da intenção
                    que já os procurava. Só na primeira página sem filtro: numa
                    busca por artigo específico esta faixa seria ruído. */}
                {!isFiltered && !order && currentPage === 1 && guias.length > 0 && (
                    <section className="mb-10 mt-10 border-t border-border pt-5">
                        <div className="mb-3 flex items-baseline gap-3">
                            <h2 className="font-mono text-[10px] font-black uppercase tracking-[0.15em] text-foreground/60">
                                Guias
                            </h2>
                            <Link href="/guias" className="ml-auto font-mono text-[11px] text-muted transition-colors hover:text-accent">
                                todos os guias →
                            </Link>
                        </div>
                        <div data-bloco="blog-guias" className="grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-6">
                            {guias.map(hub => (
                                <Link key={hub.slug} href={`/guias/${hub.slug}`}
                                    className="group border-t border-border py-3 transition-colors hover:border-accent">
                                    <span className="text-[14px] font-bold leading-tight text-foreground transition-colors group-hover:text-accent">
                                        {hub.shortTitle}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {posts.length === 0 ? (
                    <EmptyState
                        icon={<BookOpen size={40} />}
                        title="Nenhum artigo encontrado"
                        description="Tente outra categoria ou volte para o blog."
                        actionHref="/blog"
                        actionLabel="Ver todos →"
                        bordered
                        className="py-24"
                    />
                ) : (
                    <div className="mt-10 grid items-stretch gap-10 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-14">
                        <div className="min-w-0">
                            {!isFiltered && (
                                <div className="mb-4 flex gap-6 border-b border-border" role="group" aria-label="Ordenar artigos">
                                    <Link href="/blog" className={`flex h-11 items-center border-b-2 text-[14px] font-semibold transition-colors ${!order ? 'border-accent text-accent' : 'border-transparent text-foreground-subtle hover:text-foreground'}`}>Mais recentes</Link>
                                    <Link href="/blog?order=lidos" className={`flex h-11 items-center border-b-2 text-[14px] font-semibold transition-colors ${order === 'lidos' ? 'border-accent text-accent' : 'border-transparent text-foreground-subtle hover:text-foreground'}`}>Mais lidos</Link>
                                </div>
                            )}
                            <div className="flex items-center gap-3 mb-5">
                                <Sparkles size={12} className="text-accent shrink-0" />
                                <p className="font-mono text-[10px] font-black uppercase tracking-[0.15em] text-foreground/60 shrink-0">
                                    {isFiltered ? 'Artigos encontrados' : order === 'lidos' ? 'Mais lidos' : 'Últimos artigos'}
                                </p>
                                <div className="flex-1 h-px bg-border" />
                                {isFiltered && (
                                    <Link href="/blog" className="font-mono text-[10px] text-accent hover:underline shrink-0">Limpar filtro</Link>
                                )}
                            </div>

                            {primaryPosts.length > 0 && (
                                <div data-bloco="listagem-blog" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {primaryPosts.map((p, i) => <BlogPostCard key={p.id} post={p} priority={i < 3} categoryMap={categoryMap} />)}
                                </div>
                            )}

                            {posts.length > 0 && ADSENSE.slots.inline && (
                                <div className="mt-8">
                                    <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="blog_feed" />
                                </div>
                            )}

                            {compactPosts.length > 0 && (
                                <div className="mt-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <ArrowRight size={12} className="text-muted/50 shrink-0" />
                                        <p className="font-mono text-[10px] font-black uppercase tracking-[0.15em] text-foreground/50 shrink-0">Mais publicações</p>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {compactPosts.map((p, i) => <BlogCompactCard key={p.id} post={p} rank={primaryPosts.length + i + 1} categoryMap={categoryMap} />)}
                                    </div>
                                </div>
                            )}

                            {totalPages > 1 && (
                                <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5" aria-label="Paginação">
                                    {currentPage > 1 && (
                                        <Link href={buildHref({ page: String(currentPage - 1) })} scroll
                                            className="px-3 py-1.5 border border-border text-[12px] font-semibold text-muted hover:border-foreground hover:text-foreground transition-all">
                                            ←
                                        </Link>
                                    )}
                                    {pageNumbers().map((p, i) =>
                                        p === '…'
                                            ? <span key={`ellipsis-${i}`} className="px-1 text-[12px] text-muted/40">…</span>
                                            : <Link key={p} href={buildHref({ page: String(p) })} scroll
                                                className={`min-w-[32px] px-3 py-1.5 text-center text-[12px] font-semibold transition-all ${p === currentPage ? 'bg-foreground text-background' : 'border border-border text-muted hover:border-foreground hover:text-foreground'}`}>
                                                {p}
                                            </Link>
                                    )}
                                    {currentPage < totalPages && (
                                        <Link href={buildHref({ page: String(currentPage + 1) })} scroll
                                            className="px-3 py-1.5 border border-border text-[12px] font-semibold text-muted hover:border-foreground hover:text-foreground transition-all">
                                            →
                                        </Link>
                                    )}
                                    <span className="w-full text-center font-mono text-[10px] text-muted/50 mt-1">
                                        {total} artigos · página {currentPage} de {totalPages}
                                    </span>
                                </nav>
                            )}
                        </div>

                        <aside aria-label="Anúncio e categorias" className="hidden lg:flex lg:flex-col lg:self-stretch">
                            {/* Só o anúncio acompanha a rolagem; o resto desce com a página e fica no fim da coluna. */}
                            {ADSENSE.slots.article_sidebar && (
                                <div className="hidden xl:block" style={{ position: 'sticky', top: 'calc(var(--site-sticky-top, 92px) + var(--section-bar-h, 44px) + 12px)' }}>
                                    <BlogListaSidebarAd slot={ADSENSE.slots.article_sidebar} />
                                </div>
                            )}
                            <div className="mt-8">
                                <BlogSidebar recentPosts={sidebarPosts} categories={categories} currentCategory={currentCategory} />
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    )
}
