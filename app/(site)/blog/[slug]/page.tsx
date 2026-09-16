import { SITE_NAME } from '@/lib/constants/site'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostBySlug, getPosts, getRelatedPosts } from '@/lib/wordpress/posts'
import { SITE_URL, buildOgImageUrl } from '@/lib/constants/site'
import { stripHtml, getWPImage, getWPTerms } from '@/lib/utils'
import { buildWordPressMetadata } from '@/lib/seo/wordpress'
import { buildBreadcrumbSchema } from '@/lib/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLd'
import { RastreioDeLeitura } from '@/components/analytics/RastreioDeLeitura'
import { BlogPostPage } from '@/components/blog/BlogPostPage'
import { WpEditSetter } from '@/components/ui/WpEditContext'
import { metaDescription } from '@/lib/seo/metaDescription'

export const revalidate = 300

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
    })
}

export default async function PostPage({ params }: { params: Params }) {
    const { slug } = await params
    const post = await getPostBySlug(slug)
    if (!post) notFound()

    const cats = getWPTerms(post._embedded, 'category')
    const relatedPosts = await getRelatedPosts(post)

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
            <BlogPostPage post={post} relatedPosts={relatedPosts} />
        </>
    )
}
