'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { PlayerDock, type DadosDoDock } from '@/components/blog/PlayerDock'
import { carregarSpotifyIframeApi, uriDoEmbed, type SpotifyController } from '@/lib/blog/spotifyIframeApi'

interface Tocando extends DadosDoDock {
    id: string
}

/** Capa do álbum: a imagem de destaque está embutida no `og:image` (cartão gerado) como parâmetro `image`; o corte central do `object-cover` mostra só a arte. */
function capaDoArtigo() {
    const og = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content
    try { return (og && new URL(og).searchParams.get('image')) || undefined } catch { return undefined }
}

/** Ids dos cartões de faixa, na ordem do texto. */
function ordem() {
    return Array.from(document.querySelectorAll<HTMLElement>('.oc-track[id]')).map((el) => el.id)
}

/**
 * Players do Spotify do artigo.
 *
 * 1. Adiados (`iframe[data-src]`): só ganham o `src` a 300 px da tela.
 * 2. Ao chegar perto, viram um controle da iFrame API do Spotify (se ela carregar; senão fica o iframe
 *    comum, que toca igual). Com isso o site sabe qual faixa está tocando: pausa a anterior quando
 *    outra começa, destaca o cartão e o atalho da faixa, e mostra uma barra fixa com play/pausa
 *    enquanto o fã rola o texto.
 */
