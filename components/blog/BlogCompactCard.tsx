import Image from 'next/image'
import Link from 'next/link'
import { Clock, ChevronRight } from 'lucide-react'
import type { WPPost, WPTerm } from '@/lib/wordpress/types'
import { getWPImage, stripHtml, formatDatePt } from '@/lib/utils'
import { catStyle, postReadingTime } from '@/lib/blog/catStyle'

export function BlogCompactCard({ post, rank, categoryMap }: { post: WPPost; rank?: number; categoryMap?: Record<number, { name: string; slug: string }> }) {
    const image = getWPImage(post._embedded, post.featured_image_url)
    const title = stripHtml(post.title.rendered)
    // Mesmas duas regras do BlogPostCard, que aqui estavam duplicadas e com os
    // mesmos defeitos: tempo de leitura inventado quando falta conteúdo, e
    // fallback de categoria condicionado ao id em vez do resultado do lookup.
    const mins = postReadingTime(post)
    const embedded = ((post._embedded?.['wp:term']?.[0] ?? []) as WPTerm[])[0]
    const mapped = post.categories?.[0] && categoryMap ? categoryMap[post.categories[0]] : undefined
    const cat = mapped ?? (embedded && embedded.slug !== 'uncategorized' ? embedded : undefined)
    const cs = catStyle(cat?.slug)

    return (
        <Link href={`/blog/${post.slug}`}
            className="group flex items-center gap-3.5 overflow-hidden border-t border-border py-3 transition-colors hover:border-accent hover:bg-surface/40">
            {rank !== undefined && (
                <span className="text-[15px] font-black w-5 shrink-0 tabular-nums text-muted/25 group-hover:text-accent/50 transition-colors">
                    {rank}
                </span>
            )}
            {image && (
                <div className="relative overflow-hidden shrink-0 bg-surface" style={{ width: 88, height: 58 }}>
                    <Image src={image.src} alt={title} fill sizes="88px"
                        className="object-cover group-hover:scale-[1.05] transition-transform duration-300" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                {cat && (
                    <span className="px-1.5 py-0.5 font-mono font-bold uppercase tracking-[0.12em] text-[8.5px] whitespace-nowrap mb-1 inline-block"
                        style={{ backgroundColor: cs.bg, color: cs.color }}>
                        {cat.name}
                    </span>
                )}
                <p className="font-serif text-[14px] font-medium leading-[1.1] tracking-[-0.02em] text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                    {title}
                </p>
                <p className="text-[10px] text-muted mt-1 flex items-center gap-1">
                    {mins !== null && <><Clock size={9} /> {mins} min · </>}{formatDatePt(post.date)}
                </p>
            </div>
            <ChevronRight size={14} className="text-muted opacity-0 group-hover:opacity-50 group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>
    )
}
