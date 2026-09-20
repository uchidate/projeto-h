'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAds } from '@/components/providers/AdsProvider'
import { enqueueSlotPush } from '@/lib/utils/adQueue'
import type { AdPlacement } from '@/lib/config/ads'
import { AD_RUNTIME, parseAdSenseStatus, type AdRuntimeFormat, type AdRuntimeStatus } from '@/lib/config/adRuntime'
import { trackAdRequest, trackAdStatus } from '@/lib/analytics'

declare global {
    interface Window {
        adsbygoogle: Array<Record<string, unknown>>
    }
}

type AdFormat = AdRuntimeFormat
interface AdSlotProps {
    slot: string
    format?: AdFormat
    className?: string
    /** Limite físico do contêiner, aplicado antes do push para dimensionar corretamente o leilão. */
    maxWidthPx?: number
    /** true = só carrega quando entrar no viewport (below-fold) */
    lazy?: boolean
    /** Label visível acima do anúncio — exigido pelo Google para identificar conteúdo patrocinado */
    label?: boolean
    /** Nome semântico da zona para análise de preenchimento; não altera o slot do AdSense. */
    analyticsPlacement?: string
    /** Remove a reserva se o AdSense não responder; 0 desativa. */
    emptyTimeoutMs?: number
    /** Permite ao placement remover também margens/bordas externas. */
    onStatusChange?: (status: AdRuntimeStatus) => void
    /** Expansão além do contêiner no mobile. Desligada por padrão para evitar corte em grids. */
    fullWidthResponsive?: boolean
    /** Só monta e solicita o slot quando a viewport corresponde à media query. */
    mediaQuery?: string
}

