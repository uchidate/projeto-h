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

export const revalidate = 300

async function getShopProductsForPost(post: Awaited<ReturnType<typeof getPostBySlug>>, categorias: string[]): Promise<StoreProduct[]> {
    if (!post) return []
    const groups = post.related_entities?.groups ?? []
    const artists = post.related_entities?.artists ?? []

    const lists = await Promise.all([
        ...groups.slice(0, 2).map(g => getStoreProductsByGroupId(g.id)),
        ...artists.slice(0, 2).map(a => getStoreProductsByArtistId(a.id)),
    ])

    const byId = new Map<number, StoreProduct>()
    for (const list of lists) for (const product of list) byId.set(product.id, product)
    const daEntidade = [...byId.values()]
    if (daEntidade.length >= 3) return daEntidade

    // Pouco ou nenhum produto do grupo/artista citado: completa pelo assunto do texto
    // (título, resumo e categorias), em vez de deixar o artigo sem vitrine.
    const texto = `${stripHtml(post.title.rendered)} ${stripHtml(post.excerpt.rendered)} ${categorias.join(' ')}`
    const tematicos = escolherPorTema(await getStoreProducts(), {
        texto,
        excluirIds: daEntidade.map(p => p.id),
        limite: 6 - daEntidade.length,
    })
    return [...daEntidade, ...tematicos]
}

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
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
    const shopProducts = await getShopProductsForPost(post, cats.map(c => c.name))

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
            <BlogPostPage post={post} relatedPosts={relatedPosts} shopProducts={shopProducts} />
        </>
    )
}
