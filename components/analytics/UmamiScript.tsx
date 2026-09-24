'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { rotaSemMedicao, umamiAntesDeEnviar } from '@/lib/umami-filtro'

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
 * O carregamento direto é coberto por não montar o script (`excluida`). Quem já
 * está com o script ativo e navega para `/entrar` pelo menu é coberto por
 * `data-before-send`, que descarta o envio quando o caminho está na lista.
 *
 * ── Por que NÃO `data-auto-track="false"` ───────────────────────────────────
 *
 * O PR #56 (2026-09-22) desligou o rastreamento automático para contar o
 * pageview à mão. Efeito colateral que ninguém viu: no Umami v3 a coleta de
 * Web Vitals (`data-performance`) é iniciada DENTRO da inicialização do
 * rastreamento automático. Sem ele, a aba Desempenho parou: até 22/09 chegavam
 * de 117 a 244 medições de LCP por dia; a partir de 23/09, zero, com o resto
 * dos eventos normal. Provado com o script real num navegador: auto-track
 * desligado → 0 eventos de desempenho; ligado → eventos de desempenho, com as
 * rotas excluídas descartadas pelo `before-send`.
 *
 * O gancho precisa existir em `window` antes do script carregar; por isso é
 * registrado no escopo do módulo, e o script entra com `lazyOnload`.
 */

declare global {
    interface Window {
        umamiAntesDeEnviar?: typeof umamiAntesDeEnviar
    }
}

if (typeof window !== 'undefined') window.umamiAntesDeEnviar = umamiAntesDeEnviar


type Props = {
    src: string
    websiteId: string
    hostUrl?: string
    domains?: string
}

export function UmamiScript({ src, websiteId, hostUrl, domains }: Props) {
    const caminho = usePathname()
    const excluida = caminho !== null && rotaSemMedicao(caminho)

    if (excluida) return null

    return (
        <Script
            src={src}
            data-website-id={websiteId}
            data-host-url={hostUrl}
            data-domains={domains}
            data-do-not-track="true"
            data-before-send="umamiAntesDeEnviar"
            /* Core Web Vitals de usuario real (LCP, INP, CLS). O Lighthouse mede
               um laboratorio; isto mede quem de fato acessa, em rede e aparelho
               reais. */
            data-performance="true"
            strategy="lazyOnload"
        />
    )
}
