'use client'

import Image from 'next/image'
import { trackProductClick } from '@/lib/analytics'
import { formatCategory, type StoreProduct } from '@/lib/wordpress/store'
import { stripHtml } from '@/lib/utils'

interface Props {
    product: StoreProduct
    vendidos: string
    comprar: string
    /** Rótulo do selo da imagem (ex.: "Preço caiu"); sem ele, a categoria do produto. */
    selo?: string
}

/** Card branco da faixa de mais vendidos: o clique vai direto ao marketplace e é medido como o das outras vitrines. */
export function HomeLojaCard({ product, vendidos, comprar, selo }: Props) {
    const { acf, title } = product
    const nome = stripHtml(title.rendered)
    const store = acf.store ?? 'outro'
    if (!acf.affiliate_url || !acf.image_url) return null
    return (
        <a href={acf.affiliate_url} target="_blank" rel="noopener noreferrer sponsored"
            onClick={() => trackProductClick({ productId: product.id, store, contexto: 'home_mais_vendidos' })}
            className="group flex h-full min-w-0 flex-col bg-white text-[#14141c] shadow-[0_2px_0_rgba(0,0,0,0.12)]">
            <span className="relative block aspect-square overflow-hidden bg-white">
                <Image src={acf.image_url} alt={nome} fill sizes="(max-width: 1024px) 190px, 17vw" className="object-contain p-1 transition-transform group-hover:scale-[1.03]" />
                <span className="absolute left-0 top-0 bg-[#14141c] px-2 py-1 font-mono text-[9px] font-bold uppercase leading-none tracking-[0.1em] text-white">{vendidos}</span>
                <span className="absolute bottom-0 left-0 bg-[#0b6b63] px-2 py-1 font-mono text-[9px] font-bold uppercase leading-none tracking-[0.1em] text-white">{selo ?? formatCategory(acf.category ?? 'outros')}</span>
            </span>
            <span className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
                <span className="line-clamp-2 text-[13px] font-semibold leading-snug">{nome}</span>
                <span className="mt-2 text-[20px] font-black leading-none">{acf.price}</span>
                <span className="mt-auto block pt-3">
                    <span className="block bg-[#ff246e] px-3 py-2.5 text-center font-mono text-[10px] font-black uppercase tracking-[0.1em] text-white">{comprar}</span>
                </span>
            </span>
        </a>
    )
}
