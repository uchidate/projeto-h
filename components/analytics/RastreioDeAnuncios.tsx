'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackExperienciaAnuncios, trackVinheta } from '@/lib/analytics'
import { tipoDePagina } from '@/lib/tipoDePagina'
import {
    atribuirDeslocamento, categoria, ehVinheta, juntarResumo, RESUMO_VAZIO, resumoAnuncios, SELETOR_OBSERVADO,
    type Categoria,
} from '@/lib/experiencia-anuncios'

/** Deslocamentos de antes desta página (navegação no App Router) não são dela. */
let primeiraPagina = true

/**
 * Um evento `page_ads` por página vista, ao sair dela: quantos anúncios havia,
 * âncora e vinheta, quanto da página era anúncio, o banner de consentimento, o
 * CLS separado por culpado (anúncio, loja, outro) e, na mesma linha, o resultado:
 * até onde rolou e quanto tempo ficou. Assim a comparação "com × sem" sai de uma
 * linha só, sem cruzar eventos amostrados. Regras em lib/experiencia-anuncios.ts.
 */
export function RastreioDeAnuncios() {
    const caminho = usePathname()

    useEffect(() => {
        const tipo = tipoDePagina(caminho)
        const inicio = primeiraPagina ? 0 : performance.now()
        primeiraPagina = false
        const raiz = document.documentElement
        let resumo = { ...RESUMO_VAZIO }
        const cls: Record<Categoria, number> = { anuncio: 0, loja: 0, outro: 0 }
        const redimensionou: Record<Categoria, number[]> = { anuncio: [], loja: [], outro: [] }
        let rolagem = 0
        let visivelMs = 0
        let visivelDesde: number | null = document.visibilityState === 'visible' ? performance.now() : null
        let vinheta = false
        let bannerAberto = raiz.hasAttribute('data-consent-pendente')
        let enviado = false

        const amostrar = () => {
            try { resumo = juntarResumo(resumo, resumoAnuncios(document, window)) } catch { /* DOM em transição */ }
            if (raiz.hasAttribute('data-consent-pendente')) bannerAberto = true
        }
        const medirRolagem = () => {
            const total = raiz.scrollHeight - window.innerHeight
            const pct = total > 0 ? Math.round((100 * window.scrollY) / total) : 100
            if (pct > rolagem) rolagem = Math.min(100, pct)
        }
        const aoMudarHash = () => {
            if (vinheta || !ehVinheta(window.location.hash)) return
            vinheta = true
            trackVinheta(tipo)
        }

        const ro = 'ResizeObserver' in window ? new ResizeObserver(entradas => {
            const agora = performance.now()
            for (const e of entradas) {
                const c = categoria(e.target)
                if (c !== 'outro') redimensionou[c] = [...redimensionou[c].slice(-19), agora]
            }
        }) : null
        const observar = (el: Element) => {
            if (el.matches(SELETOR_OBSERVADO)) ro?.observe(el)
            el.querySelectorAll(SELETOR_OBSERVADO).forEach(x => ro?.observe(x))
        }
        observar(document.body)
        const mo = 'MutationObserver' in window ? new MutationObserver(mudancas => {
            for (const m of mudancas) m.addedNodes.forEach(n => { if (n instanceof Element) observar(n) })
        }) : null
        mo?.observe(document.body, { childList: true, subtree: true })

        let po: PerformanceObserver | null = null
        try {
            po = new PerformanceObserver(lista => {
                for (const e of lista.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean; sources?: Array<{ node?: Node | null }> }>) {
                    if (e.hadRecentInput || e.startTime < inicio) continue
                    const fontes = (e.sources ?? []).map(s => categoria(s.node instanceof Element ? s.node : s.node?.parentElement))
                    cls[atribuirDeslocamento(e.startTime, fontes, redimensionou)] += e.value
                }
            })
            po.observe({ type: 'layout-shift', buffered: true })
        } catch { po = null /* navegador sem layout-shift (Safari): CLS fica 0 e não conta */ }

        const enviar = () => {
            if (visivelDesde !== null) { visivelMs += performance.now() - visivelDesde; visivelDesde = null }
            amostrar()
            medirRolagem()
            if (enviado || visivelMs < 1000) return
            enviado = true
            trackExperienciaAnuncios({
                ...resumo,
                vinheta,
                bannerAberto,
                bannerAbertoAoSair: raiz.hasAttribute('data-consent-pendente'),
                clsMedido: po !== null,
                cls,
                rolagemPct: rolagem,
                segundos: Math.round(visivelMs / 1000),
                tipoPagina: tipo,
            })
        }
        const aoMudarVisibilidade = () => {
            if (document.visibilityState === 'hidden') enviar()
            else if (!enviado) visivelDesde = performance.now()
        }

        const relogio = window.setInterval(amostrar, 4000)
        let quadro = 0
        const aoRolar = () => { if (!quadro) quadro = requestAnimationFrame(() => { quadro = 0; medirRolagem() }) }
        aoMudarHash()
        window.addEventListener('scroll', aoRolar, { passive: true })
        window.addEventListener('hashchange', aoMudarHash)
        document.addEventListener('visibilitychange', aoMudarVisibilidade)
        window.addEventListener('pagehide', enviar)
        return () => {
            enviar()
            window.clearInterval(relogio)
            if (quadro) cancelAnimationFrame(quadro)
            ro?.disconnect(); mo?.disconnect(); po?.disconnect()
            window.removeEventListener('scroll', aoRolar)
            window.removeEventListener('hashchange', aoMudarHash)
            document.removeEventListener('visibilitychange', aoMudarVisibilidade)
            window.removeEventListener('pagehide', enviar)
        }
    }, [caminho])

    return null
}
