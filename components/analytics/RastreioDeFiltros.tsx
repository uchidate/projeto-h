'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackFiltroListagem } from '@/lib/analytics'

/**
 * Filtros ativos numa listagem, sem instrumentar cada controle.
 *
 * Quatro componentes diferentes mudam a URL das listagens (selects, barra de
 * filtro, busca, ordenação). Observar o resultado — os parâmetros — pega todos
 * e os que vierem depois. `utm_*` e afins não são filtro e ficam de fora.
 *
 * A primeira leitura é `entrada` (chegou filtrado: Google, link); as seguintes
 * são `interacao` (filtrou dentro do site).
 */
export function RastreioDeFiltros({ listagem, filtros }: { listagem: string; filtros: readonly string[] }) {
    const params = useSearchParams()
    const primeira = useRef(true)
    const anterior = useRef<string | null>(null)

    useEffect(() => {
        const ativos = filtros
            .filter(chave => params.get(chave))
            .map(chave => `${chave}=${params.get(chave)}`)
            .join('&')

        const origem = primeira.current ? 'entrada' : 'interacao'
        primeira.current = false
        if (ativos === anterior.current) return
        anterior.current = ativos
        // Listagem sem filtro na entrada é a visita comum — a pageview já conta.
        if (!ativos) return
        trackFiltroListagem({ listagem, filtros: ativos, origem })
    }, [params, listagem, filtros])

    return null
}
