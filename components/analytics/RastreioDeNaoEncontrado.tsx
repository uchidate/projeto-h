'use client'

import { useEffect } from 'react'
import { trackPaginaNaoEncontrada } from '@/lib/analytics'

/** Registra a visita à 404 uma vez, com o caminho pedido e de onde a pessoa veio. */
export function RastreioDeNaoEncontrado() {
    useEffect(() => {
        let referrerHost = ''
        try {
            referrerHost = document.referrer ? new URL(document.referrer).host : ''
        } catch { /* referrer malformado: trata como direto */ }
        trackPaginaNaoEncontrada({ caminho: window.location.pathname, referrerHost })
    }, [])
    return null
}
