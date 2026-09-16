import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPosts, getCategories, getSidebarPosts } from '@/lib/wordpress/posts'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { BlogPage } from '@/components/blog/BlogPage'
import { getAllHubs } from '@/lib/guias'

export const revalidate = 300

type SearchParams = Promise<{ category?: string; tag?: string; page?: string; search?: string }>

function buildBlogUrl(siteUrl: string, page: number, opts: { category?: string; tag?: string }) {
    const ps = new URLSearchParams()
    if (opts.category) ps.set('category', opts.category)
    if (opts.tag) ps.set('tag', opts.tag)
    if (page > 1) ps.set('page', String(page))
    return `${siteUrl}/blog${ps.toString() ? `?${ps}` : ''}`
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const sp = await searchParams
    const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
    const canonical = buildBlogUrl(SITE_URL, page, sp)
    const title = sp.category
        ? `Blog — ${sp.category}${page > 1 ? ` — página ${page}` : ''}`
        : page > 1
            ? `Blog — página ${page} — K-Drama, K-Pop e Cultura Coreana`
            : 'Blog — K-Drama, K-Pop e Cultura Coreana'

    // Fetch só para saber totalPages (leve: 1 post, só cabeçalho X-WP-TotalPages)
    const { totalPages } = await getPosts({ page, perPage: 13, category: sp.category, tag: sp.tag, search: sp.search, includeContent: false })
    const shouldNoIndex = Boolean(sp.search || sp.tag) || page > Math.max(1, totalPages)

    return {
        title,
        description: 'Artigos, reviews e guias sobre K-Drama, K-Pop e cultura coreana em português.',
        alternates: {
            canonical,
            ...(page > 1 ? { prev: buildBlogUrl(SITE_URL, page - 1, sp) } : {}),
            ...(page < totalPages ? { next: buildBlogUrl(SITE_URL, page + 1, sp) } : {}),
        },
        ...(shouldNoIndex ? { robots: { index: false, follow: true } } : {}),
        openGraph: baseOG(canonical),
        twitter: baseTwitter(),
    }
}

export default async function BlogListPage({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams
    const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)

    const [postsResult, categories, sidebarPosts, hubs] = await Promise.all([
        getPosts({ page, perPage: 13, category: sp.category, tag: sp.tag, search: sp.search, includeContent: false }),
        getCategories(),
        getSidebarPosts(page, 13),
        getAllHubs(),
    ])
    /* Os guias saíram da navbar — eram índice de índices ocupando slot de
       destino. Reaparecem aqui, que é onde a intenção "quero descobrir o que
       ver" já está. Só a família de gênero: é a mais voltada ao leitor, contra
       as de agência/ano/canal, que servem sobretudo a busca. */
    const guias = hubs.filter(h => h.kind === 'productions' && h.filter.genre).slice(0, 6)
    // Blog sem filtros nunca é vazio (490+ posts): lista vazia é falha
    // transitória do WP — lançar preserva o snapshot ISR anterior em vez de
    // cachear a listagem em branco (mesmo guard de /productions).
    const unfiltered = !sp.category && !sp.tag && !sp.search
    if (unfiltered && page === 1 && postsResult.items.length === 0) {
        throw new Error('Listagem do blog retornou vazia — WP indisponível durante a regeneração')
    }
    if (page > Math.max(1, postsResult.totalPages)) notFound()

    return (
        <BlogPage
            posts={postsResult.items}
            total={postsResult.total}
            totalPages={postsResult.totalPages}
            categories={categories}
            currentPage={page}
            currentCategory={sp.category}
            currentTag={sp.tag}
            currentSearch={sp.search}
            sidebarPosts={sidebarPosts}
            guias={guias}
        />
    )
}
