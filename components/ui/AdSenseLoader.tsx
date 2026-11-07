'use client'

import { useEffect } from 'react'
import { useAds, useNaoAutomatizado } from '@/components/providers/AdsProvider'
import { gestoConfiavel } from '@/lib/gesto-confiavel'
import { getBannerState, subscribeBanner } from '@/lib/consent'

export function AdSenseLoader() {
    const ads = useAds()
    const automatizado = useNaoAutomatizado()

    useEffect(() => {
        if (!ads.enabled || !ads.client || automatizado || process.env.NODE_ENV === 'development') return

        // Site Kit continua como painel de conexão/relatórios, mas num site
        // headless o snippet pertence ao Next.js. Aceita um script preexistente
        // (Site Kit/GTM/extensão) e nunca injeta uma segunda cópia.
        const existing = Array.from(document.scripts).find(script =>
            script.src.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'),
        )
        if (existing) return

        let injetado = false
        let esperaBanner: (() => void) | null = null
        const injetar = () => {
            if (injetado) return
            // O anúncio de âncora dos Anúncios automáticos do Google sobe com o
            // maior z-index possível e cobre o banner de consentimento, que não
            // tem como vencê-lo por camada. Com o banner aberto, o script só
            // entra depois da decisão.
            if (getBannerState() === 'perguntar') {
                limpar()
                esperaBanner ??= subscribeBanner(() => {
                    if (getBannerState() !== 'perguntar') injetar()
                })
                return
            }
            injetado = true
            limpar()
            esperaBanner?.()
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
        // Só um gesto confiável (toque, tecla, roda do mouse, clique) libera o
        // script. Antes havia um prazo de 800 ms que carregava o anúncio sem
        // interação, e o crawler de 2026-11 (Chrome falsificado, executa JS)
        // passava por ele e gerava impressão inválida no AdSense. Rolagem fica
        // de fora: script também rola a página. No celular rolar é tocar, então
        // o leitor real libera no primeiro movimento. No computador, o mouse
        // (pointermove) libera sem exigir clique: só com gesto de clique ou tecla
        // o anúncio demorava ou nem aparecia para quem apenas lia (2026-11-07).
        // Movimento disparado por script (dispatchEvent) segue sem valer.
        const eventos: Array<keyof WindowEventMap> = ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'touchmove', 'wheel']
        const liberar = (evento: Event) => {
            if (gestoConfiavel(evento)) injetar()
        }

        const limpar = () => {
            eventos.forEach(evento => window.removeEventListener(evento, liberar))
        }

        eventos.forEach(evento => window.addEventListener(evento, liberar, { passive: true }))

        return () => {
            limpar()
            esperaBanner?.()
        }
    }, [ads.enabled, ads.client, automatizado])

    return null
}
