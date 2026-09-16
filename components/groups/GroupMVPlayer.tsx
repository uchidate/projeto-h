'use client'

import { useTranslations } from 'next-intl'
/* eslint-disable react-hooks/set-state-in-effect -- mini-player state follows viewport position */

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Play, X, Minimize2 } from 'lucide-react'
import { extractYoutubeId } from '@/lib/utils'
import { BlockHeader } from '@/components/blocks/BlockHeader'
import { toRgba } from '@/lib/theme/color'
import { trackVideoPlay } from '@/lib/analytics'

interface VideoItem { title: string; url: string; context?: string; badge?: string }

function YTThumb({ id, title, sizes, className }: { id: string; title: string; sizes: string; className?: string }) {
    const [src, setSrc] = useState(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`)
    return (
        <Image src={src} alt={title} fill sizes={sizes} className={className}
            onError={() => setSrc(`https://img.youtube.com/vi/${id}/hqdefault.jpg`)} />
    )
}

function PlayBtn({ size = 'lg', accent }: { size?: 'lg' | 'sm'; accent: string }) {
    return (
        <div className={`flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${size === 'lg' ? 'h-16 w-16' : 'h-8 w-8'}`}
            style={{ background: toRgba(accent, 0.9) }}>
            <Play className={`text-white fill-white ${size === 'lg' ? 'h-7 w-7 ml-1' : 'h-3.5 w-3.5 ml-0.5'}`} />
        </div>
    )
}

interface Props {
    videos: VideoItem[]
    accent: string
    title?: string
    eyebrow?: string
    description?: string
}

