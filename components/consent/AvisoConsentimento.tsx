'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { getBannerState, podeGuardarHistorico, resetConsent, subscribeBanner, subscribeConsent } from '@/lib/consent'

function assinar(aoMudar: () => void) {
    const a = subscribeConsent(aoMudar)
    const b = subscribeBanner(aoMudar)
    return () => { a(); b() }
}

/**
 * Aviso para quem quer guardar algo no navegador (sequência, estatísticas, torcidas) mas ainda não
 * permitiu cookies. Não empurra o aceite: só explica o motivo e reabre a escolha, com as duas opções
 * em pé de igualdade, como manda a LGPD. Some quando a pessoa permite ou enquanto o banner já está aberto.
 */
export function AvisoConsentimento({ recurso, className = '' }: { recurso: string; className?: string }) {
    // No servidor e na hidratação assume permitido: o aviso só aparece depois, sem descompasso de HTML.
    const bloqueado = useSyncExternalStore(assinar, () => !podeGuardarHistorico(), () => false)
    const bannerAberto = useSyncExternalStore(subscribeBanner, () => getBannerState() === 'perguntar', () => false)
    if (!bloqueado || bannerAberto) return null
    return (
        <div role="note" className={`border-l-4 border-current px-3 py-2 text-[13px] leading-snug ${className}`}>
            <p>Para guardar {recurso} neste navegador precisamos da sua permissão para cookies. Sem ela, o quiz e o site funcionam normalmente, só não lembram de você.</p>
            <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-bold">
                <button type="button" onClick={resetConsent} className="touch-target underline underline-offset-2">Rever minha escolha</button>
                <Link href="/privacidade" className="touch-target underline underline-offset-2">Como usamos os dados</Link>
            </p>
        </div>
    )
}
