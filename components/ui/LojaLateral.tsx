import Image from 'next/image'
import type { StoreProduct } from '@/lib/wordpress/store'
import { calcularDesconto } from '@/lib/wordpress/store'
import { stripHtml } from '@/lib/utils'
import { LojaClique } from '@/components/ui/LojaClique'

const LOJAS: Record<string, string> = { shopee: 'Shopee', amazon: 'Amazon', mercadolivre: 'Mercado Livre', magalu: 'Magalu', shein: 'Shein' }

interface Item {
    product: StoreProduct
    /** Contexto do clique por posição, para o ranking de cliques seguir comparável com os blocos antigos. */
    contexto: string
}

interface Props {
    itens: Item[]
    bloco: string
    title: string
}

/**
 * Prateleira da coluna lateral da ficha: uma caixa com 2–3 produtos em linha (miniatura, nome, preço).
 * Substitui os dois cartões "grandes" empilhados, que somavam ~620 px de altura e deixavam a bio curta
 * com um vão ao lado (Han Jae-in, 2026-11-20). A linha inteira é o link.
 */
export function LojaLateral({ itens, bloco, title }: Props) {
    const validos = itens.filter((i) => i.product.acf.affiliate_url)
    if (validos.length === 0) return null
    return (
        <aside data-bloco={bloco} aria-label={title}
            className="overflow-hidden rounded-xl border border-accent/40 bg-linear-to-b from-accent/10 to-surface shadow-[0_0_24px_-10px_var(--color-accent)]">
            <p className="flex items-center gap-2 border-b border-accent/20 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-accent">
                <span aria-hidden>🛍️</span> {title} <span className="ml-auto font-sans normal-case tracking-normal text-foreground-subtle">afiliado</span>
            </p>
            <ul className="divide-y divide-accent/15">
                {validos.map(({ product, contexto }) => {
                    const { acf } = product
                    const nome = stripHtml(product.title.rendered)
                    const loja = acf.store ?? 'outro'
                    const desconto = calcularDesconto(acf.price, acf.original_price)
                    return (
                        <li key={product.id}>
                            <LojaClique href={acf.affiliate_url!} productId={product.id} store={loja} contexto={contexto}
                                className="group flex items-center gap-3 p-3 transition-colors hover:bg-accent/5">
                                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-background">
                                    {acf.image_url && <Image src={acf.image_url} alt={nome} fill sizes="64px" className="object-cover transition-transform group-hover:scale-105" />}
                                    {desconto !== null && <span className="absolute left-0 top-0 bg-accent px-1 py-0.5 text-[9px] font-black text-white">-{desconto}%</span>}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="line-clamp-2 block text-[13px] font-semibold leading-snug">{nome}</span>
                                    <span className="mt-1 flex items-baseline gap-2">
                                        {acf.price && <span className="text-[15px] font-black">{acf.price}</span>}
                                        <span className="truncate text-[11px] text-foreground-subtle">{LOJAS[loja] ?? 'loja'} ↗</span>
                                    </span>
                                </span>
                            </LojaClique>
                        </li>
                    )
                })}
            </ul>
        </aside>
    )
}
