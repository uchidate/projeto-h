'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import { LojaClique } from '@/components/ui/LojaClique'
import { STORE_CONFIG } from '@/components/ui/StoreCard'

export interface OfertaResumo {
    id: number
    nome: string
    image: string | null
    price: string | null
    store: string
    href: string
}

interface Props {
    name: string
    image: string | null
    emoji: string
    ofertas: OfertaResumo[]
    contexto: string
}

/**
 * Tira "produtos mais conhecidos": 1 oferta linka direto, 2+ abrem um popover
 * aqui mesmo com as opções (preço, loja) — não manda o leitor pra outra seção
 * só pra escolher entre Mercado Livre e Shopee do mesmo produto.
 */
export function ProdutoConhecidoTile({ name, image, emoji, ofertas, contexto }: Props) {
    const [aberto, setAberto] = useState(false)
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
    const ref = useRef<HTMLDivElement>(null)
    const btnRef = useRef<HTMLButtonElement>(null)

    // O container da tira usa overflow-x-auto; por regra do CSS isso vira
    // overflow-y:auto junto (não dá pra ter um eixo "visible" e o outro não),
    // cortando um popover absoluto. Portal pro body + position:fixed escapa
    // desse clipping; a posição é recalculada no scroll/resize pra acompanhar.
    useEffect(() => {
        if (!aberto) return
        const atualizarPos = () => {
            const r = btnRef.current?.getBoundingClientRect()
            if (r) setPos({ top: r.bottom + 8, left: r.left + r.width / 2 })
        }
        atualizarPos()
        const fechar = (e: MouseEvent) => {
            if (ref.current?.contains(e.target as Node)) return
            if ((e.target as HTMLElement).closest('[data-produto-popover]')) return
            setAberto(false)
        }
        const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
        document.addEventListener('mousedown', fechar)
        document.addEventListener('keydown', esc)
        window.addEventListener('scroll', atualizarPos, true)
        window.addEventListener('resize', atualizarPos)
        return () => {
            document.removeEventListener('mousedown', fechar)
            document.removeEventListener('keydown', esc)
            window.removeEventListener('scroll', atualizarPos, true)
            window.removeEventListener('resize', atualizarPos)
        }
    }, [aberto])

    const thumb = (
        <div className="relative w-[120px] h-[120px] rounded-xl overflow-hidden bg-surface border border-border flex items-center justify-center">
            {image ? (
                <Image src={image} alt={name} fill className="object-cover" sizes="120px" />
            ) : (
                <span className="text-[32px] opacity-40">{emoji}</span>
            )}
        </div>
    )
    const label = <p className="text-[11px] text-center leading-tight text-foreground/80 line-clamp-2">{name}</p>

    if (ofertas.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 shrink-0 w-[120px]">
                {thumb}
                {label}
            </div>
        )
    }

    if (ofertas.length === 1) {
        const o = ofertas[0]
        return (
            <LojaClique href={o.href} productId={o.id} store={o.store} contexto={contexto}
                className="group flex flex-col items-center gap-2 shrink-0 w-[120px] hover:opacity-90 transition-opacity">
                {thumb}
                {label}
                <p className="text-[10px] font-bold text-accent">🛍️ Ver na {STORE_CONFIG[o.store]?.label ?? 'loja'}</p>
            </LojaClique>
        )
    }

    return (
        <div ref={ref} className="relative shrink-0 w-[120px]">
            <button ref={btnRef} type="button" onClick={() => setAberto(v => !v)}
                className="group flex flex-col items-center gap-2 w-[120px] hover:opacity-90 transition-opacity" aria-expanded={aberto}>
                {thumb}
                {label}
                <p className="flex items-center gap-0.5 text-[10px] font-bold text-accent">
                    🛍️ {new Set(ofertas.map(o => o.store)).size > 1 ? `Ver em ${new Set(ofertas.map(o => o.store)).size} lojas` : `${ofertas.length} ofertas`}
                    <ChevronDown size={11} className={`transition-transform ${aberto ? 'rotate-180' : ''}`} />
                </p>
            </button>
            {aberto && pos && typeof document !== 'undefined' && createPortal(
                <div data-produto-popover style={{ position: 'fixed', top: pos.top, left: pos.left, transform: 'translateX(-50%)' }}
                    className="z-50 w-[240px] rounded-xl border border-border bg-background p-2 shadow-xl">
                    {ofertas.map(o => (
                        <LojaClique key={o.id} href={o.href} productId={o.id} store={o.store} contexto={contexto}
                            className="group flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-surface transition-colors">
                            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-surface border border-border">
                                {o.image && <Image src={o.image} alt={o.nome} fill sizes="44px" className="object-cover" />}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate font-mono text-[9px] uppercase tracking-wide text-muted">{STORE_CONFIG[o.store]?.label ?? o.store}</span>
                                <span className="block text-[12px] font-bold leading-tight group-hover:text-accent transition-colors">{o.price ?? 'Ver preço'}</span>
                            </span>
                        </LojaClique>
                    ))}
                </div>,
                document.body,
            )}
        </div>
    )
}
