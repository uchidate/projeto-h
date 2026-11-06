'use client'

import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { WPArtist } from '@/lib/wordpress/types'
import { href } from '@/lib/i18n/routes'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { getWPImage, stripHtml } from '@/lib/utils'

interface Props {
    artists: WPArtist[]
    accent: string
    initialCount?: number
    /** Idioma dos links das fichas. */
    locale?: Locale
    /** Texto do botão de expandir, já no idioma da página. */
    moreLabel?: string
}

export function ExpandableArtistGrid({ artists, accent, initialCount = 16, locale = DEFAULT_LOCALE, moreLabel }: Props) {
    const [expanded, setExpanded] = useState(false)
    const visible = expanded ? artists : artists.slice(0, initialCount)
    const hasMore = artists.length > initialCount

    return (
        <div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {visible.map(artist => {
                    const img = getWPImage(artist._embedded, artist.featured_image_url)
                    const name = stripHtml(artist.title.rendered)
                    return (
                        <Link key={artist.id} href={href('artist', { slug: artist.slug }, locale)} className="group flex flex-col items-center text-center">
                            <div className="relative w-full aspect-square mb-2 overflow-hidden border border-border bg-surface group-hover:border-(--ac) transition-colors">
                                {img ? (
                                    <Image
                                        src={img.src}
                                        alt={name}
                                        fill
                                        className="object-cover object-top group-hover:scale-[1.05] transition-transform duration-500"
                                        sizes="(max-width: 640px) 33vw, 12vw"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-[18px] font-black opacity-20 text-(--ac)">{name[0]}</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-[11px] font-semibold leading-tight group-hover:text-accent transition-colors line-clamp-2">{name}</p>
                            {artist.acf?.name_hangul && (
                                <p className="font-mono text-[10px] text-muted/60 mt-0.5">{artist.acf.name_hangul}</p>
                            )}
                        </Link>
                    )
                })}
            </div>

            {hasMore && !expanded && (
                <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="mt-6 w-full flex items-center justify-center gap-2 border border-border py-3 font-mono text-[11px] font-bold uppercase tracking-wider text-muted hover:border-(--ac) hover:text-(--ac) transition-colors"
                    style={{ '--ac': accent } as React.CSSProperties}
                >
                    <ChevronDown size={13} />
                    {moreLabel ?? `Ver mais ${artists.length - initialCount} artistas`}
                </button>
            )}
        </div>
    )
}
