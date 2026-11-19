import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import { ExternalLink } from 'lucide-react'
import type { StoreProduct } from '@/lib/wordpress/store'
import { calcularDesconto } from '@/lib/wordpress/store'
import { stripHtml } from '@/lib/utils'
import { LojaClique } from '@/components/ui/LojaClique'
import { VitrineVista } from '@/components/ui/VitrineVista'
import { ROTULO_MOTIVO, type MotivoPrateleira } from '@/lib/wordpress/prateleira-obra'

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
    /** Por que cada produto está aqui (ficha de produção): vira selo no cartão. */
    motivos?: Record<number, MotivoPrateleira>
}

/**
 * Faixa de produtos para o MEIO da página, onde a prateleira grande do rodapé raramente chega.
 * Três cartões com foto, preço em destaque e selo de desconto; borda e brilho na cor do site
 * para sair do cinza da página. Não cobre conteúdo nem rola sozinha: o clique é escolha do leitor.
 * Some quando não há produto com link de afiliado.
 */
export function LojaEmLinha({ products, bloco, contexto, title = 'Achados da loja', href = '/loja', verTudoLabel = 'Ver loja', className = '', motivos }: Props) {
    const itens = products.filter(p => p.acf.affiliate_url).slice(0, 3)
    if (itens.length === 0) return null
    return (
        <aside data-bloco={bloco} aria-label={title}
            className={`rounded-xl border border-accent/40 bg-linear-to-b from-accent/10 to-surface p-3 shadow-[0_0_28px_-12px_var(--color-accent)] sm:p-4 ${className}`}>
            <div className="mb-3">
                <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate font-mono text-[11px] font-black uppercase tracking-[0.14em] text-accent">🛍️ {title}</p>
                    <Link href={href} className="shrink-0 whitespace-nowrap text-[12px] font-bold text-accent hover:underline">{verTudoLabel} →</Link>
                </div>
                <p className="mt-1 text-[11px] leading-tight text-foreground-subtle">Links de afiliado: o HallyuHub pode receber comissão.</p>
            </div>
            {/* Celular: três cartões lado a lado (foto em cima), ~240 px de altura em vez de ~400 px empilhados. */}
            <VitrineVista contexto={contexto} produtoIds={itens.map(p => p.id)} className="grid grid-cols-3 gap-2 sm:gap-3">
                {itens.map(p => {
                    const { acf } = p
                    const nome = stripHtml(p.title.rendered)
                    const desconto = calcularDesconto(acf.price, acf.original_price)
                    const motivo = motivos?.[p.id]
                    const selo = motivo && motivo !== 'maratona' ? ROTULO_MOTIVO[motivo] : null
                    return (
                        <LojaClique key={p.id} href={acf.affiliate_url!} productId={p.id} store={acf.store ?? 'outro'} contexto={contexto}
                            className="group flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-background p-1.5 transition-colors hover:border-accent sm:flex-row sm:gap-3 sm:p-3">
                            <span className="relative aspect-square w-full shrink-0 overflow-hidden bg-surface sm:h-24 sm:w-24">
                                {acf.image_url && <Image src={acf.image_url} alt={nome} fill sizes="(min-width: 640px) 96px, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />}
                                {desconto !== null && <span className="absolute left-0 top-0 bg-accent px-1.5 py-0.5 text-[10px] font-black text-white">-{desconto}%</span>}
                                {selo && <span className="absolute inset-x-0 bottom-0 bg-foreground/80 px-1 py-0.5 text-center text-[10px] font-bold leading-tight text-background sm:hidden">{selo}</span>}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col px-0.5 sm:px-0">
                                {selo && <span className="mb-0.5 hidden text-[10px] font-black uppercase tracking-wider text-accent sm:block">{selo}</span>}
                                <span className="line-clamp-2 text-[12px] font-semibold leading-snug sm:text-[13px]">{nome}</span>
                                <span className="mt-auto block pt-1">
                                    {acf.price && (
                                        <span className="block">
                                            <span className="text-[15px] font-black leading-none sm:text-lg">{acf.price}</span>
                                            {desconto !== null && acf.original_price && <span className="ml-1.5 hidden text-[12px] text-muted line-through sm:inline">{acf.original_price}</span>}
                                        </span>
                                    )}
                                    <span className="mt-auto hidden items-center gap-1 pt-2 text-[12px] font-black text-accent sm:inline-flex">
                                        Ver oferta <ExternalLink size={12} aria-hidden />
                                    </span>
                                </span>
                            </span>
                        </LojaClique>
                    )
                })}
            </VitrineVista>
        </aside>
    )
}
