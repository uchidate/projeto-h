import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import type { WPPost, WPTerm } from '@/lib/wordpress/types'
import { getWPImage, stripHtml, formatDatePt, readingTime } from '@/lib/utils'
import { catStyle } from '@/lib/blog/catStyle'

/**
 * Destaque em cartão de imagem com o texto sobre um degradê no rodapé: a foto é a protagonista e o
 * cartão não fica achatado (≈1,55:1 no desktop; 340px de altura no celular).
 */
export function BlogHeroCompacto({ post, categoryMap, priority = false }: { post: WPPost; categoryMap?: Record<number, { name: string; slug: string }>; priority?: boolean }) {
    const image = getWPImage(post._embedded, post.featured_image_url)
    const title = stripHtml(post.title.rendered)
    const mins = post.acf?.reading_time ?? readingTime(post.content?.rendered ?? '')
    const cat = post.categories?.[0] && categoryMap
        ? categoryMap[post.categories[0]]
        : ((post._embedded?.['wp:term']?.[0] ?? []) as WPTerm[])[0]
    const cs = catStyle(cat?.slug)

    return (
        <Link href={`/blog/${post.slug}`} className="group relative block h-[340px] overflow-hidden bg-surface sm:h-[400px] md:h-[440px] lg:h-[460px]">
            {image ? (
                <Image src={image.src} alt={title} fill priority={priority} fetchPriority={priority ? 'high' : undefined}
                    sizes="(max-width: 1024px) 100vw, 720px"
                    className="object-cover object-[center_25%] transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none" />
            ) : (
                <div className="h-full" style={{ background: `linear-gradient(135deg, ${cs.bg}, ${cs.color}55)` }} />
            )}
            <div aria-hidden className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />
            <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-5">
                <div className="mb-2.5 flex items-center gap-2.5">
                    <span className="px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.1em]" style={{ backgroundColor: cs.bg, color: cs.color }}>{cat?.name ?? 'Capa'}</span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Destaque</span>
                </div>
                <h2 className="font-serif text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground transition-colors group-hover:text-accent sm:text-[30px] lg:text-[34px]">{title}</h2>
                <p className="mt-2 flex items-center gap-3 text-[12px] text-foreground/75 sm:text-[13px]">
                    {formatDatePt(post.date)}
                    <span className="flex items-center gap-1"><Clock size={11} /> {mins} min</span>
                </p>
            </div>
        </Link>
    )
}
