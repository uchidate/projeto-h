'use client'
import { SITE_NAME } from '@/lib/constants/site'

import Image from 'next/image'
import { ExternalLink, Star } from 'lucide-react'
import type { StoreProduct } from '@/lib/wordpress/store'
import { stripHtml } from '@/lib/utils'

const STORE_CONFIG: Record<string, { label: string; color: string; bg: string; textColor: string }> = {
    shopee:       { label: 'Shopee',        color: 'text-orange-500', bg: 'bg-orange-700',  textColor: 'text-white' },
    amazon:       { label: 'Amazon',        color: 'text-[#FF9900]',  bg: 'bg-[#232F3E]',  textColor: 'text-white' },
    mercadolivre: { label: 'Mercado Livre', color: 'text-yellow-500', bg: 'bg-[#FFF159]',   textColor: 'text-[#333]' },
    magalu:       { label: 'Magalu',        color: 'text-blue-600',   bg: 'bg-[#0072d9]',  textColor: 'text-white' },
    shein:        { label: 'Shein',         color: 'text-foreground', bg: 'bg-foreground',  textColor: 'text-background' },
    outro:        { label: 'Ver produto',   color: 'text-muted',      bg: 'bg-muted',       textColor: 'text-white' },
}

interface StoreCardProps {
    product: StoreProduct
    compact?: boolean
}

export function StoreCard({ product, compact = false }: StoreCardProps) {
    const { acf, title } = product
    const name = stripHtml(title.rendered)
    const store = acf.store ?? 'outro'
    const cfg = STORE_CONFIG[store] ?? STORE_CONFIG.outro

    if (!acf.affiliate_url) return null

    if (compact) {
        return (
            <a href={acf.affiliate_url} target="_blank" rel="noopener noreferrer sponsored"
                className="flex gap-3 border border-border bg-background p-3 transition-colors hover:border-accent/40 group">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-surface">
                    {acf.image_url ? (
                        <Image src={acf.image_url} alt={name} fill className="object-cover" unoptimized />
                    ) : (
                        <div className="flex h-full w-full items-end bg-linear-to-br from-foreground/90 to-foreground/70 p-1">
                            <span className="line-clamp-3 text-[9px] font-black uppercase leading-tight text-background/60">{name}</span>
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">{name}</p>
                    {acf.price && <p className="mt-1 text-sm font-black text-foreground">{acf.price}</p>}
                    <span className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${cfg.bg} ${cfg.textColor}`}>
                        {cfg.label}
                    </span>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 self-center text-muted" />
            </a>
        )
    }

    return (
        <a href={acf.affiliate_url} target="_blank" rel="noopener noreferrer sponsored"
            title={`Ver no ${cfg.label} (link externo)`}
            className="group flex flex-col">
            <div className="relative aspect-square overflow-hidden bg-surface">
                {acf.image_url ? (
                    <Image src={acf.image_url} alt={name} fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        unoptimized />
                ) : (
                    <div className="flex h-full w-full items-end bg-linear-to-br from-foreground/90 to-foreground/70 p-3">
                        <span className="line-clamp-4 text-sm font-black uppercase leading-tight text-background/60">{name}</span>
                    </div>
                )}
                {acf.badge && (
                    <span className="absolute left-2 top-2 bg-accent-a11y px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wide text-white">
                        {acf.badge}
                    </span>
                )}
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className={`font-mono text-[9px] font-bold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                {acf.rating && acf.rating > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-muted">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {acf.rating.toFixed(1)}
                    </span>
                )}
            </div>
            <span className="mt-0.5 line-clamp-2 text-[14px] font-bold leading-tight text-foreground transition-colors group-hover:text-accent sm:text-[15px]">
                {name}
            </span>
            {(acf.price || acf.original_price) && (
                <div className="mt-1 flex items-baseline gap-2">
                    {acf.price && <span className="text-[14px] font-black text-foreground">{acf.price}</span>}
                    {acf.original_price && <span className="text-[11px] text-muted line-through">{acf.original_price}</span>}
                </div>
            )}
            <span className="mt-0.5 truncate text-[11px] text-muted">
                {acf.sold_count ? `${acf.sold_count} vendidos` : `Curadoria ${SITE_NAME}`}
            </span>
        </a>
    )
}
