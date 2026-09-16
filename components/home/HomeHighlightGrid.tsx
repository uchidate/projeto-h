import Image from 'next/image'
import Link from 'next/link'
import type { WPPost } from '@/lib/wordpress/types'
import { getWPImage, stripHtml, formatDatePt } from '@/lib/utils'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'
import { HomeKicker } from '@/components/home/HomeKicker'

export function HomeHighlightGrid({ posts, categoryMap }: { posts: WPPost[]; categoryMap?: Record<number, { name: string; slug: string }> }) {
    if (!posts.length) return null
    const [featured, ...secondary] = posts

    return (
        <div className="border-t border-border px-4 py-7 sm:px-6 sm:py-8 lg:px-10">
            <SectionTitleBar
                title="Em destaque"
                action={<span className="hidden font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted sm:block">seleção editorial</span>}
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-6">

                {/* Card destaque — esquerda */}
                {featured && (() => {
                    const image = getWPImage(featured._embedded, featured.featured_image_url)
                    const title = stripHtml(featured.title.rendered)
                    const excerpt = stripHtml(featured.excerpt?.rendered ?? '').slice(0, 130)
                    return (
                        <Link href={`/blog/${featured.slug}`} className="group block sm:col-span-2 lg:col-span-1">
                            <div className="relative aspect-4/3 overflow-hidden border border-border bg-surface">
                                {image ? (
                                    <Image src={image.src} alt={image.alt || title} fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 55vw"
                                        className="object-cover" />
                                ) : <div className="h-full bg-surface" />}
                                <div className="absolute bottom-3 left-3">
                                    <HomeKicker post={featured} categoryMap={categoryMap} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <h3 className="font-serif text-home-title-lg font-medium text-foreground group-hover:text-accent transition-colors">
                                    {title}
                                </h3>
                                {excerpt && (
                                    <p className="mt-2 text-home-body-lg text-muted line-clamp-2">{excerpt}</p>
                                )}
                                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted/70">{formatDatePt(featured.date)}</p>
                            </div>
                        </Link>
                    )
                })()}

                {/* 3 cards secundários + CTA — direita */}
                <div className="flex flex-col sm:col-span-2 lg:col-span-1">
                    {secondary.slice(0, 5).map((post, index) => {
                        const image = getWPImage(post._embedded, post.featured_image_url)
                        const title = stripHtml(post.title.rendered)
                        return (
                            <Link key={post.id} href={`/blog/${post.slug}`}
                                className={`${index >= 3 ? 'hidden sm:flex' : 'flex'} group gap-4 border-b border-border py-4 first:pt-0 items-start`}>
                                <div className="relative w-[100px] shrink-0 aspect-4/3 overflow-hidden border border-border bg-surface">
                                    {image ? (
                                        <Image src={image.src} alt={image.alt || title} fill
                                            sizes="100px"
                                            className="object-cover" />
                                    ) : <div className="h-full bg-surface" />}
                                </div>
                                <div className="min-w-0 flex-1 flex flex-col justify-center">
                                    <HomeKicker post={post} categoryMap={categoryMap} />
                                    <h3 className="mt-1.5 font-serif text-home-title-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-3">
                                        {title}
                                    </h3>
                                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted/70">{formatDatePt(post.date)}</p>
                                </div>
                            </Link>
                        )
                    })}
                    <Link href="/blog"
                        className="group mt-auto flex items-center justify-between border border-border bg-surface/60 px-4 py-3 hover:border-accent/50 hover:bg-surface transition-colors">
                        <span className="text-[12px] font-black text-foreground group-hover:text-accent transition-colors">Ver todos os artigos</span>
                        <span className="text-accent font-mono font-black transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
