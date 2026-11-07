import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import type { WPPost } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { slugPublicoDoPost } from '@/lib/blog/translations'

/** Artigo em formato compacto (miniatura + título + nota opcional), usado nas listas da conta. */
export function PostMiniCard({ post, nota }: { post: WPPost; nota?: string }) {
    const img = getWPImage(post._embedded, post.featured_image_url)
    return (
        <Link href={`/blog/${slugPublicoDoPost(post.translations, post.slug)}`}
            className="group grid grid-cols-[80px_minmax(0,1fr)] border border-border bg-surface hover:border-accent/50 transition-colors overflow-hidden">
            {img ? (
                <div className="relative h-full min-h-[80px] bg-background">
                    <Image src={img.src} alt={img.alt || ''} fill className="object-cover" sizes="80px" />
                </div>
            ) : (
                <div className="h-full min-h-[80px] bg-surface" />
            )}
            <div className="p-3">
                <p className="line-clamp-2 text-[13px] font-black leading-tight text-foreground group-hover:text-accent transition-colors">
                    {stripHtml(post.title.rendered)}
                </p>
                {nota && <p className="mt-1 text-[11px] font-semibold text-muted">{nota}</p>}
            </div>
        </Link>
    )
}

/** Grade de artigos compactos. */
export function GradeDePosts({ posts, nota }: { posts: WPPost[]; nota?: string }) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {posts.map(post => <PostMiniCard key={post.id} post={post} nota={nota} />)}
        </div>
    )
}
