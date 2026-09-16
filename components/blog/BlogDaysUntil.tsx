'use client'

import { useEffect } from 'react'

function daysUntil(targetIso: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(`${targetIso}T00:00:00`)
    return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/**
 * Preenche <span data-oc-countdown="YYYY-MM-DD"> dentro do artigo com uma
 * contagem regressiva calculada no cliente — o HTML vem do WordPress como
 * string estática, então o cálculo real de "faltam N dias" não pode viver
 * no cache ISR; só faz sentido recalculado a cada carregamento de página.
 */
export function BlogDaysUntil() {
    useEffect(() => {
        const nodes = document.querySelectorAll<HTMLElement>('[data-oc-countdown]')
        nodes.forEach(node => {
            const iso = node.dataset.ocCountdown
            if (!iso) return
            const days = daysUntil(iso)
            if (days < 0) { node.remove(); return }
            node.textContent = days === 0 ? 'É hoje' : days === 1 ? 'Falta 1 dia' : `Faltam ${days} dias`
            node.classList.add('is-ready')
        })
    }, [])

    return null
}
