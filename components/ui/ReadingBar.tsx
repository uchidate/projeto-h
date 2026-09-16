'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Check, ChevronLeft, Share2 } from 'lucide-react'
import { ShareBar } from '@/components/ui/ShareBar'
import { BarraAncorada } from '@/components/ui/BarraAncorada'

interface Anchor { href: string; label: string }

interface Props {
    backHref: string
    backLabel: string
    tagLabel?: string
    tagColor?: string
    tagHref?: string
    title: string
    pageUrl: string
    scrollThreshold?: number
    pageAnchors?: Anchor[]
    actions?: ReactNode
}

export function ReadingBar({ backHref, backLabel, tagLabel, tagColor, tagHref, title, pageUrl, scrollThreshold = 220, pageAnchors = [], actions }: Props) {
    const tc = useTranslations('client')
    const t = useTranslations('client.readingBar')
    const [progress, setProgress] = useState(0)
    const [visible, setVisible] = useState(false)
    const [activeAnchor, setActiveAnchor] = useState<string>('')
    const [shared, setShared] = useState(false)
    const navRef = useRef<HTMLDivElement>(null)
    const barraRef = useRef<HTMLDivElement>(null)

    const onScroll = useCallback(() => {
        const el = document.documentElement
        const total = el.scrollHeight - el.clientHeight
        setProgress(total > 0 ? Math.min(100, (el.scrollTop / total) * 100) : 0)
        setVisible(el.scrollTop > scrollThreshold)
    }, [scrollThreshold])

    useEffect(() => {
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [onScroll])

    /**
     * Publica a altura desta barra em `--reading-bar-h`.
     *
     * Quatro componentes já liam essa variável — as fichas de grupo e fandom, o
     * calendário e a barra lateral do blog — mas NINGUÉM a definia: todos caíam
     * no fallback de 42px, um número chutado que ninguém media. Quando a barra
     * some, o valor tem que ir a zero, senão o que vem abaixo fica com um vão.
     *
     * Mesmo contrato do `--site-header-h`: quem ocupa espaço fixo publica sua
     * altura, e quem se posiciona abaixo lê — em vez de cada um adivinhar.
     */
    useEffect(() => {
        const raiz = document.documentElement
        const barra = barraRef.current
        if (!barra) return
        const atualizar = () => {
            raiz.style.setProperty(
                '--reading-bar-h',
                visible ? `${Math.ceil(barra.getBoundingClientRect().height)}px` : '0px',
            )
        }
        atualizar()
        const ro = new ResizeObserver(atualizar)
        ro.observe(barra)
        return () => {
            ro.disconnect()
            raiz.style.removeProperty('--reading-bar-h')
        }
    }, [visible])

    // Track active section via IntersectionObserver
    useEffect(() => {
        if (pageAnchors.length === 0) return
        const ids = pageAnchors.map(a => a.href.replace('#', ''))
        const elements = ids.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[]
        if (elements.length === 0) return

        // Persistent map so every callback sees the full picture, not just changed entries
        const visibilityMap = new Map<string, boolean>()
        elements.forEach(el => visibilityMap.set(el.id, false))

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(e => visibilityMap.set(e.target.id, e.isIntersecting))
                // Always pick the first section in DOM order that's in the active zone
                const first = elements.find(el => visibilityMap.get(el.id))
                if (first) setActiveAnchor('#' + first.id)
            },
            { rootMargin: '-10% 0px -60% 0px', threshold: 0 }
        )
        elements.forEach(el => observer.observe(el))
        return () => observer.disconnect()
    }, [pageAnchors])

    // Scroll active anchor into view in the nav bar
    useEffect(() => {
        if (!activeAnchor || !navRef.current) return
        const btn = navRef.current.querySelector(`[data-anchor="${activeAnchor}"]`) as HTMLElement | null
        if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }, [activeAnchor])

    const hasAnchors = pageAnchors.length > 0
    const selectedAnchor = activeAnchor || pageAnchors[0]?.href || ''

    const navigateToAnchor = (href: string) => {
        const target = document.getElementById(href.replace('#', ''))
        if (!target) return
        window.history.replaceState(null, '', href)
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setActiveAnchor(href)
    }

    const sharePage = async () => {
        try {
            if (navigator.share) await navigator.share({ title, url: pageUrl })
            else await navigator.clipboard.writeText(pageUrl)
            setShared(true)
            window.setTimeout(() => setShared(false), 2000)
        } catch { /* cancelamento ou clipboard indisponível: mantém a barra estável */ }
    }

    return (
        <BarraAncorada
            posicao="fixed"
            z={320}
            className="left-1/2 -translate-x-1/2 w-full max-w-[1440px]"
        >
        <div
            ref={barraRef}
            // Ponto de apoio estável para o teste. `container.firstChild`
            // dependia de a barra ser o primeiro nó, e quebrou assim que o
            // ancoramento virou um invólucro — teste medindo posição no DOM
            // em vez do que ele quer afirmar.
            data-reading-bar=""
            className={`
                w-full motion-reduce:transition-none
                flex flex-col
                bg-white border-b border-border/50 dark:bg-background
                transition-[opacity,transform] duration-200 ease-out
                ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}
            `}
        >
            {/* Barra de progresso */}
            <div className="h-[2px] bg-border/30">
                <div
                    className="h-full bg-accent transition-[width] duration-75 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Mobile/tablet: contexto, seção e compartilhamento em uma faixa. */}
            <div className="page-wrap flex touch-target w-full min-w-0 items-center gap-2 lg:hidden">
                <Link
                    href={backHref}
                    className="touch-target flex min-w-0 items-center gap-1 text-[12px] font-bold text-foreground transition-colors hover:text-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label={tc('readingBar.back', { label: backLabel })}
                >
                    <ChevronLeft className="shrink-0" size={14} />
                    <span className="max-w-20 truncate">{title}</span>
                </Link>

                {hasAnchors && (
                    <label className="min-w-0 flex-1">
                        <span className="sr-only">{t('jumpToSection')}</span>
                        <select
                            value={selectedAnchor}
                            onChange={event => navigateToAnchor(event.target.value)}
                            className="touch-target w-full min-w-0 cursor-pointer truncate border border-border bg-background px-3 font-mono text-[10px] font-black uppercase tracking-widest text-foreground transition-colors hover:border-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                            aria-label={t('jumpToSection')}
                        >
                            {pageAnchors.map(anchor => <option key={anchor.href} value={anchor.href}>{anchor.label}</option>)}
                        </select>
                    </label>
                )}

                <button
                    type="button"
                    onClick={sharePage}
                    className="touch-target flex min-w-(--tap-target-min) shrink-0 items-center justify-center border border-border text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent active:bg-surface"
                    aria-label={shared ? t('shared') : t('share')}
                >
                    {shared ? <Check size={15} /> : <Share2 size={16} />}
                </button>
            </div>

            {/* Desktop · linha 1: back + título + share */}
            <div className="page-wrap hidden touch-target w-full min-w-0 items-center gap-3 lg:flex">
                <Link
                    href={backHref}
                    className="touch-target flex shrink-0 items-center gap-1 font-mono text-[11px] font-bold text-muted transition-colors hover:text-foreground"
                >
                    <ChevronLeft size={13} />
                    <span className="hidden sm:inline">{backLabel}</span>
                </Link>

                {tagLabel && (
                    <>
                        <span className="text-border/50 text-[11px] shrink-0 hidden sm:inline">|</span>
                        {tagHref ? (
                            <Link href={tagHref}
                                className="hidden shrink-0 font-mono text-[10px] font-black uppercase tracking-widest transition-opacity hover:opacity-80 sm:inline"
                                style={{ color: tagColor ?? 'inherit' }}>
                                {tagLabel}
                            </Link>
                        ) : (
                            <span
                                className="hidden shrink-0 font-mono text-[10px] font-black uppercase tracking-widest sm:inline"
                                style={{ color: tagColor ?? 'inherit' }}>
                                {tagLabel}
                            </span>
                        )}
                    </>
                )}

                <span className="text-border/50 text-[11px] shrink-0 hidden sm:inline">|</span>

                <span className="min-w-0 flex-1 truncate text-[12px] font-bold tracking-[-0.01em] text-foreground/80">
                    {title}
                </span>

                <div className="flex shrink-0 items-center gap-1">
                    {actions}
                    <div className="origin-right">
                        <ShareBar url={pageUrl} title={title} showLabel={false} />
                    </div>
                </div>
            </div>

            {/* Desktop · linha 2: section anchors */}
            {hasAnchors && (
                <div
                    ref={navRef}
                    className="hidden items-center gap-1 overflow-x-auto border-t border-border/40 px-[max(1rem,calc((100vw-1200px)/2))] py-1 scrollbar-none lg:flex"
                >
                    {pageAnchors.map(anchor => {
                        const isActive = activeAnchor === anchor.href
                        return (
                            <a
                                key={anchor.href}
                                href={anchor.href}
                                data-anchor={anchor.href}
                                className={`
                                    touch-target flex shrink-0 items-center rounded-full px-3.5 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.12em]
                                    border transition-colors duration-150 whitespace-nowrap
                                    ${isActive
                                        ? 'border-accent/35 bg-white text-accent shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:bg-surface'
                                        : 'border-transparent text-muted hover:border-border/70 hover:bg-white hover:text-foreground dark:hover:bg-surface'}
                                `}
                            >
                                {anchor.label}
                            </a>
                        )
                    })}
                </div>
            )}
        </div>
        </BarraAncorada>
    )
}
