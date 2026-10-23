'use client'

import { useEffect } from 'react'

/** Devolve o `src` dos players adiados (`iframe[data-src]`) quando chegam a 300 px da tela. */
export function EmbedsSobDemanda() {
    useEffect(() => {
        const pendentes = Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe[data-src]'))
        if (!pendentes.length) return
        const carregar = (iframe: HTMLIFrameElement) => {
            const src = iframe.dataset.src
            if (src) iframe.src = src
            iframe.removeAttribute('data-src')
        }
        if (typeof IntersectionObserver === 'undefined') {
            pendentes.forEach(carregar)
            return
        }
        const observador = new IntersectionObserver((entradas) => {
            for (const entrada of entradas) {
                if (!entrada.isIntersecting) continue
                carregar(entrada.target as HTMLIFrameElement)
                observador.unobserve(entrada.target)
            }
        }, { rootMargin: '300px 0px' })
        pendentes.forEach((iframe) => observador.observe(iframe))
        return () => observador.disconnect()
    }, [])
    return null
}
