'use client'

import { useEffect } from 'react'
import { useAds } from '@/components/providers/AdsProvider'

export function AdSenseLoader() {
    const ads = useAds()

    useEffect(() => {
        if (!ads.enabled || !ads.client || process.env.NODE_ENV === 'development') return

        // Site Kit continua como painel de conexão/relatórios, mas num site
        // headless o snippet pertence ao Next.js. Aceita um script preexistente
        // (Site Kit/GTM/extensão) e nunca injeta uma segunda cópia.
        const existing = Array.from(document.scripts).find(script =>
            script.src.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'),
        )
        if (existing) return

        let injetado = false
        const injetar = () => {
            if (injetado) return
            injetado = true
            limpar()
            const script = document.createElement('script')
            script.id = 'adsense-init'
            script.async = true
            script.crossOrigin = 'anonymous'
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.client}`
            document.head.appendChild(script)
        }

        // O script pesa ~275 KB. Injetado junto com a hidratação, disputa banda
        // com a imagem do LCP: medido em 2026-08-06, custava 27 pontos de
        // Lighthouse (89 -> 62) e levava o LCP de 2,7 s para 7,3 s.
        //
        // A espera é curta e fixa, por decisão de produto: prioriza garantia de
        // entrega do anúncio sobre pontuação. Medido em 2026-08-06 na home, em
        // perfil móvel simulado: imediato = 62, 800 ms = 68 (mediana de seis
        // execuções, variando entre 62 e 91), atrelado ao evento de LCP = 89.
        // Ou seja, 800 ms recuperam parte do ganho e mantêm o anúncio quase
        // junto com a página. Qualquer sinal de uso carrega na hora.
        const ESPERA_MS = 800
        const eventos: Array<keyof WindowEventMap> = ['scroll', 'pointerdown', 'keydown', 'touchstart']

        const limpar = () => {
            eventos.forEach(evento => window.removeEventListener(evento, injetar))
            clearTimeout(prazo)
        }

        eventos.forEach(evento => window.addEventListener(evento, injetar, { once: true, passive: true }))
        const prazo = window.setTimeout(injetar, ESPERA_MS)

        return limpar
    }, [ads.enabled, ads.client])

    return null
}
