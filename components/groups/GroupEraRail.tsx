'use client'

import { useTranslations } from 'next-intl'

import { useRef, useState } from 'react'
import Image from 'next/image'
import type { WPGroup } from '@/lib/wordpress/types'

type Chapter = NonNullable<NonNullable<WPGroup['acf']>['story_chapters']>[number]

interface Props {
    chapters: Chapter[]
    accent: string
    groupName: string
}

/** Galeria horizontal de eras — navegação visual com progresso estilo "stories". */
export function GroupEraRail({ chapters, accent, groupName }: Props) {
    const tc = useTranslations('client')
    const eras = chapters
        .map((chapter, index) => ({ chapter, index }))
        .filter(({ chapter }) => Boolean(chapter.visual_url))

    const trackRef = useRef<HTMLDivElement | null>(null)
    const ticking = useRef(false)
    const [progress, setProgress] = useState(0)

    if (eras.length < 2) return null

    const handleScroll = () => {
        if (ticking.current) return
        ticking.current = true
        requestAnimationFrame(() => {
            const el = trackRef.current
            if (el) {
                const max = el.scrollWidth - el.clientWidth
                setProgress(max > 0 ? el.scrollLeft / max : 0)
            }
            ticking.current = false
        })
    }

    return (
        <div className="overflow-hidden border border-border bg-surface">
            <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
                <div>
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: accent }}>{tc('eras.title')}</p>
                    <p className="mt-1 text-sm font-bold text-foreground/75">{tc('profile.erasOf', { name: groupName })}</p>
                </div>
                <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.12em] text-muted">{tc('common.swipe')}</span>
            </div>

            {/* Indicador estilo "stories": um segmento por era, preenchendo conforme o scroll */}
            <div className="flex gap-1 px-5 pt-3 sm:px-6">
                {eras.map(({ index }) => {
                    const fill = Math.max(0, Math.min(1, progress * eras.length - eras.findIndex(e => e.index === index)))
                    return (
                        <span key={`dot-${index}`} className="h-[3px] flex-1 overflow-hidden rounded-full bg-border">
                            <span className="block h-full rounded-full transition-[width] duration-150 ease-out" style={{ width: `${fill * 100}%`, background: accent }} />
                        </span>
                    )
                })}
            </div>

            <div
                ref={trackRef}
                onScroll={handleScroll}
                className="no-scrollbar flex snap-x snap-mandatory gap-px overflow-x-auto bg-border p-5 pt-3 sm:p-6 sm:pt-3"
            >
                {eras.map(({ chapter, index }) => (
                    <a
                        // O índice entra na key porque dois capítulos podem dividir o
                        // mesmo período (ex: dois lançamentos em 2025) — só o período
                        // gerava key duplicada e aviso de children com mesma chave.
                        key={`${index}-${chapter.period}-rail`}
                        href={`#era-${index}`}
                        className="group/era relative min-w-[168px] shrink-0 snap-start overflow-hidden bg-foreground sm:min-w-[200px]"
                    >
                        <figure className="relative aspect-square overflow-hidden bg-black">
                            {/* A maioria das capas oficiais é quadrada — a moldura acompanha, sem corte nem blur de preenchimento */}
                            <Image
                                src={chapter.visual_url!}
                                alt={chapter.visual_alt || chapter.title}
                                fill
                                className="object-cover object-center grayscale transition-all duration-500 group-hover/era:scale-105 group-hover/era:grayscale-0 motion-reduce:transition-none"
                                sizes="200px"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-black/55 p-3.5 backdrop-blur-xs">
                                <span className="block font-mono text-[8px] font-black uppercase tracking-[0.12em] text-white/60 transition-colors group-hover/era:text-white">
                                    {chapter.period}
                                </span>
                                <span className="mt-1 block text-[13px] font-black leading-tight text-white">{chapter.title}</span>
                            </div>
                            <span
                                aria-hidden="true"
                                className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full opacity-0 transition-opacity group-hover/era:opacity-100"
                                style={{ background: accent }}
                            />
                        </figure>
                    </a>
                ))}
            </div>
        </div>
    )
}
