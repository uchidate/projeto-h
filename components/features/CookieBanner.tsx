'use client'

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import {
    getBannerState,
    getServerBannerState,
    saveConsent,
    subscribeBanner,
    type ConsentDecision,
} from '@/lib/consent'
import { trackConsentBannerExibido, trackConsentDecidido } from '@/lib/analytics'

export function CookieBanner() {
    // Decisão salva e chegada do CMP do Google são estado externo ao React;
    // o componente só lê o snapshot. Ver lib/consent.ts.
    const estado = useSyncExternalStore(subscribeBanner, getBannerState, getServerBannerState)

    const decidir = useCallback((decision: ConsentDecision) => {
        // Antes de salvar: salvar dispara re-render que desmonta o banner, e o
        // evento poderia se perder no meio.
        trackConsentDecidido({ decision, origem: 'banner' })
        saveConsent(decision)
    }, [])

    const visible = estado === 'perguntar'

    // Uma vez por montagem, nao por render. Sem o ref, qualquer re-render
    // enquanto o banner esta aberto inflaria o denominador e a taxa de aceite
    // sairia menor do que e.
    const jaRegistrado = useRef(false)
    useEffect(() => {
        if (!visible || jaRegistrado.current) return
        jaRegistrado.current = true
        trackConsentBannerExibido()
    }, [visible])

    if (!visible) return null

    // Banner em destaque, por decisão de produto (2026-09-13): o banner discreto
    // no rodapé era ignorado, e sem decisão o visitante fica no padrão negado —
    // sem medição de audiência e só com anúncio não personalizado.
    //
    // O limite legal que este desenho respeita: pela LGPD o consentimento tem de
    // ser LIVRE. Então o incômodo vem do fundo escurecido e do tamanho, nunca de
    // dificultar a recusa. Os dois botões têm o MESMO tamanho e o mesmo peso de
    // clique; Aceitar só se distingue pela cor. Esconder ou encolher o Recusar
    // seria padrão enganoso — o tipo de coisa que a ANPD e o próprio Google
    // penalizam.
    //
    // Cuidado de performance: o banner aparece depois da hidratação, e um bloco
    // de texto grande o bastante vira candidato a LCP e piora a métrica. Por isso
    // o texto fica em blocos menores que a imagem principal, e o fundo escuro
    // não tem conteúdo (não conta como LCP).
    //
    // Camada z-450: acima de tudo que aparece SOZINHO na tela — o anúncio fixo
    // do rodapé (.ad-sticky-bottom, z 200) cobria os dois botões no celular, e
    // um banner cujos botões ninguém toca é pior que o antigo; também o player de
    // MV (260), o compartilhar texto (300) e a NavBar (320). E abaixo do que a
    // pessoa abre DE PROPÓSITO: busca e denúncia (500), menu do usuário (600),
    // menu mobile (9999).
    return (
        <>
            <div aria-hidden="true" className="fixed inset-0 z-450 bg-black/55 backdrop-blur-[2px]" />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="consentimento-titulo"
                aria-describedby="consentimento-texto"
                className="fixed inset-x-0 bottom-0 z-450 p-3 sm:bottom-6 sm:p-0"
            >
                <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-7">
                    <p id="consentimento-titulo" className="text-[18px] sm:text-[20px] font-black leading-tight tracking-[-0.01em] text-foreground">
                        Antes de continuar: sua escolha sobre cookies
                    </p>
                    <p id="consentimento-texto" className="mt-2 text-[14px] sm:text-[15px] text-muted leading-relaxed">
                        Usamos cookies para medir audiência e personalizar anúncios. Recusar mantém o site
                        completo, só com anúncios não personalizados. Veja a{' '}
                        <a href="/privacidade" className="text-accent underline">política de privacidade</a>.
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <button
                            onClick={() => decidir('denied')}
                            className="w-full rounded-full border-2 border-border px-4 py-3 text-[15px] font-bold text-foreground transition-colors hover:bg-background"
                        >
                            Recusar
                        </button>
                        <button
                            onClick={() => decidir('granted')}
                            className="w-full rounded-full border-2 border-transparent bg-(--color-fg) px-4 py-3 text-[15px] font-bold text-(--color-bg) transition-colors hover:bg-(--color-accent) hover:text-white"
                        >
                            Aceitar
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
