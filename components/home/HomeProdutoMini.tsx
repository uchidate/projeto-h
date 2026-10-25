'use client'

import Image from 'next/image'
import { trackProductClick } from '@/lib/analytics'
import { stripHtml } from '@/lib/utils'
import type { StoreProduct } from '@/lib/wordpress/store'

/** Produto pequeno da prateleira de uma editoria: foto, nome e preço; o clique vai ao marketplace e é medido. */
export function HomeProdutoMini({ product, contexto }: { product: StoreProduct; contexto: string }) {
    const { acf, title } = product
    const nome = stripHtml(title.rendered)
    if (!acf.affiliate_url || !acf.image_url) return null
    return (
        <a href={acf.affiliate_url} target="_blank" rel="noopener noreferrer sponsored"
            onClick={() => trackProductClick({ productId: product.id, store: acf.store ?? 'outro', contexto })}
            className="group block min-w-0">
            <span className="relative block aspect-[4/3] overflow-hidden bg-white">
                <Image src={acf.image_url} alt={nome} fill sizes="(max-width: 1024px) 45vw, 12vw" className="object-contain" />
            </span>
            <span className="mt-1.5 line-clamp-2 block text-[11px] font-semibold leading-snug text-foreground group-hover:text-accent">{nome}</span>
            <span className="mt-0.5 block text-[12px] font-black text-accent">{acf.price}</span>
        </a>
    )
}
