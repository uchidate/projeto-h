import { ProductionCard } from '@/components/productions/ProductionCard'
import type { WPProduction } from '@/lib/wordpress/types'

/** Grade de produções do painel da conta. */
export function GradeDeProducoes({ producoes }: { producoes: WPProduction[] }) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {producoes.map(p => <ProductionCard key={p.id} production={p} />)}
        </div>
    )
}
