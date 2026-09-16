'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'
import type { ShowsByPlatform } from '@/lib/tmdb/streaming'
import { STREAMING_PLATFORMS, PLATFORM_ORDER } from '@/lib/tmdb/streaming'

interface Props {
    showsByPlatform: ShowsByPlatform
}

// Mapeia chaves do TMDB (lib/tmdb/streaming.ts) para os slugs aceitos pelo
// filtro oc_platform em plugin de CPTs do WordPress (que usa nomes de hub, não TMDB)
const PLATFORM_FILTER_SLUG: Record<string, string> = {
    netflix_br: 'netflix',
    disney_br: 'disney-plus',
    prime_br: 'amazon-prime-video',
    apple_br: 'apple-tv',
}

export function HomeStreamingTop({ showsByPlatform }: Props) {
    const available = PLATFORM_ORDER.filter(p => (showsByPlatform[p]?.length ?? 0) > 0)
    const [active, setActive] = useState<string>(available[0] ?? '')

    if (available.length === 0) return null

    const shows = showsByPlatform[active] ?? []
    const cfg = STREAMING_PLATFORMS[active]

    return (
        <div className="border-t border-border">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-10">
                <Link
                    href={`/productions?platform=${PLATFORM_FILTER_SLUG[active] ?? active}`}
                    className="shrink-0 font-mono text-[9px] font-black uppercase tracking-[0.15em] text-foreground/50 transition-colors hover:text-foreground"
                >
                    Top 10 nos Streamings
                </Link>
                <div className="flex min-w-0 items-center gap-1 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
                    {available.map(platform => {
                        const c = STREAMING_PLATFORMS[platform]
                        const isActive = platform === active
                        return (
                            <button
                                key={platform}
                                type="button"
                                onClick={() => setActive(platform)}
                                aria-label={`Mostrar ranking da ${c.label}`}
                                aria-pressed={isActive}
                                className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors"
                                style={isActive
                                    ? { color: c.textHex, backgroundColor: `${c.hex}18` }
                                    : { color: 'var(--color-muted)' }
                                }
                            >
                                <span
                                    className="h-2 w-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: c.hex }}
                                />
                                <span className={isActive ? 'inline whitespace-nowrap' : 'hidden whitespace-nowrap sm:inline'}>{c.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Mobile: trilho legível; desktop: panorama completo das dez posições. */}
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-5 scrollbar-none [&::-webkit-scrollbar]:hidden sm:px-6 lg:grid lg:grid-cols-10 lg:gap-2 lg:overflow-visible lg:px-10 lg:pb-4">
                {shows.slice(0, 10).map(show => {
                    const inner = (
                        <div className="group flex w-[112px] flex-col items-center gap-1.5 sm:w-[124px] lg:w-auto">
                            <div className="relative w-full aspect-2/3 overflow-hidden bg-surface">
                                {show.posterUrl ? (
                                    <Image
                                        src={show.posterUrl}
                                        alt={show.title}
                                        fill
                                        className="object-cover"
                                    sizes="(max-width: 640px) 112px, (max-width: 1024px) 124px, 10vw"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-[9px] font-bold text-muted">
                                        {show.title[0]}
                                    </div>
                                )}
                                <span
                                    className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center text-[10px] font-black text-white"
                                    style={{ backgroundColor: cfg.hex, lineHeight: 1 }}
                                >
                                    {show.rank}
                                </span>
                                {show.rating != null && show.rating > 0 && (
                                    <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-black/70 px-1 py-0.5 text-[8px] font-bold text-yellow-400">
                                        <Star size={7} fill="currentColor" />
                                        {show.rating.toFixed(1)}
                                    </span>
                                )}
                            </div>
                            <p className="w-full text-center text-[11px] font-semibold leading-tight text-foreground line-clamp-2 group-hover:text-accent transition-colors lg:text-[9px]">
                                {show.title}
                            </p>
                        </div>
                    )

                    return show.productionSlug ? (
                        <Link key={show.tmdbId} href={`/productions/${show.productionSlug}`} className="shrink-0 snap-start lg:min-w-0">
                            {inner}
                        </Link>
                    ) : (
                        <div key={show.tmdbId} className="shrink-0 snap-start lg:min-w-0">{inner}</div>
                    )
                })}
            </div>
        </div>
    )
}
