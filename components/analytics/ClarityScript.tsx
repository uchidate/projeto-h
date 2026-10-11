'use client'

import Script from 'next/script'
import { useEffect, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { readConsent, subscribeBanner } from '@/lib/consent'
import { rotaSemMedicao } from '@/lib/umami-filtro'

/**
 * Microsoft Clarity — gravação de sessão e mapa de calor.
 *
 * ── Por que passa pelo banner (diferente do Umami) ──────────────────────────
 *
 * O Umami não grava cookie nem identifica visitante. O Clarity faz as duas
 * coisas: grava cookies (`_clck`, `_clsk`) e reproduz a sessão de cada pessoa.
 * Isso é dado pessoal sob a LGPD e o GDPR, então só carrega com aceite
 * EXPLÍCITO registrado em `hh-consent-v1`.
 *
 * Regra mais estrita que a do Google Tag de propósito: lá o CMP certificado do
 * Google governa o EEE e o gtag.js sabe lidar com o sinal; o Clarity não lê TCF.
 * Quem respondeu só ao CMP do Google não tem decisão local e, por isso, não é
 * gravado — perde-se amostra, não se ganha risco.
 *
 * ── Rotas excluídas ─────────────────────────────────────────────────────────
 *
 * Mesma lista do Umami (`/entrar`, `/cadastro`): nenhuma gravação onde alguém
 * digita senha, e é onde estavam os robôs.
 *
 * ── Revogação ───────────────────────────────────────────────────────────────
 *
 * Se a pessoa retira o consentimento depois de o script carregar, `consent`
 * falso manda o Clarity apagar os cookies e parar de gravar.
 */

declare global {
    interface Window {
        clarity?: (...args: unknown[]) => void
    }
}

function consentiu(): boolean {
    return readConsent()?.decision === 'granted'
}

/** No servidor nada carrega: a decisão só existe no navegador. */
function noServidor(): boolean {
    return false
}

export function ClarityScript({ projectId }: { projectId: string }) {
    const caminho = usePathname()
    const aceitou = useSyncExternalStore(subscribeBanner, consentiu, noServidor)
    const excluida = caminho !== null && rotaSemMedicao(caminho)
    const ativo = aceitou && !excluida

    useEffect(() => {
        // Só há o que desfazer se o script já carregou.
        if (!aceitou && typeof window.clarity === 'function') window.clarity('consent', false)
    }, [aceitou])

    if (!ativo) return null

    return (
        <Script id="clarity-init" strategy="lazyOnload">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(projectId)});window.clarity("consentv2",{ad_Storage:"granted",analytics_Storage:"granted"});`}
        </Script>
    )
}
