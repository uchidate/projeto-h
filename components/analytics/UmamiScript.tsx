'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

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
 * ── O que isto NÃO resolve ──────────────────────────────────────────────────
 *
 * O Umami engancha no histórico do navegador. Quem já está com o script
 * carregado e navega para `/entrar` pelo menu ainda gera um pageview: só o
 * carregamento DIRETO é evitado. É exatamente o padrão dos robôs (uma página
 * por sessão, sem segunda), então resolve o caso que existe — e fica dito que
 * não resolve o outro.
 */

/** Rotas onde o tracker não carrega. Prefixo, não igualdade: cobre subrotas. */
const ROTAS_SEM_MEDICAO = ['/entrar', '/cadastro']

type Props = {
    src: string
    websiteId: string
    hostUrl?: string
    domains?: string
}

export function UmamiScript({ src, websiteId, hostUrl, domains }: Props) {
    const caminho = usePathname()
    if (ROTAS_SEM_MEDICAO.some((r) => caminho === r || caminho?.startsWith(`${r}/`))) {
        return null
    }

    return (
        <Script
            src={src}
            data-website-id={websiteId}
            data-host-url={hostUrl}
            data-domains={domains}
            data-do-not-track="true"
            /* Core Web Vitals de usuario real (LCP, INP, CLS). O Lighthouse mede
               um laboratorio; isto mede quem de fato acessa, em rede e aparelho
               reais. */
            data-performance="true"
            strategy="lazyOnload"
        />
    )
}
