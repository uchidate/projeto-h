'use client'

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { useTranslations } from 'next-intl'

const INTERVALO_MS = 7000
/** Depois de a pessoa usar setas, pontos ou deslizar, o avanço automático volta sozinho após este tempo parado. */
const RETOMADA_MS = 10000

/**
 * Carrossel do card principal da home. Todos os slides saem no HTML do servidor (o crawler vê as
 * matérias todas) e a rolagem é `scroll-snap` nativa: deslizar com o dedo funciona sem JS. O JS só
 * acrescenta setas, pontos, avanço automático e o botão de pausa. O avanço automático para com
 * mouse ou foco em cima, aba em segundo plano, carrossel fora da tela e preferência por menos
 * movimento. Usar setas, pontos ou deslizar só adia o avanço (ele volta sozinho depois de uns
 * segundos); só o botão de pausa o desliga até a pessoa retomar. Mouse e foco só pausam quando são
 * mouse de verdade e foco de teclado: toque e clique deixavam o carrossel parado para sempre.
 */
export function HeroCarousel({ children }: { children: ReactNode }) {
    const t = useTranslations('client.heroCarousel')
    const slides = Children.toArray(children)
    const total = slides.length
    const trilho = useRef<HTMLDivElement>(null)
    const raiz = useRef<HTMLDivElement>(null)
    const [atual, setAtual] = useState(0)
    const [pausadoPelaPessoa, setPausadoPelaPessoa] = useState(false)
    const [ocupado, setOcupado] = useState(false)
    const retomada = useRef<number | undefined>(undefined)
    const [suspenso, setSuspenso] = useState(false)
    const [visivel, setVisivel] = useState(true)
    const [reduzido, setReduzido] = useState(false)

    // Interação manual (setas, pontos, gesto): adia o avanço e o retoma sozinho depois de um tempo.
    const adiar = useCallback(() => {
        setOcupado(true)
        window.clearTimeout(retomada.current)
        retomada.current = window.setTimeout(() => setOcupado(false), RETOMADA_MS)
    }, [])
    useEffect(() => () => window.clearTimeout(retomada.current), [])
    const ir = useCallback((i: number) => {
        const el = trilho.current
        if (!el) return
        const alvo = ((i % total) + total) % total
        el.scrollTo({ left: alvo * el.clientWidth, behavior: reduzido ? 'auto' : 'smooth' })
    }, [total, reduzido])

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        const aplicar = () => setReduzido(mq.matches)
        aplicar()
        mq.addEventListener('change', aplicar)
        return () => mq.removeEventListener('change', aplicar)
    }, [])

    // Slide visível, a partir da posição de rolagem (vale também para o gesto de deslizar).
    useEffect(() => {
        const el = trilho.current
        if (!el) return
        let quadro = 0
        const aoRolar = () => {
            cancelAnimationFrame(quadro)
            quadro = requestAnimationFrame(() => setAtual(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))))
        }
        el.addEventListener('scroll', aoRolar, { passive: true })
        el.addEventListener('touchstart', adiar, { passive: true })
        el.addEventListener('wheel', adiar, { passive: true })
        return () => { el.removeEventListener('scroll', aoRolar); el.removeEventListener('touchstart', adiar); el.removeEventListener('wheel', adiar); cancelAnimationFrame(quadro) }
    }, [adiar])

    useEffect(() => {
        const el = raiz.current
        if (!el || typeof IntersectionObserver === 'undefined') return
        const o = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting), { threshold: 0.5 })
        o.observe(el)
        return () => o.disconnect()
    }, [])

    useEffect(() => {
        const aoMudarAba = () => setSuspenso(document.hidden)
        document.addEventListener('visibilitychange', aoMudarAba)
        return () => document.removeEventListener('visibilitychange', aoMudarAba)
    }, [])

    const rodando = !pausadoPelaPessoa && !ocupado && !suspenso && visivel && !reduzido
    useEffect(() => {
        if (!rodando) return
        const id = window.setInterval(() => ir(atual + 1), INTERVALO_MS)
        return () => window.clearInterval(id)
    }, [rodando, atual, ir])

    const manual = (i: number) => { adiar(); ir(i) }

    return (
        <div
            ref={raiz}
            role="region"
            aria-roledescription="carousel"
            aria-label={t('label')}
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') setSuspenso(true) }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') setSuspenso(document.hidden) }}
            onFocus={(e) => { if (e.target.matches(':focus-visible')) setSuspenso(true) }}
            onBlur={() => setSuspenso(document.hidden)}
        >
            <div ref={trilho} className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-live={rodando ? 'off' : 'polite'}>
                {slides.map((slide, i) => (
                    <div key={i} role="group" aria-roledescription="slide" aria-label={t('slide', { n: i + 1, total })} className="w-full shrink-0 snap-start snap-always">
                        {slide}
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-2 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => manual(atual - 1)} aria-label={t('anterior')} className="flex h-9 w-9 items-center justify-center border border-border text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => manual(atual + 1)} aria-label={t('proximo')} className="flex h-9 w-9 items-center justify-center border border-border text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {!reduzido && (
                        <button type="button" onClick={() => setPausadoPelaPessoa((p) => !p)} aria-label={pausadoPelaPessoa ? t('retomar') : t('pausar')} className="flex h-9 w-9 items-center justify-center border border-border text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                            {pausadoPelaPessoa ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1" role="tablist" aria-label={t('slides')}>
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            role="tab"
                            aria-selected={i === atual}
                            aria-label={t('irPara', { n: i + 1 })}
                            onClick={() => manual(i)}
                            className="group flex h-9 w-7 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                        >
                            <span className={`block h-1 transition-all ${i === atual ? 'w-6 bg-accent' : 'w-3 bg-border group-hover:bg-muted'}`} />
                        </button>
                    ))}
                </div>
                <span className="font-mono text-[11px] tabular-nums text-muted" aria-hidden="true">{atual + 1} / {total}</span>
            </div>
        </div>
    )
}