export function AdSlot({
    slot,
    format = 'auto',
    className = '',
    maxWidthPx,
    lazy = false,
    label = true,
    analyticsPlacement,
    emptyTimeoutMs,
    onStatusChange,
    fullWidthResponsive = false,
    mediaQuery,
}: AdSlotProps) {
    const ads = useAds()
    const t = useTranslations('client')
    const client = ads.client
    // ID próprio da posição vence o slot genérico; ver `placements` em monetization.ts.
    const resolvedSlot = (analyticsPlacement && ads.placements?.[analyticsPlacement])
        || (slot in ads.slots ? ads.slots[slot as AdPlacement] : slot)
    const ref = useRef<HTMLDivElement>(null)
    const pushed = useRef(false)
    const trackedStatus = useRef<string | null>(null)
    const [visible, setVisible] = useState(!lazy)
    const [requested, setRequested] = useState(false)
    const [adStatus, setAdStatus] = useState<AdRuntimeStatus | null>(null)
    const [viewportEligible, setViewportEligible] = useState(!mediaQuery)

    useEffect(() => {
        if (!mediaQuery) return
        const media = window.matchMedia(mediaQuery)
        let active = true
        const sync = () => {
            if (!active) return
            if (!media.matches) {
                pushed.current = false
                trackedStatus.current = null
                setRequested(false)
                setAdStatus(null)
            }
            setViewportEligible(media.matches)
        }
        queueMicrotask(sync)
        media.addEventListener('change', sync)
        return () => {
            active = false
            media.removeEventListener('change', sync)
        }
    }, [mediaQuery])

    // Intersection Observer para lazy loading — slots below-fold não bloqueiam LCP
    useEffect(() => {
        if (!lazy) return
        const el = ref.current
        // Com `mediaQuery`, o primeiro render devolve null (viewportEligible
        // começa false), então aqui `ref.current` ainda é null. Por isso
        // `viewportEligible` precisa estar nas dependências: sem ele o efeito
        // não reexecutava quando a viewport virava elegível, o observer nunca
        // era registrado e o slot ficava eternamente em "reserved".
        // Medido ao vivo em 19/09/2026: artist_bio_mobile não carregava em
        // nenhum celular ou tablet.
        if (!el) return
        if (!('IntersectionObserver' in window)) {
            const timer = setTimeout(() => setVisible(true), 0)
            return () => clearTimeout(timer)
        }
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
            // 600px de antecedência: o leilão leva 0,5-2s, então margem curta
            // (200px) = usuário rolando por espaço vazio; margem enorme
            // (900px) = vários slots disparando na mesma rolagem e rajada de
            // processamento (jank). 600px + a fila serializada do adQueue
            // equilibram os dois lados.
            { rootMargin: '600px' },
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [lazy, viewportEligible])

    useEffect(() => {
        if (!ads.enabled || !viewportEligible || !visible || pushed.current || !client || !resolvedSlot) return
        pushed.current = true
        const queuedAt = performance.now()
        const placement = analyticsPlacement ?? (slot in ads.slots ? slot : 'custom')
        // Serializado via adQueue — N slots visíveis na mesma rolagem não
        // podem processar no mesmo frame (jank de mobile medido ao vivo).
        // O slot é conferido na hora do push (ver estadoDoSlot): push em slot
        // oculto, desmontado ou já preenchido é leilão perdido e erro do AdSense.
        enqueueSlotPush(() => ref.current?.querySelector('ins.adsbygoogle'), () => {
            try {
                ;(window.adsbygoogle = window.adsbygoogle || []).push({})
            } finally {
                trackAdRequest({
                    placement,
                    format,
                    queueDelayMs: performance.now() - queuedAt,
                })
                // Mesmo que Safari/content blocker rejeite o push, começa o
                // prazo de saída. Sem isso a reserva ficaria presa para sempre.
                setRequested(true)
            }
        })
    }, [ads.enabled, viewportEligible, visible, client, resolvedSlot, analyticsPlacement, slot, ads.slots, format])

    useEffect(() => {
        // Safari pode adiar `load` e idle callbacks. O prazo deve começar
        // quando o pedido chega ao AdSense, não quando o slot entra na tela.
        const timeoutMs = emptyTimeoutMs ?? AD_RUNTIME.requestTimeoutMs[format]
        if (!requested || adStatus || timeoutMs <= 0) return
        const timer = setTimeout(() => {
            // O AdSense marca `data-adsbygoogle-status="done"` assim que assume o
            // slot, e só depois decide `data-ad-status` (filled/unfilled). Medido
            // ao vivo em 2026-08-07: o slot da home ficava `done` sem status
            // nenhum e o prazo o removia — o anúncio "sumia" mesmo com o leilão
            // em andamento. Se o AdSense já pegou o slot, a espera continua: um
            // `unfilled` real ainda chega pelo MutationObserver e remove.
            //
            // O prazo segue valendo para o caso que ele existe para cobrir:
            // bloqueador ou script que nunca rodou, onde `done` nunca aparece.
            const assumido = ref.current?.querySelector('ins.adsbygoogle')?.getAttribute('data-adsbygoogle-status') === 'done'
            if (assumido) return
            setAdStatus('timeout')
            onStatusChange?.('timeout')
            trackAdStatus({
                placement: analyticsPlacement ?? (slot in ads.slots ? slot : 'custom'),
                format,
                status: 'timeout',
            })
        }, timeoutMs)
        return () => clearTimeout(timer)
    }, [requested, adStatus, emptyTimeoutMs, analyticsPlacement, slot, ads.slots, format, onStatusChange])

    useEffect(() => {
        if (!visible) return
        const ins = ref.current?.querySelector('ins.adsbygoogle')
        if (!ins || !('MutationObserver' in window)) return
        const report = () => {
            const status = parseAdSenseStatus(ins.getAttribute('data-ad-status'))
            if (!status || trackedStatus.current === status) return
            trackedStatus.current = status
            setAdStatus(status)
            onStatusChange?.(status)
            trackAdStatus({
                placement: analyticsPlacement ?? (slot in ads.slots ? slot : 'custom'),
                format,
                status,
            })
        }
        report()
        const observer = new MutationObserver(report)
        observer.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] })
        return () => observer.disconnect()
    }, [visible, slot, format, ads.slots, analyticsPlacement, onStatusChange])

    if (!ads.enabled || !viewportEligible || !client || !resolvedSlot) return null
    if (adStatus === 'unfilled' || adStatus === 'timeout') return null

    // Reservas de altura anti-CLS: o pior layout shift é o formato expandir
    // DEPOIS do conteúdo renderizado. 'auto' reservava só 90px, mas em
    // mobile o Google frequentemente serve 250-300px de altura nesse
    // formato — o conteúdo abaixo pulava a diferença. 250px cobre o caso
    // comum; espaço vazio quando o anúncio vem menor custa menos que CLS
    // (Core Web Vitals pesa no ranking e o pulo causa clique acidental,
    // que é risco de política do AdSense).
    const reserveClassName = `ad-reserve ad-reserve-${format}`

    // full-width-responsive deixa o Google trocar um horizontal por unidade
    // de 250-300px de altura no mobile — medido ao vivo: o leaderboard eager
    // do topo do artigo estourou a reserva de 90px e empurrou o <main>
    // inteiro (CLS 0.413 num Lighthouse que antes dava 0.009). Para formatos
    // de altura fixa a expansão vira layout shift; só os formatos realmente
    // flexíveis (auto/fluid/autorelaxed) mantêm o comportamento.
    const responsiveExpansion = fullWidthResponsive && (format === 'auto' || format === 'fluid' || format === 'autorelaxed')
    const placement = analyticsPlacement ?? (slot in ads.slots ? slot : 'custom')

    return (
        <div
            ref={ref}
            className={className}
            style={maxWidthPx ? { maxWidth: `${maxWidthPx}px` } : undefined}
            data-ad-placement={placement}
            data-ad-max-width={maxWidthPx}
        >
            {label && (
                <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-widest text-muted">
                    {t('ads.label')}
                </p>
            )}
            {visible && (
                <div
                    className={reserveClassName}
                    data-ad-container
                    data-ad-state={adStatus === 'filled' ? 'filled' : 'loading'}
                    aria-busy={adStatus !== 'filled'}
                >
                    <ins
                        className="adsbygoogle"
                        style={{ display: 'block' }}
                        data-ad-client={client}
                        data-ad-slot={resolvedSlot}
                        data-ad-format={format}
                        data-full-width-responsive={responsiveExpansion ? 'true' : 'false'}
                    />
                </div>
            )}
            {/* Reserva espaço durante lazy load — evita CLS */}
            {!visible && <div className={reserveClassName} data-ad-state="reserved" />}
        </div>
    )
}
