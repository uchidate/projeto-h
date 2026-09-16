import { useLocale } from 'next-intl'
import { labelsFor } from '@/lib/i18n/labels'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Film, Tv } from 'lucide-react'
import type { WPProduction } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'

interface Props {
    production: WPProduction
    priority?: boolean
    sizes?: string
    aspectRatio?: string
    variant?: 'default' | 'catalog'
    genreMap?: Record<number, string>
}

export function ProductionCard({ production, priority, sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw', aspectRatio = 'aspect-2/3', variant = 'default', genreMap = {} }: Props) {
    const labels = labelsFor(useLocale())
    const image = getWPImage(production._embedded, production.featured_image_url)
    const title = stripHtml(production.title.rendered)
    const acf = production.acf ?? {}

    if (variant === 'catalog') {
        const firstGenre = (production.production_genre ?? [])[0]
        return (
            <Link href={`/productions/${production.slug}`} className="group flex flex-col">
                <div className="relative mb-3 aspect-2/3 overflow-hidden bg-surface">
                    {image ? (
                        <Image src={image.src} alt="" fill priority={priority} fetchPriority={priority ? 'high' : undefined} sizes={sizes}
                            className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted/30"><Film size={40} /></div>
                    )}
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/30" />
                    {acf.rating != null && (
                        <div className="absolute right-2 top-2 flex items-center gap-0.5 bg-black/70 px-1.5 py-0.5 text-[11px] font-bold text-gold backdrop-blur-xs">
                            <Star size={9} fill="currentColor" />{Number(acf.rating).toFixed(1)}
                        </div>
                    )}
                    {acf.type && (
                        <div className="absolute left-2 top-2 flex items-center gap-1 bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white/80 backdrop-blur-xs">
                            {acf.type === 'movie' ? <Film size={10} /> : <Tv size={10} />}{labels.productionType(acf.type)}
                        </div>
                    )}
                    {acf.age_rating && (
                        <div className="absolute bottom-2 left-2 rounded-sm bg-foreground/90 px-1 py-0.5 text-[9px] font-black text-background">{acf.age_rating}</div>
                    )}
                </div>
                <h2 className="line-clamp-2 text-[13px] font-bold leading-snug text-foreground transition-colors group-hover:text-accent">{title}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {acf.year && <span className="text-[11px] text-muted">{acf.year}</span>}
                    {firstGenre && genreMap[firstGenre] && <><span className="text-muted/30">·</span><span className="text-[11px] text-muted">{genreMap[firstGenre]}</span></>}
                </div>
            </Link>
        )
    }

    return (
        <Link href={`/productions/${production.slug}`} className="group flex flex-col">
            <div className={`relative ${aspectRatio} overflow-hidden bg-surface mb-2`}>
                {image ? (
                    <Image src={image.src} alt="" fill priority={priority} fetchPriority={priority ? 'high' : undefined} sizes={sizes}
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                ) : (
                    <div className="h-full flex items-center justify-center bg-surface">
                        <Film size={28} className="text-muted/30" />
                    </div>
                )}
                {acf.rating != null && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">
                        <Star size={8} fill="currentColor" /> {Number(acf.rating).toFixed(1)}
                    </div>
                )}
                {acf.type && (
                    <div className="absolute top-2 right-2 bg-foreground/80 text-background font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 flex items-center gap-0.5">
                        {acf.type === 'movie' ? <Film size={8} /> : <Tv size={8} />}
                        {labels.productionType(acf.type)}
                    </div>
                )}
            </div>
            <p className="text-[12px] font-semibold leading-snug line-clamp-2 group-hover:text-accent transition-colors">{title}</p>
            {acf.year && <p className="font-mono text-[10px] text-muted mt-0.5">{acf.year}</p>}
        </Link>
    )
}
