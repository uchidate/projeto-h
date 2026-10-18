import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { StoreProduct } from '@/lib/wordpress/store'
import { calcularDesconto } from '@/lib/wordpress/store'
import { stripHtml } from '@/lib/utils'
import { LojaClique } from '@/components/ui/LojaClique'

interface Props {
    products: StoreProduct[]
    /** Medição: `data-bloco` (quem vê e quem clica, por página). */
    bloco: string
    /** Identifica a vitrine no clique (ex.: "producao:vincenzo"). */
    contexto: string
    title?: string
    href?: string
    verTudoLabel?: string
    className?: string
}

/**
 * Faixa de produtos para o MEIO da página, onde a prateleira grande do rodapé raramente chega.
 * Três cartões com foto, preço em destaque e selo de desconto; borda e brilho na cor do site
 * para sair do cinza da página. Não cobre conteúdo nem rola sozinha: o clique é escolha do leitor.
 * Some quando não há produto com link de afiliado.
 */
export function LojaEmLinha({ products, bloco, contexto, title = 'Achados da loja', href = '/loja', verTudoLabel = 'Ver loja', className = '' }: Props) {
    const itens = products.filter(p => p.acf.affiliate_url).slice(0, 3)
    if (itens.length === 0) return null
    return (
        <aside data-bloco={bloco} aria-label={title}
            className={`rounded-xl border border-accent/40 bg-linear-to-b from-accent/10 to-surface p-3 shadow-[0_0_28px_-12px_var(--color-accent)] sm:p-4 ${className}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-accent">
                    🛍️ {title} <span className="font-sans normal-case tracking-normal text-foreground-subtle">· links de afiliado</span>
                </p>
                <Link href={href} className="shrink-0 whitespace-nowrap text-[12px] font-bold text-accent hover:underline">{verTudoLabel} →</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
                {itens.map(p => {
                    const { acf } = p
                    const nome = stripHtml(p.title.rendered)
                    const desconto = calcularDesconto(acf.price, acf.original_price)
                    return (
                        <LojaClique key={p.id} href={acf.affiliate_url!} productId={p.id} store={acf.store ?? 'outro'} contexto={contexto}
                            className="group flex gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:border-accent">
                            <span className="relative h-24 w-24 shrink-0 overflow-hidden bg-surface">
                                {acf.image_url && <Image src={acf.image_url} alt={nome} fill sizes="96px" className="object-cover transition-transform duration-300 group-hover:scale-105" />}
                                {desconto !== null && <span className="absolute left-0 top-0 bg-accent px-1.5 py-0.5 text-[10px] font-black text-white">-{desconto}%</span>}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="line-clamp-2 text-[13px] font-semibold leading-snug">{nome}</span>
                                {acf.price && <span className="mt-1 text-lg font-black leading-none">{acf.price}</span>}
                                <span className="mt-auto inline-flex items-center gap-1 pt-2 text-[12px] font-black text-accent">
                                    Ver oferta <ExternalLink size={12} aria-hidden />
                                </span>
                            </span>
                        </LojaClique>
                    )
                })}
            </div>
        </aside>
    )
}
