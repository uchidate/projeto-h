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
import { CATEGORIAS_COM_LOJA } from '@/lib/blog/categoriaLoja'
import { carregarLojaDoTema } from '@/lib/blog/lojaDoTema'
import { ordenarPrateleira } from '@/lib/wordpress/store-ranking'
import { PageBreadcrumb } from '@/components/seo/PageBreadcrumb'
import { idsGuiaDeCompra } from '@/lib/blog/guiasDeCompra'
import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { localizarGuia, slugPublicoDoGuia } from '@/lib/guias/i18n'
import type { WPTerm } from '@/lib/wordpress/types'

/** Categorias oferecidas no filtro em inglês, na ordem em que aparecem (o rótulo vem de `home.categorias`). */
const CATEGORIAS_EM_OUTRO_IDIOMA = ['k-pop', 'k-drama', 'k-film', 'cultura', 'k-beauty', 'reality-shows', 'webtoons'] as const

/**
 * Categorias de um idioma: as do WordPress (mesmos ids e slugs), com o nome do idioma e a contagem de artigos
 * que têm tradução publicada. Categoria sem artigo no idioma sai do filtro.
 */
async function categoriasDoIdioma(locale: Locale, todas: WPTerm[]): Promise<WPTerm[]> {
    const rotulos = (await getTranslations({ locale, namespace: 'home.categorias' })) as unknown as { (chave: string): string; has(chave: string): boolean }
    const contagens = await Promise.all(CATEGORIAS_EM_OUTRO_IDIOMA.map(async slug => ({ slug, total: (await getPosts({ lang: locale, category: slug, perPage: 1, includeContent: false }).catch(() => ({ total: 0 }))).total })))
    return contagens.flatMap(({ slug, total }) => {
        const termo = todas.find(c => c.slug === slug)
        return termo && total > 0 ? [{ ...termo, name: rotulos.has(slug) ? rotulos(slug) : termo.name, count: total }] : []
    })
}

async function carregarBase(lang?: string): Promise<WPPost[]> {
    try {
        const primeira = await getPosts({ page: 1, perPage: 100, includeContent: false, lang })
        const paginas = Math.min(primeira.totalPages, 8)
        const demais = await Promise.all(
            Array.from({ length: Math.max(0, paginas - 1) }, (_, i) => getPosts({ page: i + 2, perPage: 100, includeContent: false, lang }).then(r => r.items).catch(() => [] as WPPost[])),
        )
        return [primeira.items, ...demais].flat()
    } catch { return [] }
}

export type SearchParams = Promise<{ category?: string; tag?: string; page?: string; search?: string; order?: string; tipo?: string }>

/**
 * O que a lista traz. Sem filtro, a listagem é de notícias e artigos: os guias de compra (K-beauty,
 * merch, comida) ficam de fora e têm aba própria (`?tipo=guias`). Com categoria, tag ou busca o
 * leitor pediu um recorte, e nada é retirado.
 */
function consultaDaLista(sp: { category?: string; tag?: string; search?: string; tipo?: string }, idsGuias: number[]) {
    const semFiltro = !sp.category && !sp.tag && !sp.search
    if (semFiltro && sp.tipo === 'guias') return { tipo: 'guias' as const, extra: { categoryIds: idsGuias } }
    if (semFiltro) return { tipo: undefined, extra: { categoriesExclude: idsGuias } }
    // Busca por texto: por data, "Round 6" trazia um protetor solar em primeiro; a relevância põe o guia da série à frente.
    return { tipo: undefined, extra: sp.search ? { orderby: 'relevance' as const } : {} }
}

function buildBlogUrl(siteUrl: string, page: number, opts: { category?: string; tag?: string }, locale: Locale = DEFAULT_LOCALE) {
    return urlDaListagem(href('blog', undefined, locale), ['category', 'tag'], { category: opts.category, tag: opts.tag, page: page > 1 ? String(page) : undefined }, siteUrl)
}

export async function metadataBlogListagem({ searchParams, locale = DEFAULT_LOCALE }: { searchParams: SearchParams; locale?: Locale }): Promise<Metadata> {
    const sp = await searchParams
    const page = paginaDe(sp.page)
    const lang = locale === DEFAULT_LOCALE ? undefined : locale
    const t = await getTranslations({ locale, namespace: 'client.blogLista' })
    const canonical = buildBlogUrl(SITE_URL, page, sp, locale)
    const idsGuias = idsGuiaDeCompra(await getCategories())
    const consulta = consultaDaLista(sp, idsGuias)
    const sufixo = page > 1 ? t('metaPage', { page }) : ''
    const title = sp.category ? `${t('metaTitleCategory', { category: sp.category })}${sufixo}` : `${t('metaTitle')}${sufixo}`

    // Fetch só para saber totalPages (leve: 1 post, só cabeçalho X-WP-TotalPages)
    const { totalPages } = await getPosts({ page, perPage: 13, category: sp.category, tag: sp.tag, search: sp.search, includeContent: false, lang, ...consulta.extra })
    const shouldNoIndex = Boolean(sp.search || sp.tag || sp.order || consulta.tipo) || paginaInvalida(page, totalPages)

    return {
        title,
        description: t('metaDescription'),
        alternates: {
            canonical,
            ...linksDePaginacao({ page, totalPages, urlDaPagina: (p) => buildBlogUrl(SITE_URL, p, sp, locale) }),
        },
        ...robotsDaListagem(shouldNoIndex),
        openGraph: baseOG(canonical),
        twitter: baseTwitter(),
    }
}

