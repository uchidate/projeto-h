'use client'

import { useEffect, useRef } from 'react'
import { useScrollDepth } from '@/hooks/useScrollDepth'
import { trackBlogRead } from '@/lib/analytics'
import { registrarLeitura } from '@/lib/leitura-local'

interface Props {
    /** Slug do artigo, para separar as leituras no relatório. */
    slug: string
    /** Caminho da página, base do `scroll_depth`. */
    caminho: string
}

/** Segundos de atenção que separam uma leitura de uma passada de olho. */
const SEGUNDOS_PARA_LEITURA = 30

/**
 * Mede leitura de artigo sem transformar a página em Client Component.
 *
 * A página do blog é Server Component por desempenho e SEO; tornar tudo cliente
 * para instrumentar seria pagar caro por informação de apoio. Este componente
 * isola o único pedaço que precisa rodar no navegador.
 *
 * `blog_read` exige **tempo de atenção real**, não permanência: o cronômetro
 * pausa quando a aba vai para segundo plano. Sem isso, uma aba esquecida aberta
 * a tarde inteira contaria como leitura, e a métrica passaria a medir hábito de
 * quem acumula abas em vez de interesse pelo texto.
 */
export function RastreioDeLeitura({ slug, caminho }: Props) {
    useScrollDepth(caminho)

    const emitido = useRef(false)
    const segundos = useRef(0)

    useEffect(() => {
        emitido.current = false
        segundos.current = 0

        const tick = () => {
            if (document.visibilityState !== 'visible' || emitido.current) return
            segundos.current += 1
            if (segundos.current >= SEGUNDOS_PARA_LEITURA) {
                emitido.current = true
                trackBlogRead({ slug, seconds: segundos.current })
                // Mesmo limiar para as duas coisas, de propósito: se 30s de
                // atenção definem uma leitura para a métrica, definem também
                // para a recomendação. Dois critérios diferentes para o mesmo
                // conceito divergem e ninguém percebe.
                registrarLeitura(slug)
            }
        }

        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [slug, caminho])

    return null
}
