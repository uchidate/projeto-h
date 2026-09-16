import { useLocale } from 'next-intl'
import { labelsFor } from '@/lib/i18n/labels'
import Image from 'next/image'
import Link from 'next/link'
import type { WPArtist } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'

interface Props {
    artist: WPArtist
    priority?: boolean
    sizes?: string
    aspectRatio?: string
    showRole?: boolean
    variant?: 'default' | 'catalog'
    /** Some quando a própria ordenação já comunica destaque (aba "Em alta"). */
    showTrendingBadge?: boolean
}

function nameToGradient(name: string): string {
    let h = 0
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
    const hue = Math.abs(h) % 360
    return `linear-gradient(135deg, hsl(${hue},60%,18%) 0%, hsl(${(hue + 40) % 360},50%,12%) 100%)`
}

export function ArtistCard({ artist, priority, sizes = '(max-width: 640px) 33vw, 20vw', aspectRatio = 'aspect-3/4', showRole = true, variant = 'default', showTrendingBadge = true }: Props) {
    const labels = labelsFor(useLocale())
    const image = getWPImage(artist._embedded, artist.featured_image_url)
    const name = stripHtml(artist.title.rendered)
    const roles = (artist.acf?.roles as string[] | undefined)?.map(labels.role) ?? []
    const isTrending = showTrendingBadge && (artist.acf?.trending_score ?? 0) >= 50

    if (variant === 'catalog') {
        return (
            <Link href={`/artists/${artist.slug}`} className="group flex flex-col">
                <div className="relative aspect-3/4 overflow-hidden bg-surface">
                    {image ? (
                        <Image src={image.src} alt={image.alt || name} fill priority={priority}
                            className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                            sizes={sizes} />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center" style={{ background: nameToGradient(name) }}>
                            <span className="select-none text-[64px] font-black leading-none text-white/15">
                                {artist.acf?.name_hangul?.slice(0, 2) ?? name[0]?.toUpperCase() ?? '?'}
                            </span>
                        </div>
                    )}
                    {isTrending && (
                        <span className="absolute left-2 top-2 bg-accent-a11y px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white">
                            ● top
                        </span>
                    )}
                </div>
                <div className="min-w-0 border-b border-border/50 pb-3 pt-2.5">
                    <div className="flex items-baseline justify-between gap-1">
                        <span className="truncate text-[13px] font-semibold leading-tight text-foreground transition-colors group-hover:text-accent">{name}</span>
                        {artist.acf?.name_hangul && <span className="shrink-0 font-mono text-[10px] text-muted">{artist.acf.name_hangul}</span>}
                    </div>
                    {showRole && roles.length > 0 && (
                        <div className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.04em] text-muted">{roles[0]}</div>
                    )}
                </div>
            </Link>
        )
    }

    return (
        <Link href={`/artists/${artist.slug}`} className="group flex flex-col items-center text-center">
            <div className={`relative w-full ${aspectRatio} overflow-hidden bg-surface mb-2`}
                style={{ background: 'repeating-linear-gradient(135deg, #f0f0f0 0 10px, #e8e8e8 10px 20px)' }}>
                {image ? (
                    <Image src={image.src} alt={image.alt || name} fill priority={priority} sizes={sizes}
                        className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-500" />
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <span className="text-[32px] font-black text-accent/30">{name[0]}</span>
                    </div>
                )}
            </div>
            <p className="text-[12px] font-semibold leading-tight text-foreground group-hover:text-accent transition-colors line-clamp-2">
                {name}
            </p>
            {artist.acf?.name_hangul && (
                <p className="font-mono text-[10px] text-muted mt-0.5">{artist.acf.name_hangul}</p>
            )}
            {showRole && roles.length > 0 && (
                <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-wide text-muted/60">{roles[0]}</p>
            )}
        </Link>
    )
}
