'use client'

import { useTranslations } from 'next-intl'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { WPProduction } from '@/lib/wordpress/types'
import { stripHtml, getWPImage } from '@/lib/utils'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'
import { FactGrid, type FactItem } from '@/components/blocks/FactGrid'

interface Props {
    productions: WPProduction[]
    label: string
    accent: string
}


function getYear(prod: WPProduction): number | null {
    if (prod.acf?.year) return prod.acf.year
    const d = prod.acf?.release_date ?? prod.date
    const y = d ? parseInt(d.slice(0, 4)) : null
    return y && y > 1900 ? y : null
}

function getRating(prod: WPProduction): number {
    return prod.acf?.rating ?? 0
}

const INITIAL_COUNT = 10

export function ArtistFilmography({ productions, label, accent }: Props) {
    const tc = useTranslations('client')
    const TYPE_LABEL: Record<string, string> = {
        drama: tc('filmography.type.drama'),
        movie: tc('filmography.type.movie'),
        special: tc('filmography.type.special'),
        variety: tc('filmography.type.variety'),
    }
    const [expanded, setExpanded] = useState(false)
    if (!productions.length) return null

    const sorted = [...productions].sort((a, b) => (getYear(b) ?? 0) - (getYear(a) ?? 0))
    const visible = expanded ? sorted : sorted.slice(0, INITIAL_COUNT)
    const hiddenCount = Math.max(sorted.length - INITIAL_COUNT, 0)
    const latestYear = getYear(sorted[0])
    const typeCounts = sorted.reduce<Record<string, number>>((acc, prod) => {
        const typeLabel = TYPE_LABEL[prod.acf?.type ?? ''] ?? TYPE_LABEL.drama
        acc[typeLabel] = (acc[typeLabel] ?? 0) + 1
        return acc
    }, {})
    const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    const rated = sorted.map(getRating).filter(Boolean)
    const avgRating = rated.length ? rated.reduce((sum, rating) => sum + rating, 0) / rated.length : null
    const summaryItems: FactItem[] = [
        { label: tc('filmography.inCatalog'), value: tc('filmography.worksCount', { count: productions.length }) },
        latestYear && { label: tc('filmography.latest'), value: latestYear },
        dominantType && { label: tc('filmography.focus'), value: dominantType },
        avgRating && { label: tc('filmography.average'), value: `★ ${avgRating.toFixed(1)}` },
    ].filter(Boolean) as FactItem[]

    return (
        <>
            <div className="mb-6 border-t pt-5 profile-measure" style={{ borderColor: `${accent}33` }}>
                <SectionTitleBar eyebrow={label} title={tc('filmography.title')} />
            </div>

            <div className="mb-6 grid gap-4 profile-measure lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)]">
                <p className="max-w-[62ch] text-[0.98rem] leading-7 text-foreground-subtle">
                    {tc('filmography.intro')}
                </p>
                <FactGrid items={summaryItems} columns={2} />
            </div>

            {/* Desktop — tabela */}
            <div className="hidden sm:block profile-measure">
                <div className="profile-panel overflow-hidden">
                <div className="grid border-b border-border/70 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
                    style={{ gridTemplateColumns: '64px 2fr 1fr 120px 48px' }}>
                    <span>{tc('filmography.year')}</span>
                    <span>{tc('filmography.titleCol')}</span>
                    <span>{tc('filmography.typeCol')}</span>
                    <span>{tc('filmography.rating')}</span>
                    <span className="text-right">★</span>
                </div>
                {visible.map(prod => {
                    const rating = getRating(prod)
                    const year = getYear(prod)
                    const title = stripHtml(prod.title.rendered)
                    const typeLabel = TYPE_LABEL[prod.acf?.type ?? ''] ?? TYPE_LABEL.drama
                    return (
                        <Link key={prod.id} href={`/productions/${prod.slug}`}
                            className="group grid items-center border-b border-border/50 px-4 py-3.5 text-[14px] transition-colors last:border-b-0 hover:bg-white dark:hover:bg-surface"
                            style={{ gridTemplateColumns: '64px 2fr 1fr 120px 48px' }}>
                            <span className="font-mono text-[13px] text-muted">{year ?? '-'}</span>
                            <span className="font-semibold text-foreground group-hover:text-accent transition-colors pr-4 min-w-0">
                                <span className="block truncate">{title}</span>
                                {prod.acf?.original_title && (
                                    <span className="block truncate text-[11px] font-normal text-muted">{prod.acf.original_title}</span>
                                )}
                            </span>
                            <span className="text-muted text-[12px] pr-4">{typeLabel}</span>
                            <span className="flex items-center gap-2 pr-4">
                                <span className="flex-1 h-1 bg-border overflow-hidden">
                                    <span className="block h-full"
                                        style={{
                                            width: `${Math.min((rating / 10) * 100, 100)}%`,
                                            background: rating >= 8 ? accent : '#0a0a0a',
                                        }} />
                                </span>
                            </span>
                            <span className="text-right font-mono font-semibold text-[13px]">
                                {rating > 0 ? rating.toFixed(1) : '-'}
                            </span>
                        </Link>
                    )
                })}
                </div>
            </div>

            {/* Mobile — lista com poster */}
            <div className="profile-panel flex flex-col sm:hidden">
                {visible.map(prod => {
                    const rating = getRating(prod)
                    const year = getYear(prod)
                    const title = stripHtml(prod.title.rendered)
                    const typeLabel = TYPE_LABEL[prod.acf?.type ?? ''] ?? TYPE_LABEL.drama
                    const img = getWPImage(prod._embedded, prod.featured_image_url)
                    return (
                        <Link key={prod.id} href={`/productions/${prod.slug}`}
                            className="touch-target group flex items-center gap-3 border-b border-border/50 p-3 last:border-b-0">
                            <div className="relative w-10 h-[54px] shrink-0 overflow-hidden bg-surface">
                                {img && (
                                    <Image src={img.src} alt={title} fill sizes="40px" className="object-cover" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-[14px] text-foreground group-hover:text-accent transition-colors truncate">{title}</p>
                                <p className="font-mono text-[11px] text-muted">
                                    {year} · {typeLabel}
                                    {rating > 0 ? ` · ★ ${rating.toFixed(1)}` : ''}
                                </p>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {hiddenCount > 0 && (
                <div className="mt-6">
                    <button type="button" onClick={() => setExpanded(v => !v)}
                        className="touch-target inline-flex items-center gap-1 border border-border px-4 py-2 font-mono text-[11px] text-muted transition-colors hover:text-foreground">
                        {expanded ? tc('filmography.showLess') : tc('filmography.showAll', { count: productions.length })}
                    </button>
                </div>
            )}
        </>
    )
}
