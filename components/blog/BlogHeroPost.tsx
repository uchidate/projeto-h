import Image from 'next/image'
import Link from 'next/link'
import { Clock, ArrowRight } from 'lucide-react'
import type { WPPost, WPTerm } from '@/lib/wordpress/types'
import { getWPImage, stripHtml, formatDatePt, readingTime } from '@/lib/utils'
import { catStyle } from '@/lib/blog/catStyle'

export function BlogHeroPost({ post, categoryMap }: { post: WPPost; categoryMap?: Record<number, { name: string; slug: string }> }) {
    const image = getWPImage(post._embedded, post.featured_image_url)
    const title = stripHtml(post.title.rendered)
    const excerpt = stripHtml(post.excerpt.rendered).slice(0, 160)
    const mins = readingTime(post.content?.rendered ?? '')
    const cat = post.categories?.[0] && categoryMap
        ? categoryMap[post.categories[0]]
        : ((post._embedded?.['wp:term']?.[0] ?? []) as WPTerm[])[0]
    const cs = catStyle(cat?.slug)

    return (
        <Link href={`/blog/${post.slug}`}
            className="group relative flex flex-col justify-end overflow-hidden mb-10 border border-border">
            <div className="lg:flex lg:min-h-[460px]">
                <div className="relative aspect-4/3 lg:aspect-auto lg:w-[58%] lg:shrink-0 overflow-hidden">
                    {image ? (
                        <Image src={image.src} alt={title} fill priority fetchPriority="high"
                            className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                            sizes="(max-width: 1024px) 100vw, 58vw" />
                    ) : (
                        <div className="h-full" style={{ background: `linear-gradient(135deg, ${cs.bg}, ${cs.color}55)` }} />
                    )}
                </div>
                <div className="flex flex-col justify-between flex-1 p-6 lg:p-10 bg-background border-t border-border lg:border-t-0 lg:border-l">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] px-2 py-0.5"
                                style={{ backgroundColor: cs.bg, color: cs.color }}>
                                {cat?.name ?? 'Capa'}
                            </span>
                            <span className="font-mono text-[10px] text-accent font-bold uppercase tracking-widest">Destaque</span>
                        </div>
                        <h2 className="font-serif text-[22px] sm:text-[28px] lg:text-[36px] font-medium leading-tight tracking-[-0.03em] text-foreground group-hover:text-accent transition-colors max-w-[22ch]">
                            {title}
                        </h2>
                        {excerpt && (
                            <p className="mt-4 text-[14px] leading-[1.7] text-foreground/70 max-w-[55ch] hidden sm:block">
                                {excerpt}
                            </p>
                        )}
                    </div>
                    <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                        <span className="text-[11px] text-muted flex items-center gap-2">
                            {formatDatePt(post.date)}
                            <span className="flex items-center gap-1"><Clock size={9} /> {mins} min</span>
                        </span>
                        <span className="font-black text-[12px] text-accent flex items-center gap-1 group-hover:gap-2 transition-all">
                            continuar <ArrowRight size={12} />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
