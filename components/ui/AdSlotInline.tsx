'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AdSlot } from './AdSlot'
import { useAds } from '@/components/providers/AdsProvider'
import { AD_LAYOUT_POLICIES, type AdLayout } from '@/lib/config/adPlacements'

interface Props {
    slot: string
    /** 'auto' deixa o Google escolher o melhor tamanho por viewport (recomendado); 'rectangle'/'horizontal' fixam o formato */
    format?: 'auto' | 'rectangle' | 'horizontal'
    /** true = carrega imediatamente (posições above-the-fold, ex: leaderboard no topo do artigo); default lazy */
    eager?: boolean
    /** Identificador estável e obrigatório para métricas e diagnóstico por página. */
    analyticsPlacement: string
    emptyTimeoutMs?: number
    /** Papel editorial; centraliza formato, largura, prioridade e expansão responsiva. */
    layout?: AdLayout
    /**
     * Só monta e pede anúncio quando a viewport casa com a media query.
     *
     * Necessário quando o bloco ao redor é escondido por CSS (`hidden xl:flex`,
     * `xl:hidden`): medido em 2026-09-17, cada largura de tela tinha um slot
     * pedindo anúncio dentro de container de largura 0 — leilão gasto em algo
     * que ninguém vê, e anúncio oculto é risco de política do AdSense.
     */
    mediaQuery?: string
}

/**
 * Slot de anúncio para inserir DENTRO do conteúdo do artigo.
 * Uso em BlogPostPage, ArtistBiography e ProductionDetailPage.
 */
export function AdSlotInline({ slot, format, eager, analyticsPlacement, emptyTimeoutMs, layout = 'content', mediaQuery }: Props) {
    const ads = useAds()
    const t = useTranslations('client')
    const [collapsed, setCollapsed] = useState(false)
    const policy = AD_LAYOUT_POLICIES[layout]
    const resolvedFormat = format ?? policy.format
    const resolvedEager = eager ?? policy.eager
    if (!ads.enabled || !ads.client) return null
    if (collapsed) return null

    return (
        <aside
            aria-label={t('ads.label')}
            data-ad-layout={layout}
            className={`${policy.wrapperClassName} flex min-w-0 flex-col items-center`}
        >
            <AdSlot
                slot={slot}
                format={resolvedFormat}
                lazy={!resolvedEager}
                label
                className={policy.containerClassName}
                maxWidthPx={policy.maxWidthPx}
                analyticsPlacement={analyticsPlacement}
                emptyTimeoutMs={emptyTimeoutMs}
                fullWidthResponsive={policy.fullWidthResponsive}
                mediaQuery={mediaQuery}
                onStatusChange={status => {
                    if (status === 'unfilled' || status === 'timeout') setCollapsed(true)
                }}
            />
        </aside>
    )
}
