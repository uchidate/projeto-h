import Image from 'next/image'
import Link from 'next/link'
import { Clock, ChevronRight } from 'lucide-react'
import type { WPPost, WPTerm } from '@/lib/wordpress/types'
import { getWPImage, stripHtml, formatDatePt } from '@/lib/utils'
import { catStyle, postReadingTime } from '@/lib/blog/catStyle'

export function BlogPostCard({ post, priority, categoryMap }: { post: WPPost; priority?: boolean; categoryMap?: Record<number, { name: string; slug: string }> }) {
    const image = getWPImage(post._embedded, post.featured_image_url)
    const title = stripHtml(post.title.rendered)
    const excerpt = stripHtml(post.excerpt.rendered).slice(0, 110)
    const mins = postReadingTime(post)
    /* O fallback para `_embedded` nunca rodava: a condição olhava se existe um
       id de categoria, não se o lookup achou algo. Post com id fora do mapa
       caía em `undefined` e ficava sem selo, mesmo tendo o termo embutido na
       resposta. Agora o fallback vale quando a busca falha, que era a intenção.

       Continua sem selo o post cuja única categoria é "uncategorized" — ela é
       removida de propósito em getCategories, e exibir "Sem categoria" seria
       pior que não exibir nada. Isso é lacuna editorial, não de layout. */
    const embedded = ((post._embedded?.['wp:term']?.[0] ?? []) as WPTerm[])[0]
    const mapped = post.categories?.[0] && categoryMap ? categoryMap[post.categories[0]] : undefined
    const fallback = embedded && embedded.slug !== 'uncategorized' ? embedded : undefined
    const cat = mapped ?? fallback
    const cs = catStyle(cat?.slug)

    return (
        <Link href={`/blog/${post.slug}`}
            className="group flex h-full flex-col border-t border-border pt-3 transition-colors duration-300 hover:border-accent">
            <div className="relative aspect-4/3 overflow-hidden bg-surface shrink-0">
                {image ? (
                    <Image src={image.src} alt={image.alt || title} fill priority={priority}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                ) : (
                    <div className="h-full" style={{ background: `linear-gradient(135deg, ${cs.bg}, ${cs.color}33)` }} />
                )}
                {/* O selo "Novo" saiu. A listagem é ordenada por data, então a
                    posição já diz o que ele dizia — e com a cadência atual de
                    publicação a janela de 7 dias marcava 8 dos 9 cards da
                    primeira página. Um destaque que quase todos têm não destaca
                    ninguém, só cobre a foto. `isRecent` continua exportada para
                    quem precisar da regra fora de um contexto cronológico. */}
            </div>
            <div className="flex flex-1 flex-col gap-2 pt-3">
                {cat && (
                    <span className="self-start px-2 py-0.5 font-mono font-bold uppercase tracking-[0.12em] text-[9.5px] whitespace-nowrap"
                        style={{ backgroundColor: cs.bg, color: cs.color }}>
                        {cat.name}
                    </span>
                )}
                <h2 className="font-serif text-[15px] sm:text-[17px] font-medium leading-[1.08] tracking-tight text-foreground line-clamp-2 group-hover:text-accent transition-colors flex-1">
                    {title}
                </h2>
                {excerpt && <p className="text-[12px] text-muted line-clamp-2 leading-relaxed">{excerpt}</p>}
                <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
                    <div className="flex items-center gap-2 text-[10px] text-muted">
                        <span>{formatDatePt(post.date)}</span>
                        {mins !== null && <span className="flex items-center gap-1"><Clock size={9} /> {mins} min</span>}
                    </div>
                    <ChevronRight size={12} className="text-muted opacity-0 group-hover:opacity-60 group-hover:text-accent transition-all shrink-0" />
                </div>
            </div>
        </Link>
    )
}
