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
    // Navegador automatizado não pede anúncio. Medido no Umami em 2026-09-14:
    // `hub_feed` teve 1.115 desfechos com 6 preenchidos, quase todos de sessões
    // de 1 página vindas de DE/US/GB/NL/FR. O AdSense já recusava o leilão, e
    // pedido de robô é risco de tráfego inválido na conta.
    //
    // `useSyncExternalStore` (versão anterior) devia ser hydration-safe por
    // design, mas mostrou mismatch real (server: <aside>, client: <section>)
    // em 2026-09-30 num bloco atrás de Suspense/streaming — a garantia de
    // "primeiro render do cliente usa getServerSnapshot" não se sustentou
    // nesse caminho. `hidratado` via useEffect é mais grosseiro mas à prova
    // de bala: false no servidor E no primeiro render do cliente, sempre,
    // não importa o que aconteceu antes da montagem — a checagem de
    // `navigator.webdriver` só roda DEPOIS, como uma atualização normal.
    const [hidratado, setHidratado] = useState(false)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gate de hidratação: precisa distinguir o 1º render (SSR-safe) do restante
    useEffect(() => setHidratado(true), [])
    const automatizado = hidratado && navigator.webdriver === true
    const value = useMemo(
        () => (automatizado ? { ...settings, enabled: false } : settings),
        [automatizado, settings],
    )
    return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>
}

export function useAds() {
    return useContext(AdsContext)
}

/** Desliga os anúncios de tudo o que estiver dentro (página sem conteúdo suficiente). */
export function SemAnuncios({ children }: { children: ReactNode }) {
    const pai = useAds()
    const value = useMemo(() => ({ ...pai, enabled: false }), [pai])
    return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>
}
