import Link from 'next/link'
import { BookOpen, Sparkles, ArrowRight } from 'lucide-react'
import type { WPPost, WPTerm } from '@/lib/wordpress/types'
import type { ArchiveHub } from '@/lib/guias'
import { ResponsiveFilterBar } from '@/components/ui/ResponsiveFilterBar'
import { PageBreadcrumb } from '@/components/ui/PageBreadcrumb'
import { SearchInput } from '@/components/ui/SearchInput'
import { BlogCategorySelect } from '@/components/blog/BlogCategorySelect'
import { BlogHeroPost } from '@/components/blog/BlogHeroPost'
import { BlogPostCard } from '@/components/blog/BlogPostCard'
import { BlogCompactCard } from '@/components/blog/BlogCompactCard'
import { BlogSidebar } from '@/components/blog/BlogSidebar'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { EmptyState } from '@/components/ui/EmptyState'
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
}

export function BlogPage({ posts, total, totalPages, categories, currentPage, currentCategory, currentTag, currentSearch, sidebarPosts: sidebarPostsProp, guias = [] }: Props) {
    const categoryMap = Object.fromEntries(categories.map(c => [c.id, { name: c.name, slug: c.slug }]))
    function buildHref(overrides: Record<string, string | undefined> = {}) {
        const params = new URLSearchParams()
        const next = { category: currentCategory, tag: currentTag, search: currentSearch, ...overrides }
        if (next.category) params.set('category', next.category)
        if (next.tag) params.set('tag', next.tag)
        if (next.search) params.set('search', next.search)
        const page = overrides.page
        if (page && page !== '1') params.set('page', page)
        const qs = params.toString()
        return `/blog${qs ? `?${qs}` : ''}`
    }

    const isFiltered = !!(currentCategory || currentTag || currentSearch)
    const [hero, ...rest] = posts
    const currentCategoryLabel = categories.find(c => c.slug === currentCategory)?.name ?? currentCategory

    const showHero = !isFiltered && currentPage === 1 && !!hero
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
            <RastreioDeFiltros listagem="blog" filtros={['category', 'tag', 'page', 'search']} />
            <ResponsiveFilterBar label="Filtros" value={currentCategoryLabel ?? 'Artigos'}>
                <div className="space-y-3 lg:flex lg:w-full lg:items-center lg:gap-2 lg:space-y-0">
                    <BlogCategorySelect categories={categories} current={currentCategory} />
                    <SearchInput placeholder="Buscar artigo..." param="search" current={currentSearch} className="lg:ml-auto" />
                </div>
            </ResponsiveFilterBar>
            <PageBreadcrumb
                crumbs={[{ label: 'Início', href: '/' }, { label: currentCategoryLabel ?? 'Artigos' }]}
                description="Artigos sobre K-Pop, K-Drama e cultura coreana"
            />

            <div className="page-wrap pt-8 pb-16">

                {showHero && <BlogHeroPost post={hero} categoryMap={categoryMap} />}

                {/* Guias saíram da navbar e reaparecem aqui, ao lado da intenção
                    que já os procurava. Só na primeira página sem filtro: numa
                    busca por artigo específico esta faixa seria ruído. */}
                {!isFiltered && currentPage === 1 && guias.length > 0 && (
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
                    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-14">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-5">
                                <Sparkles size={12} className="text-accent shrink-0" />
                                <p className="font-mono text-[10px] font-black uppercase tracking-[0.15em] text-foreground/60 shrink-0">
                                    {isFiltered ? 'Artigos encontrados' : 'Últimos artigos'}
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

                        <div className="sticky top-[calc(var(--site-header-h,64px)+24px)] self-start max-h-[calc(100vh-var(--site-header-h,64px)-48px)] overflow-y-auto">
                            <BlogSidebar recentPosts={sidebarPosts} categories={categories} currentCategory={currentCategory} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
