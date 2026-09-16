'use client'

import { useEffect } from 'react'
import { trackCliqueExterno, trackRecirculacao } from '@/lib/analytics'
import { tipoDePagina } from '@/lib/tipoDePagina'

/**
 * Mede cliques em links internos dentro de blocos de recirculação.
 *
 * Um único ouvinte no documento, em vez de instrumentar cada card: um bloco
 * passa a ser medido só por ganhar `data-bloco="nome"`. Instrumentação
 * espalhada some sem deixar rastro — este projeto já perdeu `blog_read` por dois
 * meses assim.
 *
 * Só mede clique DENTRO de um bloco marcado. A primeira versão deixava menu e
 * rodapé de fora por volume; a segunda rodada (2026-09-13) os marcou
 * (`menu`, `rodape`) porque o volume é de no máximo um clique por navegação —
 * nada parecido com os eventos AUTOMÁTICOS de anúncio que afogaram o Umami — e
 * responde quais seções o público de fato usa. Link sem bloco segue sem contar.
 *
 * Link para FORA do site é medido em qualquer lugar (outbound_click).
 *
 * Captura (`capture: true`): o evento é lido antes de qualquer handler que pare
 * a propagação ou navegue; e o Umami envia com `sendBeacon`/keepalive, então a
 * navegação do Next não corta o envio.
 */
export function RastreioDeRecirculacao() {
    useEffect(() => {
        const aoClicar = (evento: MouseEvent) => {
            const alvo = evento.target as Element | null
            const link = alvo?.closest?.('a[href]') as HTMLAnchorElement | null
            if (!link) return

            let destino: URL
            try {
                destino = new URL(link.href, window.location.href)
            } catch {
                return
            }

            // Link para FORA do site conta em qualquer lugar da página, com ou
            // sem bloco: é pouco volume e diz para onde o público sai.
            if (destino.origin !== window.location.origin) {
                if (destino.protocol === 'http:' || destino.protocol === 'https:') {
                    trackCliqueExterno({ host: destino.host, tipoPagina: tipoDePagina(window.location.pathname) })
                }
                return
            }

            const bloco = link.closest('[data-bloco]') as HTMLElement | null
            if (!bloco) return

            // Posição entre destinos DISTINTOS do bloco: um card costuma ter dois
            // links (imagem e título) para o mesmo lugar, e contá-los separados
            // faria o segundo card parecer o quarto.
            const destinos: string[] = []
            for (const a of bloco.querySelectorAll('a[href]')) {
                const caminho = new URL((a as HTMLAnchorElement).href, window.location.href).pathname
                if (!destinos.includes(caminho)) destinos.push(caminho)
            }

            trackRecirculacao({
                bloco: bloco.dataset.bloco ?? 'sem-nome',
                posicao: destinos.indexOf(destino.pathname) + 1,
                destino: destino.pathname,
                origem: window.location.pathname,
            })
        }

        document.addEventListener('click', aoClicar, { capture: true })
        return () => document.removeEventListener('click', aoClicar, { capture: true })
    }, [])

    return null
}
