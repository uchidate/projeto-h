'use client'

import { createContext, useContext, useMemo, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import type { MonetizationSettings } from '@/lib/wordpress/monetization'

const AdsContext = createContext<MonetizationSettings>({
    enabled: false,
    client: '',
    slots: { inline: '', article_sidebar: '', post_suggestion: '', leaderboard: '', sticky: '' },
})

const semAssinatura = () => () => {}
const navegadorAutomatizado = () => navigator.webdriver === true
const noServidor = () => false

export function AdsProvider({
    settings,
    children,
}: {
    settings: MonetizationSettings
    children: ReactNode
}) {
    // Navegador automatizado não pede anúncio. Medido no Umami em 2026-09-14:
    // `hub_feed` teve 1.115 desfechos com 6 preenchidos, quase todos de sessões
    // de 1 página vindas de DE/US/GB/NL/FR. O AdSense já recusava o leilão, e
    // pedido de robô é risco de tráfego inválido na conta. O servidor renderiza
    // como humano; a troca acontece depois da hidratação, sem mismatch.
    const automatizado = useSyncExternalStore(semAssinatura, navegadorAutomatizado, noServidor)
    const value = useMemo(
        () => (automatizado ? { ...settings, enabled: false } : settings),
        [automatizado, settings],
    )
    return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>
}

export function useAds() {
    return useContext(AdsContext)
}
