'use client'
import { storageKey } from '@/lib/constants/identidade.mjs'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { useAds } from '@/components/providers/AdsProvider'
import { enqueueSlotPush } from '@/lib/utils/adQueue'
import type { AdPlacement } from '@/lib/config/ads'
import { AD_RUNTIME } from '@/lib/config/adRuntime'
import { parseAdSenseStatus } from '@/lib/config/adRuntime'
import { trackAdDismissed, trackAdStatus } from '@/lib/analytics'

declare global {
    interface Window { adsbygoogle: Array<Record<string, unknown>> }
}

/**
 * Ad sticky no rodapé mobile — alto viewability, mas com botão de fechar
 * para não prejudicar UX (e manter o site dentro das políticas do AdSense).
 *
 * Só aparece após o carregamento + 2,5s para não conflitar com o LCP.
 */
export function AdStickyBottom({ slot }: { slot: string }) {
    const ads = useAds()
    const t = useTranslations('client')
    const client = ads.client
    const resolvedSlot = slot in ads.slots ? ads.slots[slot as AdPlacement] : slot
    const pushed = useRef(false)
    const adRef = useRef<HTMLModElement>(null)
    const trackedStatus = useRef<string | null>(null)
    const [mobileViewport, setMobileViewport] = useState(false)
    const [visible, setVisible] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [requested, setRequested] = useState(false)
    const [adStatus, setAdStatus] = useState<'filled' | 'unfilled' | 'timeout' | null>(null)

    useEffect(() => {
        const media = window.matchMedia('(max-width: 639px)')
        const sync = () => {
            setMobileViewport(media.matches)
            if (!media.matches) setVisible(false)
        }
        sync()
        media.addEventListener('change', sync)
        return () => media.removeEventListener('change', sync)
    }, [])

    // Aguarda load + janela de LCP. Fechar vale pela sessão inteira para o
    // anúncio não reaparecer a cada navegação e frustrar o leitor.
    useEffect(() => {
        const wasDismissed = sessionStorage.getItem(storageKey('ad_sticky_dismissed')) === '1'
        if (!mobileViewport || wasDismissed || !ads.enabled || !client || !resolvedSlot) return

        let timer: ReturnType<typeof setTimeout> | undefined
        const schedule = () => { timer = setTimeout(() => setVisible(true), AD_RUNTIME.sticky.revealDelayMs) }
        if (document.readyState === 'complete') schedule()
        else window.addEventListener('load', schedule, { once: true })
        return () => {
            window.removeEventListener('load', schedule)
            if (timer) clearTimeout(timer)
        }
    }, [mobileViewport, ads.enabled, client, resolvedSlot])

    useEffect(() => {
        if (!ads.enabled || !visible || dismissed || pushed.current || !client || !resolvedSlot) return
        pushed.current = true
        // Conferido na hora do push: a barra pode ter sido fechada ou ocultada na fila.
        enqueueSlotPush(() => adRef.current, () => {
            try {
                ;(window.adsbygoogle = window.adsbygoogle || []).push({})
            } finally {
                setRequested(true)
            }
        })
    }, [ads.enabled, visible, dismissed, client, resolvedSlot])

    useEffect(() => {
        if (!requested || adStatus) return
        const timer = setTimeout(() => {
            setAdStatus('timeout')
            trackAdStatus({ placement: 'sticky', format: 'horizontal', status: 'timeout' })
        }, AD_RUNTIME.sticky.requestTimeoutMs)
        return () => clearTimeout(timer)
    }, [requested, adStatus])

    useEffect(() => {
        const ins = adRef.current
        if (!visible || dismissed || !ins || !('MutationObserver' in window)) return
        const report = () => {
            const status = parseAdSenseStatus(ins.getAttribute('data-ad-status'))
            if (!status || trackedStatus.current === status) return
            trackedStatus.current = status
            setAdStatus(status)
            trackAdStatus({ placement: 'sticky', format: 'horizontal', status })
        }
        report()
        const observer = new MutationObserver(report)
        observer.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] })
        return () => observer.disconnect()
    }, [visible, dismissed])

    if (!mobileViewport || !ads.enabled || !client || !resolvedSlot || dismissed || !visible || adStatus === 'unfilled' || adStatus === 'timeout') return null

    return (
        <div className="ad-sticky-bottom sm:hidden" role="complementary" aria-label={t('ads.label')}>
            <div className="relative w-full max-w-[320px] min-w-0">
                <button
                    type="button"
                    onClick={() => {
                        sessionStorage.setItem(storageKey('ad_sticky_dismissed'), '1')
                        trackAdDismissed('sticky')
                        setDismissed(true)
                    }}
                    className="absolute -top-3 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface border border-border text-muted hover:text-foreground z-10"
                    aria-label={t('ads.close')}
                >
                    <X size={10} />
                </button>
                <ins
                    ref={adRef}
                    className="adsbygoogle"
                    style={{ display: 'block', width: '100%', minHeight: '100px' }}
                    data-ad-client={client}
                    data-ad-slot={resolvedSlot}
                    data-ad-format="horizontal"
                    data-full-width-responsive="false"
                />
            </div>
        </div>
    )
}
