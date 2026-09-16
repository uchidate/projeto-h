'use client'

import { useEffect, useRef } from 'react'
import { trackScrollDepth } from '@/lib/analytics'

const MARCOS = [25, 50, 75, 100] as const
type Marco = (typeof MARCOS)[number]

/**
 * Emite `scroll_depth` ao cruzar 25%, 50%, 75% e 100% da página, uma vez cada.
 *
 * Decisões que sustentam a qualidade do dado:
 *
 * - **Página que não rola é ignorada.** Se o conteúdo cabe na viewport, 100%
 *   seria verdade no instante do carregamento e a métrica mediria tamanho de
 *   tela, não leitura. `MINIMO_ROLAVEL` exige altura suficiente para o número
 *   significar algo.
 * - **Leitura agendada em rAF.** `scrollTop` e `scrollHeight` forçam recálculo
 *   de layout; lidos a cada evento de scroll causariam travamento perceptível.
 *   Uma leitura por quadro é o teto útil.
 * - **Listener passivo.** Sem isso o navegador precisa esperar o handler para
 *   saber se houve `preventDefault`, e a rolagem engasga.
 * - **Marcos reiniciam a cada caminho**, senão navegar entre artigos numa SPA
 *   herdaria os marcos do anterior e o segundo artigo nunca registraria nada.
 */
const MINIMO_ROLAVEL = 400

export function useScrollDepth(caminho: string): void {
    const atingidos = useRef<Set<Marco>>(new Set())
    const agendado = useRef(false)

    useEffect(() => {
        atingidos.current = new Set()

        const medir = () => {
            agendado.current = false
            const doc = document.documentElement
            const rolavel = doc.scrollHeight - doc.clientHeight
            if (rolavel < MINIMO_ROLAVEL) return

            const percentual = ((window.scrollY + doc.clientHeight) / doc.scrollHeight) * 100
            for (const marco of MARCOS) {
                if (percentual >= marco && !atingidos.current.has(marco)) {
                    atingidos.current.add(marco)
                    trackScrollDepth({ depth: marco, path: caminho })
                }
            }
        }

        const aoRolar = () => {
            if (agendado.current) return
            agendado.current = true
            requestAnimationFrame(medir)
        }

        // Uma medição inicial cobre quem chega por âncora ou restaura posição.
        aoRolar()
        window.addEventListener('scroll', aoRolar, { passive: true })
        window.addEventListener('resize', aoRolar, { passive: true })
        return () => {
            window.removeEventListener('scroll', aoRolar)
            window.removeEventListener('resize', aoRolar)
        }
    }, [caminho])
}
