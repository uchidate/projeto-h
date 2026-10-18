import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import type { StoreProduct } from '@/lib/wordpress/store'
import { calcularDesconto } from '@/lib/wordpress/store'
import { stripHtml } from '@/lib/utils'
import { LojaClique } from '@/components/ui/LojaClique'

const LOJAS: Record<string, string> = { shopee: 'Shopee', amazon: 'Amazon', mercadolivre: 'Mercado Livre', magalu: 'Magalu', shein: 'Shein' }

/** Um produto em tamanho grande (imagem, preço, botão): formato de lateral, onde a faixa de três não cabe. */
export function LojaDestaque({ product, bloco, contexto, title = 'Achado da loja' }: { product?: StoreProduct; bloco: string; contexto: string; title?: string }) {
    const url = product?.acf.affiliate_url
    if (!product || !url) return null
    const { acf } = product
    const nome = stripHtml(product.title.rendered)
    const loja = acf.store ?? 'outro'
    const desconto = calcularDesconto(acf.price, acf.original_price)
    return (
        <aside data-bloco={bloco} aria-label={title} className="overflow-hidden rounded-xl border border-border bg-surface">
            <p className="border-b border-border/60 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-accent">
                🛍️ {title} <span className="font-sans normal-case tracking-normal text-foreground-subtle">· link de afiliado</span>
            </p>
            <LojaClique href={url} productId={product.id} store={loja} contexto={contexto} className="group block p-3">
                <span className="relative block aspect-square overflow-hidden bg-background">
                    {acf.image_url && <Image src={acf.image_url} alt={nome} fill sizes="280px" className="object-cover transition-transform group-hover:scale-105" />}
                    {desconto !== null && <span className="absolute left-2 top-2 bg-accent px-2 py-0.5 text-[11px] font-black text-white">-{desconto}%</span>}
                </span>
                <span className="mt-3 line-clamp-2 block text-[13px] font-semibold leading-snug">{nome}</span>
                {acf.price && <span className="mt-1 block text-lg font-black">{acf.price}</span>}
                <span className="mt-3 flex items-center justify-center gap-1.5 bg-accent px-3 py-2.5 text-[13px] font-black text-white">
                    Ver na {LOJAS[loja] ?? 'loja'} <ExternalLink size={13} aria-hidden />
                </span>
            </LojaClique>
        </aside>
    )
}
