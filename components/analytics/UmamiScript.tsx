'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { trackPageview } from '@/lib/analytics'

/**
 * Carrega o Umami — exceto nas rotas de autenticação.
 *
 * ── Por que excluir `/entrar` e `/cadastro` ─────────────────────────────────
 *
 * Elas eram as DUAS PÁGINAS MAIS ACESSADAS do site. Medido em 2026-09-12, numa
 * janela de 7 dias:
 *
 *   /cadastro   1.395 pageviews
 *   /entrar     1.339
 *   /blog         505
 *   /             114
 *
 * 2.734 de 6.093 pageviews — 45% de tudo — em duas telas que não são conteúdo.
 * São robôs que executam JavaScript, entram uma vez e não voltam.
 *
 * Verifiquei que NÃO é ataque antes de silenciar a medição: o WordPress tem 6
 * usuários no total e 1 registro em 30 dias, então os 1.395 acessos a
 * `/cadastro` não viraram conta nenhuma. O limite de taxa do Traefik já cobre
 * essas rotas (10/min por IP). Fosse credential stuffing, parar de medir seria
 * apagar a evidência — por isso a checagem veio antes.
 *
 * ── Por que isto não é "esconder o problema" ────────────────────────────────
 *
 * A correção de verdade é barrar o robô na borda (Cloudflare). Mas enquanto ele
 * entra, cada número do painel carrega 45% de lixo: páginas por sessão, origem
 * do tráfego, taxa de rejeição, tudo. Duas telas sem valor analítico contaminam
 * a leitura de todas as outras.
 *
 * De quebra: nenhum script de terceiro carrega na página onde alguém digita
 * senha. É a decisão certa por privacidade mesmo que não houvesse robô.
 *
 * ── Navegação SPA para `/entrar`/`/cadastro` ────────────────────────────────
 *
 * `data-auto-track="false"` desliga o rastreamento automático do Umami
 * (inclusive o gancho no histórico do navegador) e o pageview passa a ser
 * disparado por nós, no efeito abaixo, por caminho — a mesma lista que
 * decide se o script CARREGA agora também decide se cada navegação vira
 * pageview. Até 2026-09-22 só o carregamento direto era coberto: quem já
 * estava com o script ativo e navegava para `/entrar` pelo menu ainda gerava
 * pageview, porque o gancho automático do Umami não conhecia esta lista.
 */

/** Rotas onde o tracker não carrega nem conta pageview. Prefixo, não igualdade: cobre subrotas. */
const ROTAS_SEM_MEDICAO = ['/entrar', '/cadastro']

type Props = {
    src: string
    websiteId: string
    hostUrl?: string
    domains?: string
}

export function UmamiScript({ src, websiteId, hostUrl, domains }: Props) {
    const caminho = usePathname()
    const excluida = ROTAS_SEM_MEDICAO.some((r) => caminho === r || caminho?.startsWith(`${r}/`))

    useEffect(() => {
        if (excluida) return
        trackPageview()
    }, [caminho, excluida])

    if (excluida) return null

    return (
        <Script
            src={src}
            data-website-id={websiteId}
            data-host-url={hostUrl}
            data-domains={domains}
            data-do-not-track="true"
            data-auto-track="false"
            /* Core Web Vitals de usuario real (LCP, INP, CLS). O Lighthouse mede
               um laboratorio; isto mede quem de fato acessa, em rede e aparelho
               reais. */
            data-performance="true"
            strategy="lazyOnload"
        />
    )
}
