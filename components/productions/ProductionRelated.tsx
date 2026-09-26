import { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { WPProduction, WPTerm } from '@/lib/wordpress/types'
import { ProductionCard } from '@/components/productions/ProductionCard'

interface Props {
    related: WPProduction[]
    genres: WPTerm[]
}

export function ProductionRelated({ related, genres }: Props) {
    const t = useTranslations('profile.ui')
    if (!related.length) return null
    return (
        <div data-bloco="ficha-producao-relacionadas" className="mt-14 border-t border-border pt-10">
            <div className="flex items-baseline justify-between mb-6">
                <h2 className="text-[20px] font-black">{t('youMayLike')}</h2>
                {genres.length > 0 && (
                    <Link href={`/productions?genre=${genres[0].slug}`}
                        className="font-mono text-[11px] text-accent hover:underline uppercase tracking-[0.06em]">
                        {t('seeMore')}
                    </Link>
                )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-3 gap-y-5">
                {related.map(prod => (
                    <ProductionCard key={prod.id} production={prod}
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 14vw" />
                ))}
            </div>
        </div>
    )
}
