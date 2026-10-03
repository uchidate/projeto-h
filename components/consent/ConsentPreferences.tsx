'use client'

import { intlLocale } from '@/lib/i18n/format'
import { useSyncExternalStore } from 'react'
import { trackConsentDecidido } from '@/lib/analytics'
import { getServerConsent, readConsent, resetConsent, saveConsent, subscribeConsent } from '@/lib/consent'

const ROTULO: Record<string, string> = {
    granted: 'Você aceitou cookies de medição e anúncios personalizados.',
    denied: 'Você recusou cookies de medição e anúncios personalizados.',
}

/**
 * Controle de revogação exigido pela LGPD e pelo GDPR: o consentimento tem que
 * ser tão fácil de retirar quanto foi de dar.
 */
export function ConsentPreferences() {
    const estado = useSyncExternalStore(subscribeConsent, readConsent, getServerConsent)

    const registrado = estado?.at
        ? new Date(estado.at).toLocaleDateString(intlLocale(), { day: '2-digit', month: 'long', year: 'numeric' })
        : null

    return (
        <div className="space-y-3">
            <p className="text-muted">
                {estado ? ROTULO[estado.decision] : 'Você ainda não registrou uma escolha; por padrão, nada além do essencial é armazenado.'}
                {registrado && ` Registrado em ${registrado}.`}
            </p>
            <div className="flex flex-wrap gap-2">
                {estado?.decision !== 'granted' && (
                    <button
                        onClick={() => { trackConsentDecidido({ decision: 'granted', origem: 'preferencias' }); saveConsent('granted') }}
                        className="text-[13px] px-4 py-1.5 rounded-full border border-border text-foreground hover:bg-surface transition-colors"
                    >
                        Aceitar cookies
                    </button>
                )}
                {estado?.decision !== 'denied' && (
                    <button
                        onClick={() => { trackConsentDecidido({ decision: 'denied', origem: 'preferencias' }); saveConsent('denied') }}
                        className="text-[13px] px-4 py-1.5 rounded-full border border-border text-foreground hover:bg-surface transition-colors"
                    >
                        Recusar cookies
                    </button>
                )}
                {estado && (
                    <button
                        onClick={resetConsent}
                        className="text-[13px] px-4 py-1.5 rounded-full border border-border text-muted hover:bg-surface transition-colors"
                    >
                        Apagar minha escolha
                    </button>
                )}
            </div>
        </div>
    )
}
