'use client'

import { useEffect, useRef, useState } from 'react'

const WINDOW = 5 // headings visible at once, quando a lista é longa
const LISTA_INTEIRA_ATE = 8 // até aqui mostra tudo: uma lista parada não se mexe sob o cursor

export function BlogToc({ headings }: { headings: { id: string; text: string; level: 2 | 3 }[] }) {
    const [activeIdx, setActiveIdx] = useState(0)
    // Com o mouse sobre o índice a janela não desliza: a seção ativa muda durante a rolagem e a lista se moveria sob o cursor (clique no link errado).
    const [congelado, setCongelado] = useState<number | null>(null)
    const rafRef = useRef<number>(0)

    useEffect(() => {
        if (headings.length < 2) return

        // BlogMobileReadMore renders children twice (mobile + desktop),
        // causing duplicate IDs. getElementById returns the first match
        // which is inside `lg:hidden` (display:none on desktop) — the
        // IntersectionObserver never fires on hidden elements.
        // Use querySelectorAll and pick the visible instance.
        const elements = headings
            .map(h => {
                const all = document.querySelectorAll(`[id="${CSS.escape(h.id)}"]`)
                for (const el of all) {
                    if ((el as HTMLElement).offsetHeight > 0) return el as HTMLElement
                }
                return null
            })
            .filter((el): el is HTMLElement => el !== null)

        const visibilityMap = new Map<string, boolean>()
        elements.forEach(el => visibilityMap.set(el.id, false))

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(e => visibilityMap.set(e.target.id, e.isIntersecting))
                cancelAnimationFrame(rafRef.current)
                rafRef.current = requestAnimationFrame(() => {
                    const first = elements.find(el => visibilityMap.get(el.id))
                    if (first) {
                        const idx = headings.findIndex(h => h.id === first.id)
                        if (idx !== -1) setActiveIdx(idx)
                    }
                })
            },
            { rootMargin: '-80px 0px -55% 0px', threshold: 0 },
        )

        elements.forEach(el => observer.observe(el))
        return () => {
            observer.disconnect()
            cancelAnimationFrame(rafRef.current)
        }
    }, [headings])

    if (headings.length < 2) return null

    // Janela de itens visíveis: lista curta aparece inteira; a longa desliza com a seção ativa, exceto sob o cursor.
    const total = headings.length
    const tamanho = total <= LISTA_INTEIRA_ATE ? total : WINDOW
    const half = Math.floor(tamanho / 2)
    const primeiro = Math.max(0, activeIdx - half)
    const end0 = Math.min(total, primeiro + tamanho)
    const inicioNatural = Math.max(0, end0 - tamanho)
    const start = congelado ?? inicioNatural
    const end = Math.min(total, start + tamanho)
    const hiddenAbove = start
    const hiddenBelow = total - end
    const visible = headings.slice(start, end)

    return (
        <nav aria-label="Neste artigo" onMouseEnter={() => setCongelado(inicioNatural)} onMouseLeave={() => setCongelado(null)} onFocus={() => setCongelado(inicioNatural)} onBlur={() => setCongelado(null)}>
            <p className="mb-2.5 font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">
                Neste artigo
            </p>

            <div className="border-l border-border pl-3 space-y-0">
                {/* Counter above */}
                {hiddenAbove > 0 && (
                    <a
                        href={`#${headings[0].id}`}
                        className="flex items-center gap-1 py-1 font-mono text-[9px] text-muted/60 hover:text-muted transition-colors"
                    >
                        <span className="inline-block w-3 h-px bg-border/60" />
                        {hiddenAbove} {hiddenAbove === 1 ? 'seção acima' : 'seções acima'}
                    </a>
                )}

                {/* Visible window */}
                {visible.map((h, i) => {
                    const globalIdx = start + i
                    const isActive = globalIdx === activeIdx
                    return (
                        <div key={h.id} className={`py-[3px] ${h.level === 3 ? 'pl-3' : ''}`}>
                            <a
                                href={`#${h.id}`}
                                className={`block font-semibold text-[12px] leading-snug transition-colors ${
                                    isActive
                                        ? 'text-accent'
                                        : 'text-muted hover:text-foreground'
                                }`}
                            >
                                {h.text}
                            </a>
                        </div>
                    )
                })}

                {/* Counter below */}
                {hiddenBelow > 0 && (
                    <a
                        href={`#${headings[total - 1].id}`}
                        className="flex items-center gap-1 py-1 font-mono text-[9px] text-muted/60 hover:text-muted transition-colors"
                    >
                        <span className="inline-block w-3 h-px bg-border/60" />
                        {hiddenBelow} {hiddenBelow === 1 ? 'seção abaixo' : 'seções abaixo'}
                    </a>
                )}
            </div>

            {/* Progress dots */}
            {total > tamanho && (
                <div className="mt-3 flex items-center gap-[3px]">
                    {headings.map((_, i) => (
                        <a
                            key={i}
                            href={`#${headings[i].id}`}
                            className={`block rounded-full transition-all duration-200 ${
                                i === activeIdx
                                    ? 'w-3 h-1.5 bg-accent'
                                    : i >= start && i < end
                                    ? 'w-1.5 h-1.5 bg-border'
                                    : 'w-1 h-1 bg-border/40'
                            }`}
                            aria-label={headings[i].text}
                        />
                    ))}
                </div>
            )}
        </nav>
    )
}
