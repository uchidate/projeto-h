import Link from 'next/link'
import type { StoreProduct } from '@/lib/wordpress/store'
import { StoreCard } from '@/components/ui/StoreCard'

interface Props {
    title: string
    products: StoreProduct[]
}

export function ShopRelatedSection({ title, products }: Props) {
    if (products.length === 0) return null

    return (
        <div className="page-wrap py-8 border-t border-border/40">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Shop</p>
                    <h2 className="text-[18px] font-black tracking-[-0.03em]">{title}</h2>
                </div>
                <Link href="/loja" className="text-[12px] font-bold text-accent hover:underline">
                    Ver tudo na loja →
                </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {products.slice(0, 4).map(p => <StoreCard key={p.id} product={p} />)}
            </div>
        </div>
    )
}
