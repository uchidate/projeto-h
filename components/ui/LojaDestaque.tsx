import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import type { StoreProduct } from '@/lib/wordpress/store'
import { calcularDesconto } from '@/lib/wordpress/store'
import { stripHtml } from '@/lib/utils'
import { LojaClique } from '@/components/ui/LojaClique'

const LOJAS: Record<string, string> = { shopee: 'Shopee', amazon: 'Amazon', mercadolivre: 'Mercado Livre', magalu: 'Magalu', shein: 'Shein' }

/** Um produto em linha (miniatura, nome, preço, botão), ~150px: cabe na lateral fixa junto da ficha técnica sem passar da altura da tela. Some em janelas baixas (<760px), onde a lateral fixa estouraria. */
export function LojaDestaque({ product, bloco, contexto, title = 'Achado da loja' }: { product?: StoreProduct; bloco: string; contexto: string; title?: string }) {
    const url = product?.acf.affiliate_url
    if (!product || !url) return null
    const { acf } = product
    const nome = stripHtml(product.title.rendered)
    const loja = acf.store ?? 'outro'
    const desconto = calcularDesconto(acf.price, acf.original_price)
    return (
        <aside data-bloco={bloco} aria-label={title} className="overflow-hidden rounded-xl border border-border bg-surface [@media(max-height:760px)]:hidden">
            <p className="border-b border-border/60 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-accent">
                🛍️ {title} <span className="font-sans normal-case tracking-normal text-foreground-subtle">· link de afiliado</span>
            </p>
            <LojaClique href={url} productId={product.id} store={loja} contexto={contexto} className="group block p-3">
                <span className="flex gap-3">
                    <span className="relative h-24 w-24 shrink-0 overflow-hidden bg-background">
                        {acf.image_url && <Image src={acf.image_url} alt={nome} fill sizes="96px" className="object-cover transition-transform group-hover:scale-105" />}
                        {desconto !== null && <span className="absolute left-0 top-0 bg-accent px-1.5 py-0.5 text-[10px] font-black text-white">-{desconto}%</span>}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="line-clamp-3 block text-[13px] font-semibold leading-snug">{nome}</span>
                        {acf.price && <span className="mt-1 block text-base font-black">{acf.price}</span>}
                    </span>
                </span>
                <span className="mt-3 flex items-center justify-center gap-1.5 bg-accent px-3 py-2 text-[13px] font-black text-white">
                    Ver na {LOJAS[loja] ?? 'loja'} <ExternalLink size={13} aria-hidden />
                </span>
            </LojaClique>
        </aside>
    )
}
