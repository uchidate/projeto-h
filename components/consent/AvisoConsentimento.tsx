'use client'

import Link from '@/components/i18n/LocalizedLink'
import { useSyncExternalStore } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { getBannerState, podeGuardarHistorico, resetConsent, subscribeBanner, subscribeConsent } from '@/lib/consent'
import type { Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'

function assinar(aoMudar: () => void) {
    const a = subscribeConsent(aoMudar)
    const b = subscribeBanner(aoMudar)
    return () => { a(); b() }
}

/**
 * Aviso para quem quer guardar algo no navegador (sequência, estatísticas, torcidas) mas ainda não
 * permitiu cookies. Não empurra o aceite: só explica o motivo e reabre a escolha, com as duas opções
 * em pé de igualdade, como manda a LGPD. Some quando a pessoa permite ou enquanto o banner já está aberto.
 * `recurso` é a chave (em `client.consentimento`) do que seria guardado.
 */
export function AvisoConsentimento({ recurso, className = '' }: { recurso: 'sequencia' | 'placar'; className?: string }) {
    const t = useTranslations('client.consentimento')
    const locale = useLocale() as Locale
    // No servidor e na hidratação assume permitido: o aviso só aparece depois, sem descompasso de HTML.
    const bloqueado = useSyncExternalStore(assinar, () => !podeGuardarHistorico(), () => false)
    const bannerAberto = useSyncExternalStore(subscribeBanner, () => getBannerState() === 'perguntar', () => false)
    if (!bloqueado || bannerAberto) return null
    return (
        <div role="note" className={`border-l-4 border-current px-3 py-2 text-[13px] leading-snug ${className}`}>
            <p>{t('texto', { recurso: t(recurso) })}</p>
            <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-bold">
                <button type="button" onClick={resetConsent} className="touch-target underline underline-offset-2">{t('rever')}</button>
                <Link href={href('privacy', undefined, locale)} className="touch-target underline underline-offset-2">{t('privacidade')}</Link>
            </p>
        </div>
    )
}
