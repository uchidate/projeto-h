'use client'
import { SITE_NAME } from '@/lib/constants/site'

import Image from 'next/image'
import { ExternalLink, Star } from 'lucide-react'
import { calcularDesconto, ehMenorPrecoEmDias, ehNovo, type StoreProduct } from '@/lib/wordpress/store'
import { stripHtml } from '@/lib/utils'
import { trackProductClick } from '@/lib/analytics'

const STORE_CONFIG: Record<string, { label: string; color: string; bg: string; textColor: string; stripe: string }> = {
    shopee:       { label: 'Shopee',        color: 'text-orange-500', bg: 'bg-orange-700',  textColor: 'text-white', stripe: 'bg-orange-600' },
    amazon:       { label: 'Amazon',        color: 'text-[#FF9900]',  bg: 'bg-[#232F3E]',  textColor: 'text-white', stripe: 'bg-[#FF9900]' },
    mercadolivre: { label: 'Mercado Livre', color: 'text-yellow-500', bg: 'bg-[#FFF159]',   textColor: 'text-[#333]', stripe: 'bg-[#FFE600]' },
    magalu:       { label: 'Magalu',        color: 'text-blue-600',   bg: 'bg-[#0072d9]',  textColor: 'text-white', stripe: 'bg-[#0072d9]' },
    shein:        { label: 'Shein',         color: 'text-foreground', bg: 'bg-foreground',  textColor: 'text-background', stripe: 'bg-foreground' },
    outro:        { label: 'Ver produto',   color: 'text-muted',      bg: 'bg-muted',       textColor: 'text-white', stripe: 'bg-muted' },
}

interface StoreCardProps {
    product: StoreProduct
    compact?: boolean
    /** Página/vitrine onde o card aparece (ex.: "artista:jisoo-kim") — base do ranking por CTR. */
    contexto?: string
}


export function StoreCard({ product, compact = false, contexto = 'loja' }: StoreCardProps) {
    const { acf, title } = product
    const name = stripHtml(title.rendered)
    const store = acf.store ?? 'outro'
    const cfg = STORE_CONFIG[store] ?? STORE_CONFIG.outro
    const desconto = calcularDesconto(acf.price, acf.original_price)
    const menorPreco = ehMenorPrecoEmDias(acf.price, acf.price_history, 30)
    const novo = ehNovo(product.date_gmt, 14)
    // Alguns produtos antigos têm `badge` preenchido à mão com o próprio
    // percentual (ex.: "-37") — dado legado que agora duplica o desconto
    // calculado ao lado. Um badge de verdade não é só um número.
    const badgeTexto = acf.badge && !/^-?\d+%?$/.test(acf.badge.trim()) ? acf.badge : null

    if (!acf.affiliate_url) return null

    const registrarClique = () => trackProductClick({ productId: product.id, store, contexto })

    if (compact) {
        return (
            <a href={acf.affiliate_url} target="_blank" rel="noopener noreferrer sponsored"
                onClick={registrarClique}
                className="flex gap-3 border border-border bg-background p-3 transition-colors hover:border-accent/40 group">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-surface">
                    {acf.image_url ? (
                        <Image src={acf.image_url} alt={name} fill sizes="64px" className="object-cover" />
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
            onClick={registrarClique}
            className={`group relative flex flex-col p-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)] ${
                acf.featured
                    ? 'border-2 border-accent/70 bg-accent-a11y/4 hover:border-accent'
                    : 'border border-border/60 bg-background hover:border-accent/50'
            }`}>
            <span className={`absolute inset-y-0 left-0 w-1 ${cfg.stripe}`} aria-hidden="true" />
            <div className="relative aspect-square overflow-hidden bg-surface">
                {acf.image_url ? (
                    <Image src={acf.image_url} alt={name} fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 220px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
                ) : (
                    <div className="flex h-full w-full items-end bg-linear-to-br from-foreground/90 to-foreground/70 p-3">
                        <span className="line-clamp-4 text-sm font-black uppercase leading-tight text-background/60">{name}</span>
                    </div>
                )}
                <div className="absolute left-1.5 top-1.5 flex flex-col items-start gap-1">
                    {desconto !== null && (
                        <span className="bg-foreground px-1.5 py-0.5 font-mono text-[10px] font-black tabular-nums text-background">
                            -{desconto}%
                        </span>
                    )}
                    {badgeTexto && (
                        <span className="bg-accent-a11y px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wide text-white">
                            {badgeTexto}
                        </span>
                    )}
                </div>
                <span className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-1 bg-accent py-1.5 text-[11px] font-black uppercase tracking-wide text-white transition-transform duration-200 group-hover:translate-y-0">
                    Ver oferta <ExternalLink className="h-3 w-3" />
                </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <span className={`px-1 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                    {novo && (
                        <span className="bg-accent px-1 py-0.5 font-mono text-[9px] font-black uppercase tracking-wide text-white">
                            Novo
                        </span>
                    )}
                </div>
                {acf.rating && acf.rating > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-muted">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {acf.rating.toFixed(1)}
                    </span>
                )}
            </div>
            <span className="mt-1 line-clamp-2 text-[14px] font-bold leading-tight text-foreground transition-colors group-hover:text-accent sm:text-[15px]">
                {name}
            </span>
            {(acf.price || acf.original_price) && (
                <div className="mt-1.5 flex items-baseline gap-1.5">
                    {acf.price && <span className="text-[17px] font-black tracking-tight text-foreground sm:text-[18px]">{acf.price}</span>}
                    {acf.original_price && <span className="text-[11px] text-muted line-through">{acf.original_price}</span>}
                </div>
            )}
            {menorPreco && (
                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                    Menor preço em 30 dias
                </span>
            )}
            <span className="mt-1 truncate text-[11px] font-medium text-muted">
                {acf.sold_count ? `${acf.sold_count} vendidos` : `Curadoria ${SITE_NAME}`}
            </span>
        </a>
    )
}
