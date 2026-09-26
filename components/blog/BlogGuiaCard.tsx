import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import type { WPPost } from '@/lib/wordpress/types'
import { getWPImage, stripHtml, formatDatePt, readingTime } from '@/lib/utils'
import { catStyle } from '@/lib/blog/catStyle'

/** Cartão de conteúdo-chave: com imagem mostra a foto; sem ela (muitos guias não têm) o texto ocupa o lugar, sem quadrado vazio. */
export function BlogGuiaCard({ post, categoryMap }: { post: WPPost; categoryMap: Record<number, { name: string; slug: string }> }) {
    const image = getWPImage(post._embedded, post.featured_image_url)
    const titulo = stripHtml(post.title.rendered)
    const resumo = stripHtml(post.excerpt?.rendered ?? '').slice(0, 130)
    const cat = post.categories?.[0] ? categoryMap[post.categories[0]] : undefined
    const cs = catStyle(cat?.slug)
    const mins = post.acf?.reading_time ?? readingTime(post.content?.rendered ?? '')
    return (
        <Link href={`/blog/${post.slug}`} className="group flex flex-col border border-border bg-surface transition-colors hover:border-accent/60">
            {image && (
                <span className="relative block aspect-16/10 overflow-hidden bg-background">
                    <Image src={image.src} alt="" fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />
                </span>
            )}
            <span className="flex flex-1 flex-col p-4">
                {cat && <span className="mb-2 self-start px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em]" style={{ backgroundColor: cs.bg, color: cs.color }}>{cat.name}</span>}
                <span className="font-serif text-[19px] font-semibold leading-tight text-foreground transition-colors group-hover:text-accent">{titulo}</span>
                {resumo && <span className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted">{resumo}</span>}
                <span className="mt-auto flex items-center gap-3 pt-3 text-[11px] text-muted">
                    {formatDatePt(post.date)}
                    <span className="flex items-center gap-1"><Clock size={10} /> {mins} min</span>
                </span>
            </span>
        </Link>
    )
}
