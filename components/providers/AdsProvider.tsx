'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { MonetizationSettings } from '@/lib/wordpress/monetization'

const AdsContext = createContext<MonetizationSettings>({
    enabled: false,
    client: '',
    slots: { inline: '', article_sidebar: '', post_suggestion: '', leaderboard: '', sticky: '' },
})

export function AdsProvider({
    settings,
    children,
}: {
    settings: MonetizationSettings
    children: ReactNode
}) {
    return <AdsContext.Provider value={settings}>{children}</AdsContext.Provider>
}

export function useAds() {
    return useContext(AdsContext)
}

/**
 * Navegador automatizado não pede anúncio. Medido no Umami em 2026-09-14:
 * `hub_feed` teve 1.115 desfechos com 6 preenchidos, quase todos de sessões
 * de 1 página vindas de DE/US/GB/NL/FR. O AdSense já recusava o leilão, e
 * pedido de robô é risco de tráfego inválido na conta.
 *
 * Local a CADA slot de anúncio (não no AdsProvider/contexto compartilhado):
 * um gate de hidratação num estado COMPARTILHADO significa que, quando um
 * slot atrás de Suspense monta depois (streaming), o efeito de OUTRO slot já
 * pode ter virado o estado compartilhado — esse slot novo nasce direto
 * "hidratado", divergindo do HTML que o servidor mandou pra ELE. Confirmado
 * em 2026-09-30: os slots acima da dobra hidratavam certo, mas
 * `home_below_fold` (atrás de `<Suspense>`) já nascia com `enabled: false` no
 * cliente contra `true` no servidor. Estado local por instância evita a
 * corrida: cada slot só olha pro seu PRÓPRIO efeito, nunca o de outro.
 */
export function useNaoAutomatizado(): boolean {
    const [hidratado, setHidratado] = useState(false)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gate de hidratação: precisa distinguir o 1º render (SSR-safe) do restante
    useEffect(() => setHidratado(true), [])
    return hidratado && navigator.webdriver === true
}

/** Desliga os anúncios de tudo o que estiver dentro (página sem conteúdo suficiente). */
export function SemAnuncios({ children }: { children: ReactNode }) {
    const pai = useAds()
    const value = useMemo(() => ({ ...pai, enabled: false }), [pai])
    return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>
}
