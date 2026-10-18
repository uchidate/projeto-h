'use client'
import type { ReactNode } from 'react'
import { trackProductClick } from '@/lib/analytics'

/** Link de afiliado com o clique medido; permite usar cartões de produto em componentes de servidor. */
export function LojaClique({ href, productId, store, contexto, className, children }: { href: string; productId: number; store: string; contexto: string; className?: string; children: ReactNode }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer sponsored" className={className}
            onClick={() => trackProductClick({ productId, store, contexto })}>
            {children}
        </a>
    )
}
