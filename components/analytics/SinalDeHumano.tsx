'use client'

import { useEffect } from 'react'
import { marcarSessaoHumana } from '@/lib/analytics'

/**
 * Gestos que um robô de rastreio não faz. `isTrusted` separa o gesto real do
 * evento sintético disparado por script (`dispatchEvent`). Rolagem fica de fora
 * de propósito: script rola a página para carregar imagens.
 */
const GESTOS = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const

/**
 * Grava `humano = true` na sessão do Umami no primeiro gesto confiável.
 *
 * Trocou uma heurística (tela 375x812 + en-US) por um dado: em 2026-09, 71% das
 * sessões eram desse perfil e nenhuma tinha rolagem, consentimento ou busca. Com o
 * marcador, o filtro passa a ser `humano = true`, que não depende de o robô mudar
 * de tamanho de tela.
 *
 * Um envio por carregamento de página (a sessão herda a marca; reenviar é barato e
 * cobre a sessão que começou antes desta versão). Sem `window.umami` ainda, a fila
 * de `chamarUmami` espera o script carregar.
 */
export function SinalDeHumano() {
    useEffect(() => {
        const ouvir = (evento: Event) => {
            if (!evento.isTrusted) return
            for (const g of GESTOS) window.removeEventListener(g, ouvir, true)
            marcarSessaoHumana()
        }
        for (const g of GESTOS) window.addEventListener(g, ouvir, { capture: true, passive: true })
        return () => { for (const g of GESTOS) window.removeEventListener(g, ouvir, true) }
    }, [])

    return null
}
