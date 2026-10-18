import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import type { StoreProduct } from '@/lib/wordpress/store'
import { calcularDesconto } from '@/lib/wordpress/store'
import { stripHtml } from '@/lib/utils'
import { LojaClique } from '@/components/ui/LojaClique'

const LOJAS: Record<string, string> = { shopee: 'Shopee', amazon: 'Amazon', mercadolivre: 'Mercado Livre', magalu: 'Magalu', shein: 'Shein' }

interface Props {
    product?: StoreProduct
    bloco: string
    contexto: string
    title?: string
    /**
     * `compacto` (~200px): miniatura em linha, cabe na lateral fixa da ficha de produção ao lado da ficha técnica.
     * `grande`: foto larga, preço em destaque e selo de desconto — para colunas que não são fixas e têm espaço.
     */
    tamanho?: 'compacto' | 'grande'
}

/** Um produto em destaque. Borda e brilho na cor do site para sair do cinza das fichas, sem imitar anúncio nem cobrir conteúdo. */
export function LojaDestaque({ product, bloco, contexto, title = 'Achado da loja', tamanho = 'compacto' }: Props) {
    const url = product?.acf.affiliate_url
    if (!product || !url) return null
    const { acf } = product
    const nome = stripHtml(product.title.rendered)
    const loja = acf.store ?? 'outro'
    const desconto = calcularDesconto(acf.price, acf.original_price)
    const grande = tamanho === 'grande'
    return (
        <aside data-bloco={bloco} aria-label={title}
            className="overflow-hidden rounded-xl border border-accent/40 bg-linear-to-b from-accent/10 to-surface shadow-[0_0_24px_-10px_var(--color-accent)] data-[tam=compacto]:[@media(max-height:760px)]:hidden"
            data-tam={tamanho}>
            <p className="flex items-center gap-2 border-b border-accent/20 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-accent">
                <span aria-hidden>🛍️</span> {title} <span className="ml-auto font-sans normal-case tracking-normal text-foreground-subtle">afiliado</span>
            </p>
            <LojaClique href={url} productId={product.id} store={loja} contexto={contexto} className="group block p-3">
                {grande ? (
                    <>
                        <span className="relative block aspect-video overflow-hidden bg-background">
                            {acf.image_url && <Image src={acf.image_url} alt={nome} fill sizes="(min-width: 1024px) 420px, 100vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />}
                            {desconto !== null && <span className="absolute left-0 top-3 bg-accent px-2.5 py-1 text-[12px] font-black text-white">-{desconto}%</span>}
                        </span>
                        <span className="mt-3 line-clamp-2 block text-[15px] font-semibold leading-snug">{nome}</span>
                        <span className="mt-2 flex items-baseline gap-2">
                            {acf.price && <span className="text-2xl font-black leading-none">{acf.price}</span>}
                            {acf.original_price && desconto !== null && <span className="text-[13px] text-muted line-through">{acf.original_price}</span>}
                        </span>
                    </>
                ) : (
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
                )}
                <span className={`mt-3 flex items-center justify-center gap-1.5 bg-accent font-black text-white transition-[filter] group-hover:brightness-110 ${grande ? 'px-3 py-3 text-[14px]' : 'px-3 py-2 text-[13px]'}`}>
                    Ver na {LOJAS[loja] ?? 'loja'} <ExternalLink size={grande ? 14 : 13} aria-hidden />
                </span>
            </LojaClique>
        </aside>
    )
}
