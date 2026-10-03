import type { Metadata } from 'next'
import { linksDePaginacao, paginaDe, paginaInvalida, robotsDaListagem, urlDaListagem } from '@/lib/listagem'
import { notFound } from 'next/navigation'
import type { WPPost } from '@/lib/wordpress/types'
import { getPosts, getCategories, getSidebarPosts } from '@/lib/wordpress/posts'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { BlogPage } from '@/components/blog/BlogPage'
import { getAllHubs } from '@/lib/guias'
import { candidatosDestaque, maisLidos, perenes as escolherPerenes } from '@/lib/blog/destaque'
import { getFeaturedStoreProducts } from '@/lib/wordpress/store'
import { ordenarPrateleira } from '@/lib/wordpress/store-ranking'
import { PageBreadcrumb } from '@/components/seo/PageBreadcrumb'

async function carregarBase(): Promise<WPPost[]> {
    try {
        const primeira = await getPosts({ page: 1, perPage: 100, includeContent: false })
        const paginas = Math.min(primeira.totalPages, 8)
        const demais = await Promise.all(
            Array.from({ length: Math.max(0, paginas - 1) }, (_, i) => getPosts({ page: i + 2, perPage: 100, includeContent: false }).then(r => r.items).catch(() => [] as WPPost[])),
        )
        return [primeira.items, ...demais].flat()
    } catch { return [] }
}

export type SearchParams = Promise<{ category?: string; tag?: string; page?: string; search?: string; order?: string }>

function buildBlogUrl(siteUrl: string, page: number, opts: { category?: string; tag?: string }) {
    return urlDaListagem('/blog', ['category', 'tag'], { category: opts.category, tag: opts.tag, page: page > 1 ? String(page) : undefined }, siteUrl)
}

export async function metadataBlogListagem({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const sp = await searchParams
    const page = paginaDe(sp.page)
    const canonical = buildBlogUrl(SITE_URL, page, sp)
    const title = sp.category
        ? `Blog — ${sp.category}${page > 1 ? ` — página ${page}` : ''}`
        : page > 1
            ? `Blog — página ${page} — K-Drama, K-Pop e Cultura Coreana`
            : 'Blog — K-Drama, K-Pop e Cultura Coreana'

    // Fetch só para saber totalPages (leve: 1 post, só cabeçalho X-WP-TotalPages)
    const { totalPages } = await getPosts({ page, perPage: 13, category: sp.category, tag: sp.tag, search: sp.search, includeContent: false })
    const shouldNoIndex = Boolean(sp.search || sp.tag || sp.order) || paginaInvalida(page, totalPages)

    return {
        title,
        description: 'Artigos, reviews e guias sobre K-Drama, K-Pop e cultura coreana em português.',
        alternates: {
            canonical,
            ...linksDePaginacao({ page, totalPages, urlDaPagina: (p) => buildBlogUrl(SITE_URL, p, sp) }),
        },
        ...robotsDaListagem(shouldNoIndex),
        openGraph: baseOG(canonical),
        twitter: baseTwitter(),
    }
}

export async function BlogListagem({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams
    const page = paginaDe(sp.page)

    const semFiltro = !sp.category && !sp.tag && !sp.search
    const order = sp.order === 'lidos' ? 'lidos' : undefined
    const [postsResult, categories, sidebarPosts, hubs, pool] = await Promise.all([
        getPosts({ page, perPage: 13, category: sp.category, tag: sp.tag, search: sp.search, includeContent: false }),
        getCategories(),
        getSidebarPosts(page, 13),
        getAllHubs(),
        // Base do destaque, dos conteúdos-chave e de "Mais lidos": todo o acervo (até 8 chamadas de 100, em cache); os guias
        // perenes costumam ser antigos e ficariam fora de uma janela só dos recentes. Falha aqui não derruba a lista.
        semFiltro ? carregarBase() : Promise.resolve([] as WPPost[]),
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
    if (paginaInvalida(page, postsResult.totalPages)) notFound()

    // Mais lidos: ordena a base por leitura humana (90 dias) e pagina aqui mesmo.
    const lidos = order === 'lidos' ? maisLidos(pool) : null
    const porPagina = 12
    const itens = lidos ? lidos.slice((page - 1) * porPagina, page * porPagina) : postsResult.items
    const totalItens = lidos ? lidos.length : postsResult.total
    const paginas = lidos ? Math.max(1, Math.ceil(lidos.length / porPagina)) : postsResult.totalPages
    if (lidos && page > paginas) notFound()
    const inicio = semFiltro && page === 1 && !order
    const comImagem = pool.filter(p => p.featured_image_url)
    const candidatos = inicio ? candidatosDestaque(comImagem, new Date(), 3) : []
    // O que já é candidato a destaque não repete em "Comece por aqui".
    const idsCandidatos = new Set(candidatos.map(p => p.id))
    const shopProducts = inicio
        ? ordenarPrateleira(await getFeaturedStoreProducts(8), 'listagem:blog')
        : []

    return (
        <>
            <PageBreadcrumb items={[{ name: 'Blog', path: '/blog' }]} />
        <BlogPage
            posts={itens}
            total={totalItens}
            totalPages={paginas}
            categories={categories}
            currentPage={page}
            currentCategory={sp.category}
            currentTag={sp.tag}
            currentSearch={sp.search}
            sidebarPosts={sidebarPosts}
            guias={guias}
            order={order}
            destaques={candidatos}
            emAlta={inicio ? candidatosDestaque(pool, new Date(), 8).filter(p => !idsCandidatos.has(p.id)).slice(0, 4) : []}
            perenes={inicio ? escolherPerenes(pool.filter(p => !idsCandidatos.has(p.id)), 4, new Date(), categories.filter(c => c.slug === 'noticias-k-pop').map(c => c.id)) : []}
            shopProducts={shopProducts}
        />
        </>
    )
}
