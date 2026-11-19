import { SITE_NAME } from '@/lib/constants/site'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostBySlug, getPosts, getRelatedPosts } from '@/lib/wordpress/posts'
import { getStoreProducts, getStoreProductsByGroupId, getStoreProductsByArtistId, type StoreProduct } from '@/lib/wordpress/store'
import { escolherPorTema } from '@/lib/wordpress/store-contexto'
import { SITE_URL, buildOgImageUrl } from '@/lib/constants/site'
import { stripHtml, getWPImage, getWPTerms } from '@/lib/utils'
import { buildWordPressMetadata } from '@/lib/seo/wordpress'
import { buildBreadcrumbSchema } from '@/lib/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLd'
import { RastreioDeLeitura } from '@/components/analytics/RastreioDeLeitura'
import { BlogPostPage } from '@/components/blog/BlogPostPage'
import { WpEditSetter } from '@/components/ui/WpEditContext'
import { metaDescription } from '@/lib/seo/metaDescription'
import { buildPostAlternates } from '@/lib/blog/translations'
import { getProdutosDosBlocos } from '@/lib/blog/produtosDosBlocos'


/** Produtos da loja para o artigo e, quando vêm do grupo/artista citado, o nome dele (vira o título da faixa). */
async function getShopProductsForPost(post: Awaited<ReturnType<typeof getPostBySlug>>, categorias: string[]): Promise<{ produtos: StoreProduct[]; origem: string | null }> {
    if (!post) return { produtos: [], origem: null }
    const groups = (post.related_entities?.groups ?? []).slice(0, 2)
    const artists = (post.related_entities?.artists ?? []).slice(0, 2)

    const lists = await Promise.all([
        ...groups.map(g => getStoreProductsByGroupId(g.id)),
        ...artists.map(a => getStoreProductsByArtistId(a.id)),
    ])
    const nomes = [...groups.map(g => g.name), ...artists.map(a => a.name)]

    const byId = new Map<number, StoreProduct>()
    for (const list of lists) for (const product of list) byId.set(product.id, product)
    const daEntidade = [...byId.values()]
    // Uma entidade só responde pela maior parte da prateleira: o título pode nomeá-la.
    const maior = lists.reduce((m, l, i) => (l.length > (lists[m]?.length ?? 0) ? i : m), 0)
    const origem = daEntidade.length > 0 && (lists[maior]?.length ?? 0) * 2 > daEntidade.length ? nomes[maior] ?? null : null
    if (daEntidade.length >= 3) return { produtos: daEntidade, origem }

    // Pouco ou nenhum produto do grupo/artista citado (ou post sem entidade): completa pelo assunto
    // do texto, em vez de deixar o artigo sem vitrine. Só casamento real, sem vitrine genérica.
    const texto = `${stripHtml(post.title.rendered)} ${stripHtml(post.excerpt.rendered)} ${categorias.join(' ')}`
    const tematicos = escolherPorTema(await getStoreProducts(), {
        texto,
        excluirIds: daEntidade.map(p => p.id),
        limite: 6 - daEntidade.length,
    })
    const produtos = [...daEntidade, ...tematicos]
    return { produtos, origem: daEntidade.length * 2 > produtos.length ? origem : null }
}

type Params = Promise<{ slug: string }>

export async function slugsPreGerados() {
    try {
        const { items } = await getPosts({ perPage: 50 })
        return items.map(p => ({ slug: p.slug }))
    } catch {
        return []
    }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { slug } = await params
    const post = await getPostBySlug(slug)
    if (!post) return {}

    // Use Rank Math SEO metadata if available
    const title = (post.meta?.rank_math_title as string | undefined) || stripHtml(post.title.rendered)
    const description = (post.meta?.rank_math_description as string | undefined)
        || metaDescription(post.acf?.subtitle?.trim() || stripHtml(post.excerpt.rendered))
    const image = getWPImage(post._embedded, post.featured_image_url, title)
    const url = `${SITE_URL}/blog/${slug}`

    return buildWordPressMetadata({
        title,
        description,
        url,
        image,
        article: {
            publishedTime: post.date,
            modifiedTime: post.modified,
        },
        ogImageOverride: buildOgImageUrl({ title, subtitle: description, image: image?.src, type: 'post' }),
        languages: buildPostAlternates(post.translations, 'pt', slug).languages,
    })
}

export default async function PostPage({ params }: { params: Params }) {
    const { slug } = await params
    const post = await getPostBySlug(slug)
    if (!post) notFound()

    const cats = getWPTerms(post._embedded, 'category')
    const relatedPosts = await getRelatedPosts(post)
    const produtosNoTexto = await getProdutosDosBlocos(post)
    const idsNoTexto = new Set(produtosNoTexto.map(p => p.id))
    // O que já aparece dentro do texto não se repete nas faixas de loja do mesmo artigo.
    const loja = await getShopProductsForPost(post, cats.map(c => c.name))
    const shopProducts = loja.produtos.filter(p => !idsNoTexto.has(p.id))

    const title = stripHtml(post.title.rendered)
    const url = `${SITE_URL}/blog/${slug}`

    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: `${SITE_NAME}`, url: SITE_URL },
        { name: 'Blog', url: `${SITE_URL}/blog` },
        ...(cats[0] ? [{ name: cats[0].name, url: `${SITE_URL}/blog?categoria=${cats[0].slug}` }] : []),
        { name: title, url },
    ])

    return (
        <>
            <WpEditSetter postId={post.id} postType="post" />
            <JsonLd data={breadcrumbSchema} />
            {/* Unico pedaco cliente da pagina: mede profundidade de rolagem e
                tempo de atencao sem tornar o artigo inteiro um Client
                Component, o que custaria desempenho e SEO. */}
            <RastreioDeLeitura slug={slug} caminho={`/blog/${slug}`} />
            <BlogPostPage post={post} relatedPosts={relatedPosts} shopProducts={shopProducts} origemLoja={loja.origem} produtosNoTexto={produtosNoTexto} />
        </>
    )
}
