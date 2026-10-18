import Link from 'next/link'
import type { StoreProduct } from '@/lib/wordpress/store'
import { StoreCard } from '@/components/ui/StoreCard'

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
 * Faixa compacta de produtos para o MEIO da página, onde a prateleira grande do
 * rodapé raramente chega. Três cartões, sem cobrir conteúdo nem rolar sozinha: o
 * clique é escolha do leitor. Some quando não há produto com link de afiliado.
 */
export function LojaEmLinha({ products, bloco, contexto, title = 'Achados da loja', href = '/loja', verTudoLabel = 'Ver loja', className = '' }: Props) {
    const itens = products.filter(p => p.acf.affiliate_url).slice(0, 3)
    if (itens.length === 0) return null
    return (
        <aside data-bloco={bloco} aria-label={title} className={`rounded-xl border border-border bg-surface p-3 sm:p-4 ${className}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-accent">
                    🛍️ {title} <span className="font-sans normal-case tracking-normal text-foreground-subtle">· links de afiliado</span>
                </p>
                <Link href={href} className="shrink-0 whitespace-nowrap text-[12px] font-bold text-accent hover:underline">{verTudoLabel} →</Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
                {itens.map(p => <StoreCard key={p.id} product={p} compact contexto={contexto} />)}
            </div>
        </aside>
    )
}
