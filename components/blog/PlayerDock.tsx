'use client'

import { useEffect, useRef } from 'react'
import { wavSilencioso } from '@/lib/blog/audioSilencioso'
import { useTranslations } from 'next-intl'

export interface DadosDoDock {
    titulo: string
    pausado: boolean
    capa?: string
    numero?: number
    total?: number
    posicao: number
    duracao: number
}

interface Props extends DadosDoDock {
    onAlternar: () => void
    onIr: () => void
    onFechar: () => void
    onAnterior?: () => void
    onProxima?: () => void
    onBuscar: (segundos: number) => void
}

const BOTAO = 'inline-flex shrink-0 items-center justify-center rounded-full text-inherit transition-colors active:bg-black/10 hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-accent)]'

function Icone({ d }: { d: string }) {
    return <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d={d} /></svg>
}

const ANTERIOR = 'M6 5h2v14H6zM20 5.5v13a.5.5 0 0 1-.8.4L9.6 12.4a.5.5 0 0 1 0-.8l9.6-6.5a.5.5 0 0 1 .8.4z'
const PROXIMA = 'M16 5h2v14h-2zM4 5.5v13a.5.5 0 0 0 .8.4l9.6-6.5a.5.5 0 0 0 0-.8L4.8 5.1a.5.5 0 0 0-.8.4z'
const FECHAR = 'M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z'

/**
 * Barra fixa com o controle de áudio NATIVO de cada navegador. O som é do iframe do Spotify, que não
 * expõe um elemento de áudio; então um `<audio controls>` toca um silêncio com a duração da faixa e
 * espelha o player nos dois sentidos (play/pausa/posição do Spotify → nativo, e usar o nativo → Spotify).
 * Fica `fixed` fora do fluxo do texto, então não treme com a rolagem.
 */
export function PlayerDock({ titulo, pausado, capa, numero, total, posicao, duracao, onAlternar, onIr, onFechar, onAnterior, onProxima, onBuscar }: Props) {
    const t = useTranslations('client.playerDock')
    const audio = useRef<HTMLAudioElement>(null)
    const url = useRef<string | null>(null)
    const estado = useRef({ pausado, onAlternar, onBuscar })
    const ajustando = useRef(0)
    const segundos = Math.ceil(duracao / 1000)

    useEffect(() => { estado.current = { pausado, onAlternar, onBuscar } })

    useEffect(() => {
        document.documentElement.dataset.playerDock = 'on'
        return () => { delete document.documentElement.dataset.playerDock }
    }, [])

    // Silêncio com a duração da faixa (refeito só quando a duração muda).
    useEffect(() => {
        const el = audio.current
        if (!el || segundos <= 0) return
        if (url.current) URL.revokeObjectURL(url.current)
        url.current = URL.createObjectURL(wavSilencioso(segundos + 1))
        ajustando.current++
        el.src = url.current
        el.load()
        return () => { if (url.current) { URL.revokeObjectURL(url.current); url.current = null } }
    }, [segundos])

    // Spotify → nativo.
    useEffect(() => {
        const el = audio.current
        if (!el || !el.src) return
        if (Math.abs(el.currentTime - posicao / 1000) > 1.5) { ajustando.current++; el.currentTime = posicao / 1000 }
        if (pausado && !el.paused) { ajustando.current++; el.pause() }
        if (!pausado && el.paused) { ajustando.current++; el.play().catch(() => {}) }
    }, [posicao, pausado, segundos])

    // Nativo → Spotify (o que o fã faz nos controles do navegador).
    useEffect(() => {
        const el = audio.current
        if (!el) return
        const aoTocar = () => { if (ajustando.current > 0) { ajustando.current--; return } if (estado.current.pausado) estado.current.onAlternar() }
        const aoPausar = () => { if (ajustando.current > 0) { ajustando.current--; return } if (!estado.current.pausado) estado.current.onAlternar() }
        const aoBuscar = () => { if (ajustando.current > 0) { ajustando.current--; return } estado.current.onBuscar(el.currentTime) }
        el.addEventListener('play', aoTocar)
        el.addEventListener('pause', aoPausar)
        el.addEventListener('seeked', aoBuscar)
        return () => { el.removeEventListener('play', aoTocar); el.removeEventListener('pause', aoPausar); el.removeEventListener('seeked', aoBuscar) }
    }, [])

    return (
        <div
            role="region"
            aria-label={t('region')}
            data-player-dock
            className="not-prose fixed bottom-[calc(var(--bottom-nav-h,0px)+8px)] left-2 right-2 z-[210] lg:bottom-6 lg:left-6 lg:right-auto lg:w-[26rem]"
        >
            <div className="mb-1 flex items-center gap-1">
                <button type="button" onClick={onIr} aria-label={t('goTo', { title: titulo })} className="flex min-w-0 items-center gap-2 rounded-full bg-[var(--color-surface)] py-1 pl-1 pr-3 text-left shadow-md ring-1 ring-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">
                    <span className="block h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[var(--color-border)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {capa && <img src={capa} alt="" className="!m-0 block h-full w-full max-w-none object-cover" />}
                    </span>
                    <span className="min-w-0 truncate text-xs font-semibold text-[var(--color-foreground)]" aria-live="polite">
                        {titulo}{numero && total ? <span className="font-normal text-[var(--color-muted)]"> · {t('trackOf', { n: numero, total })}</span> : null}
                    </span>
                </button>
                <span className="flex-1" />
                {onAnterior && <button type="button" onClick={onAnterior} className={`${BOTAO} h-8 w-8 bg-[var(--color-surface)] shadow-md ring-1 ring-black/10`} aria-label={t('previous')}><Icone d={ANTERIOR} /></button>}
                {onProxima && <button type="button" onClick={onProxima} className={`${BOTAO} h-8 w-8 bg-[var(--color-surface)] shadow-md ring-1 ring-black/10`} aria-label={t('next')}><Icone d={PROXIMA} /></button>}
                <button type="button" onClick={onFechar} className={`${BOTAO} h-8 w-8 bg-[var(--color-surface)] shadow-md ring-1 ring-black/10`} aria-label={t('close')}><Icone d={FECHAR} /></button>
            </div>
            <div className="overflow-hidden rounded-full bg-[var(--color-surface)] shadow-[0_4px_16px_rgb(0_0_0/0.3)] ring-1 ring-black/10">
                <audio ref={audio} controls preload="auto" className="block h-12 w-full [color-scheme:light] dark:[color-scheme:dark]" aria-label={titulo} />
            </div>
        </div>
    )
}
