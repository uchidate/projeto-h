import Link from 'next/link'
import type { StoreProduct } from '@/lib/wordpress/store'
import { PrateleiraRotativa } from '@/components/ui/PrateleiraRotativa'

interface Shelf {
    title: string
    products: StoreProduct[]
    /** Vitrine específica (ex.: /loja/grupo/bts) — cai em /loja quando ausente. */
    href?: string
    /** Texto do link "ver tudo", já pensado pra reconhecer o contexto (não é genérico "ver loja"). */
    verTudoLabel?: string
    /** Identifica a prateleira no evento de clique (ex.: "artista:jisoo-kim"). */
    contexto?: string
}

interface Props extends Shelf {
    /** Segunda prateleira dentro da mesma faixa (ex.: produtos do grupo na página do integrante). Evita duas faixas idênticas grudadas. */
    secondary?: Shelf
}

function ShelfBlock({ title, products, href = '/loja', verTudoLabel = 'Ver tudo na loja', contexto = 'loja' }: Shelf) {
    return (
        <div>
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-[19px] font-black tracking-[-0.03em] sm:text-[22px]">{title}</h2>
                <Link href={href} className="shrink-0 whitespace-nowrap text-[13px] font-bold text-accent hover:underline">
                    {verTudoLabel} →
                </Link>
            </div>
            <PrateleiraRotativa produtos={products.slice(0, 8)} contexto={contexto} />
        </div>
    )
}

export function ShopRelatedSection({ title, products, href = '/loja', verTudoLabel = 'Ver tudo na loja', secondary }: Props) {
    const hasPrimary = products.length > 0
    const hasSecondary = !!secondary && secondary.products.length > 0
    if (!hasPrimary && !hasSecondary) return null

    // Sem produtos próprios mas com produtos do grupo: a prateleira do grupo assume o topo, não some.
    const primaryShelf = hasPrimary ? { title, products, href, verTudoLabel } : secondary!
    const extraShelf = hasPrimary ? (hasSecondary ? secondary : undefined) : undefined

    return (
        <div className="border-y border-accent/20 bg-accent-a11y/5 py-10">
            <div className="page-wrap">
                <p className="mb-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-accent">
                    🛍️ Shop <span className="font-sans normal-case tracking-normal text-foreground-subtle">· links de afiliado</span>
                </p>
                <div className="space-y-8">
                    <ShelfBlock {...primaryShelf} />
                    {extraShelf && (
                        <div className="border-t border-accent/15 pt-8">
                            <ShelfBlock {...extraShelf} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
