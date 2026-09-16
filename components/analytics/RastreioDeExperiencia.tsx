'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useReportWebVitals } from 'next/web-vitals'
import { trackTempoEngajado, trackWebVital } from '@/lib/analytics'
import { tipoDePagina } from '@/lib/tipoDePagina'

type Metrica = Parameters<Parameters<typeof useReportWebVitals>[0]>[0]

// No escopo do MÓDULO, e não dentro do componente: a documentação do Next pede
// referência estável, senão cada render reinscreve o callback e as métricas
// saem duplicadas.
function reportarVital(metrica: Metrica) {
    trackWebVital({
        nome: metrica.name,
        valor: metrica.value,
        avaliacao: metrica.rating ?? 'desconhecida',
        tipoPagina: tipoDePagina(window.location.pathname),
    })
}

/** Segundos mínimos para registrar: abaixo disso é clique errado ou bot, não atenção. */
const MINIMO_ENGAJADO_S = 3

/**
 * Experiência real de quem visita: Web Vitals e tempo de atenção por página.
 *
 * O tempo só corre com a aba VISÍVEL — aba esquecida aberta não é atenção — e
 * é enviado uma vez por página, ao sair dela: troca de rota no App Router,
 * aba escondida ou fechamento (pagehide). Motivos de amostragem e volume em
 * lib/analytics.ts.
 */
export function RastreioDeExperiencia() {
    useReportWebVitals(reportarVital)

    const caminho = usePathname()
    const acumulado = useRef(0)
    const visivelDesde = useRef<number | null>(null)
    const enviado = useRef(false)

    useEffect(() => {
        acumulado.current = 0
        enviado.current = false
        visivelDesde.current = document.visibilityState === 'visible' ? Date.now() : null
        const tipo = tipoDePagina(caminho)

        const pausar = () => {
            if (visivelDesde.current !== null) {
                acumulado.current += (Date.now() - visivelDesde.current) / 1000
                visivelDesde.current = null
            }
        }
        const enviar = () => {
            pausar()
            if (enviado.current || acumulado.current < MINIMO_ENGAJADO_S) return
            enviado.current = true
            trackTempoEngajado({ segundos: acumulado.current, tipoPagina: tipo })
        }
        const aoMudarVisibilidade = () => {
            if (document.visibilityState === 'hidden') {
                // Aba escondida pode nunca voltar (celular mata a aba em
                // segundo plano): envia aqui, que é o último momento confiável.
                enviar()
            } else if (!enviado.current) {
                visivelDesde.current = Date.now()
            }
        }

        document.addEventListener('visibilitychange', aoMudarVisibilidade)
        window.addEventListener('pagehide', enviar)
        return () => {
            // Troca de rota: a página anterior terminou.
            enviar()
            document.removeEventListener('visibilitychange', aoMudarVisibilidade)
            window.removeEventListener('pagehide', enviar)
        }
    }, [caminho])

    return null
}