export async function BlogListagem({ searchParams, locale = DEFAULT_LOCALE }: { searchParams: SearchParams; locale?: Locale }) {
    const sp = await searchParams
    const page = paginaDe(sp.page)
    const emPt = locale === DEFAULT_LOCALE
    const lang = emPt ? undefined : locale

    const semFiltro = !sp.category && !sp.tag && !sp.search
    // Ordem por leitura usa o campo `views`, que só o original em português acumula.
    const order = emPt && sp.order === 'lidos' ? 'lidos' : undefined
    const todasCategorias = await getCategories()
    const idsGuias = idsGuiaDeCompra(todasCategorias)
    const categories = emPt ? todasCategorias : await categoriasDoIdioma(locale, todasCategorias)
    const consulta = consultaDaLista(sp, idsGuias)
    const [postsResult, sidebarPosts, hubs, pool] = await Promise.all([
        getPosts({ page, perPage: 13, category: sp.category, tag: sp.tag, search: sp.search, includeContent: false, lang, ...consulta.extra }),
        getSidebarPosts(page, 13, semFiltro && !consulta.tipo ? idsGuias : [], lang),
        getAllHubs(),
        // Base do destaque, dos conteúdos-chave e de "Mais lidos": todo o acervo (até 8 chamadas de 100, em cache); os guias
        // perenes costumam ser antigos e ficariam fora de uma janela só dos recentes. Falha aqui não derruba a lista.
        semFiltro ? carregarBase(lang) : Promise.resolve([] as WPPost[]),
    ])
    /* Os guias saíram da navbar — eram índice de índices ocupando slot de
       destino. Reaparecem aqui, que é onde a intenção "quero descobrir o que
       ver" já está. Só a família de gênero: é a mais voltada ao leitor, contra
       as de agência/ano/canal, que servem sobretudo a busca. */
    const guias = hubs
        .filter(h => h.kind === 'productions' && h.filter.genre)
        .flatMap((h): typeof hubs => {
            if (emPt) return [h]
            const traduzido = localizarGuia(h, locale)
            return traduzido ? [{ ...traduzido, slug: slugPublicoDoGuia(h.slug, locale) ?? h.slug }] : []
        })
        .slice(0, 6)
    // Blog sem filtros nunca é vazio (490+ posts): lista vazia é falha
    // transitória do WP — lançar preserva o snapshot ISR anterior em vez de
    // cachear a listagem em branco (mesmo guard de /productions).
    const unfiltered = !sp.category && !sp.tag && !sp.search
    if (emPt && unfiltered && page === 1 && postsResult.items.length === 0) {
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
    const inicio = semFiltro && page === 1 && !order && !consulta.tipo
    const comImagem = pool.filter(p => p.featured_image_url)
    const candidatos = inicio ? candidatosDestaque(comImagem, new Date(), 3) : []
    // O que já é candidato a destaque não repete em "Comece por aqui".
    const idsCandidatos = new Set(candidatos.map(p => p.id))
    const shopProducts = inicio && emPt
        ? ordenarPrateleira(await getFeaturedStoreProducts(8), 'listagem:blog')
        : []

    // Categoria com loja (K-beauty): marcas com produto e vitrine própria, só na 1ª página sem busca, etiqueta nem ordem.
    const cfgLoja = emPt && sp.category && !sp.tag && !sp.search && !order && page === 1 ? CATEGORIAS_COM_LOJA[sp.category] : undefined
    const categoriaLoja = cfgLoja ? await carregarLojaDoTema(cfgLoja, `listagem:blog:${sp.category}`) : undefined

    return (
        <>
            <PageBreadcrumb items={[{ name: 'Blog', path: '/blog' }]} />
        <BlogPage
            locale={locale}
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
            tipo={consulta.tipo}
            destaques={candidatos}
            emAlta={inicio ? candidatosDestaque(pool, new Date(), 8).filter(p => !idsCandidatos.has(p.id)).slice(0, 4) : []}
            perenes={inicio ? escolherPerenes(pool.filter(p => !idsCandidatos.has(p.id)), 4, new Date(), categories.filter(c => c.slug === 'noticias-k-pop').map(c => c.id)) : []}
            shopProducts={shopProducts}
            categoriaLoja={categoriaLoja}
        />
        </>
    )
}