export function GroupMVPlayer({ videos, accent, title: titleProp, eyebrow: eyebrowProp, description }: Props) {
    const tc = useTranslations('client')
    const title = titleProp ?? tc('mv.title')
    const eyebrow = eyebrowProp ?? tc('mv.eyebrow')
    const mvs = videos
        .map(mv => { const id = extractYoutubeId(mv.url); return id ? { ...mv, id } : null })
        .filter((mv): mv is VideoItem & { id: string } => mv !== null)

    const [activeIndex, setActiveIndex] = useState(0)
    // false, não true: com autoplay na aterrissagem o player virava um
    // flutuante de ~230px na primeira rolagem sem nenhuma ação do usuário —
    // medido em print real de viewport 390×844, o rodapé inteiro tomado na
    // chegada da página. Thumbnail estático custa 0px fixos; quem quer
    // assistir toca no play.
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMini, setIsMini] = useState(false)
    const featuredRef = useRef<HTMLDivElement | null>(null)
    const iframeRef = useRef<HTMLIFrameElement | null>(null)

    useEffect(() => {
        if (!isPlaying) { setIsMini(false); return }
        const update = () => {
            const el = featuredRef.current
            if (!el) return
            const { top, bottom } = el.getBoundingClientRect()
            setIsMini(
                (bottom < 100 || top > window.innerHeight - 80) &&
                window.innerWidth >= 360 && window.innerHeight >= 520
            )
        }
        update()
        window.addEventListener('scroll', update, { passive: true })
        window.addEventListener('resize', update)
        return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
    }, [isPlaying, activeIndex])

    // Auto-advance to next video when current ends (YouTube postMessage API)
    useEffect(() => {
        const onMessage = (e: MessageEvent) => {
            if (e.origin !== 'https://www.youtube.com') return
            try {
                const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
                if (data?.event === 'onStateChange' && data?.info === 0) {
                    // state 0 = ended
                    const next = activeIndex + 1
                    if (next < mvs.length) {
                        setActiveIndex(next)
                    } else {
                        setIsPlaying(false)
                        setIsMini(false)
                    }
                }
            } catch { /* ignore */ }
        }
        window.addEventListener('message', onMessage)
        return () => window.removeEventListener('message', onMessage)
    }, [activeIndex, mvs.length])

    const select = (i: number) => { setActiveIndex(i); setIsPlaying(true); setIsMini(false); trackVideoPlay({ plataforma: 'youtube', contexto: title ?? 'mv', posicao: i + 1 }) }
    const close = () => { setIsPlaying(false); setIsMini(false) }

    if (mvs.length === 0) return null
    const featured = mvs[activeIndex]

    return (
        <section id="mvs">
            <BlockHeader title={title} eyebrow={eyebrow} tone="muted"
                icon={<Play className="h-4 w-4" style={{ color: accent }} />}
                meta={<p className="font-mono text-[10px] uppercase tracking-widest text-muted">{tc('mv.count', { count: mvs.length })}</p>} />
            {description && <p className="mb-6 max-w-3xl text-[13px] leading-6 text-muted">{description}</p>}

            {/* Destaque e miniaturas lado a lado a partir de lg. Empilhados, o
                destaque em largura cheia rendia 765px de altura só nele — material
                de consulta ocupando mais tela que a matéria. Em duas colunas o
                bloco cabe numa dobra e a página finalmente usa a largura. */}
            <div className="profile-measure lg:grid lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:items-start lg:gap-4">
            <div ref={featuredRef} className="mb-4 overflow-hidden border border-border bg-black lg:mb-0"
                style={{ borderTopColor: accent, borderTopWidth: 2 }}>
                {isPlaying ? (
                    <div className="relative aspect-video">
                        <div className={isMini
                            ? // Mobile: 228px de largura (~156px de altura com a barra) e bottom
                            // acima da zona da âncora de anúncio (~113px) — o mini nunca cobre
                            // criativo pago (risco de política AdSense, flagrado em print real).
                            'fixed bottom-[124px] right-2 z-260 w-[228px] overflow-hidden border border-white/15 bg-black shadow-2xl sm:bottom-5 sm:right-5 sm:w-[min(420px,calc(100vw-1.5rem))]'
                            : 'absolute inset-0'
                        }>
                            <div className="relative aspect-video">
                                {isMini && (
                                    <div className="absolute left-0 right-0 top-0 z-20 flex h-8 items-center justify-between bg-black/80 px-2.5 text-white">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Minimize2 className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate text-[11px] font-bold">{featured.title}</span>
                                        </div>
                                        <button type="button" onClick={close} aria-label={tc('common.close')}
                                            className="flex h-6 w-6 shrink-0 items-center justify-center text-white/80 hover:text-white">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                                <iframe key={`${featured.id}-${activeIndex}`}
                                    ref={iframeRef}
                                    src={`https://www.youtube.com/embed/${featured.id}?autoplay=1&rel=0&enablejsapi=1`}
                                    className="absolute inset-0 h-full w-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen title={featured.title}
                                />
                                {!isMini && (
                                    <button onClick={close} aria-label={tc('common.close')}
                                        className="touch-target absolute right-3 top-3 z-20 flex min-w-(--tap-target-min) items-center justify-center bg-black/70 text-white transition-colors hover:bg-black">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => { setIsPlaying(true); trackVideoPlay({ plataforma: 'youtube', contexto: title ?? 'mv', posicao: activeIndex + 1 }) }} className="group relative block w-full aspect-video text-left">
                        <YTThumb id={featured.id} title={featured.title} sizes="100vw"
                            className="object-cover brightness-75 group-hover:brightness-90 transition-all duration-300" />
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <PlayBtn size="lg" accent={accent} />
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                            <p className="mb-1 font-mono text-[10px] font-black uppercase leading-4 tracking-widest text-white/70">{featured.badge ?? tc('mv.featured')}</p>
                            <p className="text-base font-black text-white leading-tight">{featured.title}</p>
                            {featured.context && <p className="mt-2 max-w-2xl text-[12px] leading-5 text-white/70">{featured.context}</p>}
                        </div>
                    </button>
                )}
            </div>

            {/* Thumbnails grid */}
            {mvs.length > 1 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                    {mvs.map((mv, i) => {
                        const isActive = i === activeIndex
                        return (
                            <button key={mv.id} onClick={() => select(i)} title={mv.title}
                                className="group relative aspect-video overflow-hidden border bg-black text-left transition-all"
                                style={{ borderColor: isActive ? accent : 'var(--color-border)', borderWidth: isActive ? 2 : 1 }}>
                                <YTThumb id={mv.id} title={mv.title}
                                    sizes="(max-width: 640px) 33vw, 25vw"
                                    className={`object-cover transition-all duration-200 ${isActive ? 'brightness-50' : 'brightness-70 group-hover:brightness-90'}`}
                                />
                                {!isActive && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex h-8 w-8 items-center justify-center bg-black/60">
                                            <Play className="h-3.5 w-3.5 text-white fill-white ml-0.5" />
                                        </div>
                                    </div>
                                )}
                                {isActive && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <PlayBtn size="sm" accent={accent} />
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 to-transparent px-2 py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                                    <p className="text-[10px] font-bold text-white line-clamp-1">{mv.badge ?? mv.title}</p>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}
            </div>
        </section>
    )
}
