'use client'

import { useTranslations } from 'next-intl'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Colapsa texto longo no mobile — o perfil de grupo chegava a ~5 telas de
 * prosa seguida (Sobre + Análise) antes do primeiro conteúdo visual. No
 * desktop (lg+) nunca colapsa. O clamp já vem do SSR (classe estática),
 * então não há layout shift; o botão/fade só aparece após a hidratação
 * confirmar que o conteúdo realmente transborda.
 *
 * NUNCA envolver um <AdSlot> com este componente — criativo cortado por
 * overflow:hidden viola política do AdSense. Anúncios ficam fora, entre
 * blocos colapsáveis.
 */
export function CollapsibleProse({ children, label: labelProp }: { children: ReactNode; label?: string }) {
    const tc = useTranslations('client')
    const label = labelProp ?? tc('prose.continueReading')
    const contentRef = useRef<HTMLDivElement>(null)
    const [expanded, setExpanded] = useState(false)
    const [overflows, setOverflows] = useState(false)

    useEffect(() => {
        const el = contentRef.current
        if (!el) return
        // Só vale colapsar se o corte esconder conteúdo de verdade. Com o limiar
        // antigo de 32px, o botão aparecia para ocultar um fragmento de duas
        // linhas — o leitor pagava um clique para ganhar quase nada de tela.
        // 240px ≈ um bloco de parágrafos, o mínimo que justifica o controle.
        const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 240)
        measure()
        const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(min-width: 1024px)') : null
        mq?.addEventListener?.('change', measure)
        return () => mq?.removeEventListener?.('change', measure)
    }, [expanded])

    return (
        <div className="relative">
            <div ref={contentRef} className={expanded ? undefined : 'max-h-104 overflow-hidden lg:max-h-none'}>
                {children}
            </div>
            {/* Alternador, não via única: antes o botão só abria e depois sumia
                para sempre — quem expandia um texto de 5 telas por engano não
                tinha como recolher. Recolhido, o controle flutua sobre o
                degradê que anuncia o corte; expandido, fica no fluxo abaixo do
                texto, onde não cobre a última linha. */}
            {(overflows || expanded) && (
                <div className={
                    expanded
                        ? 'mt-4 flex justify-center lg:hidden'
                        : 'absolute inset-x-0 bottom-0 flex items-end justify-center bg-linear-to-t from-background via-background/85 to-transparent pb-1 pt-24 lg:hidden'
                }>
                    <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setExpanded(v => !v)}
                        className="touch-target border border-border bg-surface px-5 py-2 font-mono text-[11px] font-black uppercase tracking-[0.12em] text-foreground transition-colors hover:border-accent hover:text-accent"
                    >
                        {expanded ? 'Mostrar menos ↑' : `${label} ↓`}
                    </button>
                </div>
            )}
        </div>
    )
}
