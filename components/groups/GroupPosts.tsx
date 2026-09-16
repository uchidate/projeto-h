import Image from 'next/image'
import Link from 'next/link'
import type { WPPost, WPTerm } from '@/lib/wordpress/types'
import { getWPImage, stripHtml, formatDatePt } from '@/lib/utils'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'

interface Props {
    posts: WPPost[]
    name: string
    accent: string
}

function PostMeta({ post, accent }: { post: WPPost; accent: string }) {
    const cats: WPTerm[] = (post._embedded?.['wp:term']?.[0] ?? []) as WPTerm[]
    const cat = cats[0]
    return (
        <div className="flex items-center gap-2 flex-wrap">
            {cat && (
                <span className="font-mono text-[10px] font-bold uppercase leading-4 tracking-widest"
                    style={{ color: accent }}>{cat.name}</span>
            )}
            <span className="font-mono text-[10px] text-muted">{formatDatePt(post.date)}</span>
            {post.acf?.reading_time && (
                <span className="font-mono text-[10px] text-muted/60">{post.acf.reading_time} min</span>
            )}
        </div>
    )
}

export function GroupPosts({ posts, name, accent }: Props) {
    if (posts.length === 0) return null

    const [featured, ...rest] = posts

    const featuredImg = getWPImage(featured._embedded, featured.featured_image_url)
    const featuredTitle = stripHtml(featured.title.rendered)

    return (
        <>
            <SectionTitleBar
                title={`Artigos sobre ${name}`}
                eyebrow="Blog"
                href={`/blog?search=${encodeURIComponent(name)}`}
                linkText="ver todos →"
            />

            {/* Featured post — full width */}
            <Link href={`/blog/${featured.slug}`}
                className="group block border border-border hover:border-accent/40 transition-colors mb-3 overflow-hidden">
                {featuredImg && (
                    <div className="relative w-full h-44 sm:h-56 overflow-hidden bg-surface">
                        <Image src={featuredImg.src} alt={featuredTitle} fill sizes="100vw"
                            className="object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute bottom-0 inset-x-0 p-4">
                            <PostMeta post={featured} accent={accent} />
                            <p className="text-[16px] sm:text-[18px] font-bold leading-snug text-white mt-1.5 group-hover:text-accent transition-colors line-clamp-2">
                                {featuredTitle}
                            </p>
                        </div>
                    </div>
                )}
                {!featuredImg && (
                    <div className="p-4">
                        <PostMeta post={featured} accent={accent} />
                        <p className="text-[16px] font-bold leading-snug text-foreground mt-1.5 group-hover:text-accent transition-colors line-clamp-2">
                            {featuredTitle}
                        </p>
                    </div>
                )}
            </Link>

            {/* Rest in 2-col grid */}
            {rest.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-2.5">
                    {rest.map(post => {
                        const pImg = getWPImage(post._embedded, post.featured_image_url)
                        const pTitle = stripHtml(post.title.rendered)
                        return (
                            <Link key={post.id} href={`/blog/${post.slug}`}
                                className="group flex gap-3 border border-border hover:border-accent/40 transition-colors p-3">
                                {pImg && (
                                    <div className="relative w-18 h-14 shrink-0 overflow-hidden bg-surface" style={{ width: 72 }}>
                                        <Image src={pImg.src} alt={pTitle} fill sizes="72px"
                                            className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                                    </div>
                                )}
                                <div className="min-w-0 flex flex-col justify-center">
                                    <PostMeta post={post} accent={accent} />
                                    <p className="text-[13px] font-semibold leading-snug line-clamp-2 group-hover:text-accent transition-colors mt-0.5">
                                        {pTitle}
                                    </p>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </>
    )
}
