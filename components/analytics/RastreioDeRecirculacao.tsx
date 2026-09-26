'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { trackCliqueExterno, trackRecirculacao, trackRecirculacaoVisto } from '@/lib/analytics'
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
/**
 * Blocos que ficam na tela em toda página: contar a exibição deles seria um
 * evento por navegação sem dizer nada (a taxa de clique deles já sai do clique).
 */
const SEM_EXIBICAO = new Set(['menu', 'rodape'])

export function RastreioDeRecirculacao() {
    const caminho = usePathname() ?? ''
    // Estado da página atual, compartilhado entre o observador (exibição) e o
    // ouvinte de clique: o clique precisa saber se o bloco já tinha aparecido e
    // quanto tempo a página tinha quando ele aconteceu.
    const vistosRef = useRef<Set<string>>(new Set())
    const inicioRef = useRef(0)

    // Exibição: um observador para todos os `[data-bloco]`, uma vez por bloco e por
    // página. O bloco só conta quando o topo dele passa de 25% acima da borda
    // inferior da tela — com a tela inteira como limite, o rodapé de uma página
    // curta contaria como visto sem o leitor ter rolado nada.
    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return

        const vistos = new Set<string>()
        vistosRef.current = vistos
        inicioRef.current = performance.now()
        const alvos = new Map<Element, string>()
        for (const bloco of document.querySelectorAll<HTMLElement>('[data-bloco]')) {
            const nome = bloco.dataset.bloco ?? 'sem-nome'
            if (SEM_EXIBICAO.has(nome)) continue
            // `display: contents` não gera caixa e o observador nunca dispara nele:
            // observa os filhos, que representam o bloco.
            const caixa = getComputedStyle(bloco).display === 'contents' ? [...bloco.children] : [bloco]
            for (const el of caixa) alvos.set(el, nome)
        }
        if (alvos.size === 0) return

        const observador = new IntersectionObserver((entradas) => {
            for (const entrada of entradas) {
                if (!entrada.isIntersecting) continue
                const nome = alvos.get(entrada.target)
                if (!nome || vistos.has(nome)) continue
                vistos.add(nome)
                trackRecirculacaoVisto({ bloco: nome, origem: window.location.pathname })
            }
        }, { rootMargin: '0px 0px -25% 0px', threshold: 0.1 })
        for (const el of alvos.keys()) observador.observe(el)

        return () => observador.disconnect()
    }, [caminho])

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

            const nomeDoBloco = bloco.dataset.bloco ?? 'sem-nome'
            trackRecirculacao({
                bloco: nomeDoBloco,
                // Menu e rodapé não têm exibição registrada: "não visto" seria mentira.
                visto: SEM_EXIBICAO.has(nomeDoBloco) ? undefined : vistosRef.current.has(nomeDoBloco),
                segundos: Math.round((performance.now() - inicioRef.current) / 1000),
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
