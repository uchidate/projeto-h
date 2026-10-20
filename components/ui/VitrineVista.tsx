'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { trackVitrineVista } from '@/lib/analytics'

/**
 * Dispara `vitrine_view` uma vez por montagem, quando metade da vitrine entra na tela.
 * Os IDs passados são os que o visitante de fato vê (a prateleira rotativa mostra 4 de 8),
 * porque é esse o denominador do CTR por produto.
 */
export function useVitrineVista<T extends HTMLElement>(contexto: string, produtoIds: number[], variante?: string) {
    const ref = useRef<T>(null)
    const idsChave = produtoIds.join(',')
    useEffect(() => {
        const el = ref.current
        if (!el || produtoIds.length === 0 || typeof IntersectionObserver === 'undefined') return
        let enviado = false
        const obs = new IntersectionObserver(entradas => {
            if (enviado || !entradas.some(e => e.isIntersecting)) return
            enviado = true
            trackVitrineVista({ contexto, produtoIds, variante })
            obs.disconnect()
        }, { threshold: 0.5 })
        obs.observe(el)
        return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- idsChave resume produtoIds
    }, [contexto, idsChave, variante])
    return ref
}

/** Envoltório para vitrines de servidor (ex.: bloco compacto do artigo). */
export function VitrineVista({ contexto, produtoIds, variante, children, className }: {
    contexto: string; produtoIds: number[]; variante?: string; children: ReactNode; className?: string
}) {
    const ref = useVitrineVista<HTMLDivElement>(contexto, produtoIds, variante)
    return <div ref={ref} className={className}>{children}</div>
}
