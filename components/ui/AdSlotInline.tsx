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
}

/**
 * Slot de anúncio para inserir DENTRO do conteúdo do artigo.
 * Uso em BlogPostPage, ArtistBiography e ProductionDetailPage.
 */
export function AdSlotInline({ slot, format, eager, analyticsPlacement, emptyTimeoutMs, layout = 'content' }: Props) {
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
                onStatusChange={status => {
                    if (status === 'unfilled' || status === 'timeout') setCollapsed(true)
                }}
            />
        </aside>
    )
}