export function EmbedsSobDemanda() {
    const t = useTranslations('client.playerDock')
    const [atual, setAtual] = useState<Tocando | null>(null)
    const controles = useRef(new Map<string, SpotifyController>())
    const capas = useRef(new Map<string, string>())
    const urls = useRef(new Map<string, string>())

    useEffect(() => {
        const mapa = controles.current
        const pendentes = Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe[data-src]'))
        if (!pendentes.length) return
        let ativo = true

        const comum = (iframe: HTMLIFrameElement) => {
            const src = iframe.dataset.src
            if (src) iframe.src = src
            iframe.removeAttribute('data-src')
        }

        const ativar = async (iframe: HTMLIFrameElement, indice: number) => {
            const src = iframe.dataset.src ?? ''
            const uri = uriDoEmbed(src)
            const api = uri ? await carregarSpotifyIframeApi() : null
            if (!ativo || !api || !uri || !iframe.isConnected) return comum(iframe)
            const cartao = iframe.closest<HTMLElement>('.oc-track')
            const bloco = iframe.closest<HTMLElement>('[data-article-block]')
            const id = cartao?.id || bloco?.id || `player-${indice}`
            const titulo = cartao?.querySelector('h3')?.textContent?.replace(/\s+/g, ' ').trim().replace(/^\d+\.\s*/, '') || t('album')
            urls.current.set(id, src)
            const altura = Number(iframe.getAttribute('height')) || 80
            const lugar = document.createElement('div')
            iframe.replaceWith(lugar)
            api.createController(lugar, { uri, width: '100%', height: altura }, (controle) => {
                if (!ativo) return controle.destroy()
                mapa.set(id, controle)
                controle.addListener('playback_update', (e) => {
                    const d = e.data
                    if (d?.isPaused === false) {
                        mapa.forEach((outro, chave) => { if (chave !== id) outro.pause() })
                        const faixas = ordem()
                        setAtual((prev) => ({
                            id, titulo, pausado: false, capa: capas.current.get(id) ?? capaDoArtigo(),
                            numero: faixas.indexOf(id) >= 0 ? faixas.indexOf(id) + 1 : undefined,
                            total: faixas.length || undefined,
                            posicao: d.position ?? (prev?.id === id ? prev.posicao : 0),
                            duracao: d.duration ?? (prev?.id === id ? prev.duracao : 0),
                        }))
                    } else if (d?.isPaused === true) {
                        setAtual((prev) => (prev?.id === id ? { ...prev, pausado: true, posicao: d.position ?? prev.posicao } : prev))
                    }
                })
            })
        }

        // Plano B: se o evento do Spotify não chegar, clicar dentro do player de uma faixa já pausa as outras.
        const aoFocarIframe = () => window.setTimeout(() => {
            const foco = document.activeElement
            if (!(foco instanceof HTMLIFrameElement)) return
            const dono = foco.closest<HTMLElement>('.oc-track') ?? foco.closest<HTMLElement>('[data-article-block]')
            const idDono = dono?.id
            if (!idDono || !mapa.has(idDono)) return
            mapa.forEach((outro, chave) => { if (chave !== idDono) outro.pause() })
        }, 0)
        window.addEventListener('blur', aoFocarIframe)

        if (typeof IntersectionObserver === 'undefined') {
            pendentes.forEach(comum)
            return
        }
        const observador = new IntersectionObserver((entradas) => {
            for (const entrada of entradas) {
                if (!entrada.isIntersecting) continue
                const iframe = entrada.target as HTMLIFrameElement
                observador.unobserve(iframe)
                void ativar(iframe, pendentes.indexOf(iframe))
            }
        }, { rootMargin: '300px 0px' })
        pendentes.forEach((iframe) => observador.observe(iframe))
        return () => {
            ativo = false
            window.removeEventListener('blur', aoFocarIframe)
            observador.disconnect()
            mapa.forEach((c) => c.destroy())
            mapa.clear()
        }
    }, [t])

    // Arte quadrada da faixa: o oEmbed do Spotify devolve a capa do álbum em 300 px (a imagem de destaque do artigo é 16:9 e cortava a arte).
    const idTocando = atual?.id
    useEffect(() => {
        if (!idTocando || capas.current.has(idTocando)) return
        const src = urls.current.get(idTocando)
        if (!src) return
        let vivo = true
        const alvo = src.replace('/embed/', '/').split('?')[0]
        fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(alvo)}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((j: { thumbnail_url?: string } | null) => {
                if (!vivo || !j?.thumbnail_url) return
                capas.current.set(idTocando, j.thumbnail_url)
                setAtual((prev) => (prev?.id === idTocando ? { ...prev, capa: j.thumbnail_url } : prev))
            })
            .catch(() => {})
        return () => { vivo = false }
    }, [idTocando])

    // Destaca o cartão e o atalho da faixa que está tocando.
    useEffect(() => {
        document.querySelectorAll('[data-tocando]').forEach((el) => el.removeAttribute('data-tocando'))
        document.querySelectorAll('[data-indice-de-faixas] a[aria-current]').forEach((el) => el.removeAttribute('aria-current'))
        if (!atual || atual.pausado) return
        document.getElementById(atual.id)?.setAttribute('data-tocando', 'true')
        document.querySelector(`[data-indice-de-faixas] a[href="#${CSS.escape(atual.id)}"]`)?.setAttribute('aria-current', 'true')
    }, [atual])

    const alternar = useCallback(() => { if (atual) controles.current.get(atual.id)?.togglePlay() }, [atual])
    const ir = useCallback(() => {
        if (!atual) return
        const reduzido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        document.getElementById(atual.id)?.scrollIntoView({ behavior: reduzido ? 'auto' : 'smooth', block: 'center' })
    }, [atual])
    const fechar = useCallback(() => {
        if (atual) controles.current.get(atual.id)?.pause()
        setAtual(null)
    }, [atual])

    const buscar = useCallback((segundos: number) => { if (atual) controles.current.get(atual.id)?.seek(segundos) }, [atual])
    const vizinha = useCallback((passo: number) => {
        if (!atual) return
        const faixas = ordem()
        const alvo = faixas[faixas.indexOf(atual.id) + passo]
        if (!alvo) return
        controles.current.get(atual.id)?.pause()
        document.getElementById(alvo)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // O player da faixa de destino só existe depois de chegar perto da tela; tenta até ele aparecer.
        let tentativas = 0
        const iniciar = window.setInterval(() => {
            const controle = controles.current.get(alvo)
            if (controle) { controle.play(); window.clearInterval(iniciar) } else if (++tentativas > 20) window.clearInterval(iniciar)
        }, 250)
    }, [atual])

    if (!atual) return null
    const faixas = ordem()
    const i = faixas.indexOf(atual.id)
    return (
        <PlayerDock
            {...atual}
            onAlternar={alternar}
            onIr={ir}
            onFechar={fechar}
            onBuscar={buscar}
            onAnterior={i > 0 ? () => vizinha(-1) : undefined}
            onProxima={i >= 0 && i < faixas.length - 1 ? () => vizinha(1) : undefined}
        />
    )
}
