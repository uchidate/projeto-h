'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Ao abrir outra página pelo roteador, volta ao topo.
 *
 * O <Link> do Next mantém a rolagem quando o primeiro elemento da página nova
 * ainda está à vista na posição atual (documentado em Link › scroll), então
 * abrir uma ficha a partir do meio de uma lista deixava a ficha rolada. Aqui o
 * topo vale sempre que o caminho muda; mudança só de query (paginação, filtro)
 * não passa por aqui e mantém a posição. Voltar/avançar no histórico e links com
 * âncora (#) ficam com o navegador.
 */
export function RolagemAoTopo() {
    const caminho = usePathname()
    const anterior = useRef(caminho)
    const historico = useRef(false)

    useEffect(() => {
        const aoVoltar = () => { historico.current = true }
        window.addEventListener('popstate', aoVoltar)
        return () => window.removeEventListener('popstate', aoVoltar)
    }, [])

    useEffect(() => {
        if (anterior.current === caminho) return
        anterior.current = caminho
        if (historico.current) { historico.current = false; return }
        if (window.location.hash) return
        window.scrollTo(0, 0)
    }, [caminho])

    return null
}
