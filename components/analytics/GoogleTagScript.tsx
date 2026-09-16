'use client'

import Script from 'next/script'
import { useSyncExternalStore } from 'react'
import { hasCertifiedCmp, readConsent, subscribeBanner } from '@/lib/consent'

/**
 * Carrega o Google Tag — só para quem ele consegue medir.
 *
 * ── O que foi medido ────────────────────────────────────────────────────────
 *
 * Home no celular, 2026-09-12: 846 KB de JavaScript, 65% de terceiros.
 *
 *   nosso            300 KB
 *   AdSense          273 KB
 *   Google Tag       174 KB   ← este
 *   Funding Choices   81 KB
 *
 * Os 174 KB iam para TODO visitante. Mas na semana anterior 216 sessões viram
 * o banner e 8 decidiram: sem decisão o Consent Mode fica em `gcs=G100` e o GA
 * não usa o dado. Ou seja, ~95% dos visitantes baixavam 174 KB para alimentar
 * uma ferramenta que, para eles, está cega.
 *
 * ── Por que adiar é seguro ──────────────────────────────────────────────────
 *
 * O consentimento PADRÃO é definido por um script inline na head, que empurra
 * para o `dataLayer` — independente do gtag.js. `applyConsent` também empurra.
 * A fila fica guardada e é processada quando o script carrega, então quem
 * aceita depois tem o consentimento aplicado e o pageview contado.
 *
 * ── Por que NÃO basta olhar a decisão local ─────────────────────────────────
 *
 * No EEE/Reino Unido quem pergunta é o CMP certificado do Google, que escreve
 * sinais TCF e NÃO escreve no nosso localStorage. Adiar só pela decisão local
 * cortaria exatamente o tráfego consentido europeu — a população onde o GA
 * ainda funciona. Por isso a regra tem duas pernas.
 *
 * ── O que se perde, dito na cara ────────────────────────────────────────────
 *
 * Os pings sem cookie que alimentam a modelagem comportamental do GA4. A
 * modelagem exige volume que este site não tem (~930 pageviews/dia, a maioria
 * robô, contra o patamar de milhares/dia por vários dias). Trocar uma
 * modelagem que não se sustenta por 174 KB em 95% dos carregamentos é um
 * negócio bom — mas é uma troca, não um almoço grátis.
 *
 * A medição de audiência que de fato funciona é o Umami, que não depende de
 * consentimento porque não grava cookie nem identifica visitante.
 */

function deveCarregar(): boolean {
    // CMP certificado governando: comportamento igual ao de antes.
    if (hasCertifiedCmp()) return true
    return readConsent()?.decision === 'granted'
}

/** No servidor nada carrega: a decisão só existe no navegador. */
function noServidor(): boolean {
    return false
}

export function GoogleTagScript({ id }: { id: string }) {
    // `subscribeBanner` já notifica nas duas fontes que importam aqui: a
    // decisão local e a resposta do CMP.
    const carregar = useSyncExternalStore(subscribeBanner, deveCarregar, noServidor)
    if (!carregar) return null

    return (
        <>
            {/* lazyOnload: GA fora do caminho crítico — não compete com
                hidratação nem com os anúncios. O pageview continua contando
                porque dispara após o window.load. */}
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="lazyOnload" />
            <Script id="gtag-init" strategy="lazyOnload">
                {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`}
            </Script>
        </>
    )
}
