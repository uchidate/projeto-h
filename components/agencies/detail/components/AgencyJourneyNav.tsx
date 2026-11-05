import { useTranslations } from 'next-intl'

import type { AgencyView } from '@/components/agencies/detail/lib/carregarAgencia'

export function AgencyJourneyNav({ view }: { view: AgencyView }) {
    const t = useTranslations('entity.agency.ui')
    const { name, narrativeChapters, chapterCountLabel } = view
    return (
        <nav aria-label={t('journey.navLabel')} className="overflow-hidden border border-border bg-surface">
            <div className="border-b border-border px-5 py-4 sm:px-6">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.15em] text-(--ac)">{t('journey.route')}</p>
                <p className="mt-1 text-sm font-bold text-foreground/75">{t('journey.subtitle', { count: chapterCountLabel, name })}</p>
            </div>
            <div className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden lg:grid" style={{ gridTemplateColumns: `repeat(${narrativeChapters.length}, minmax(0, 1fr))` }}>
                {narrativeChapters.map((chapter, index) => (
                    <a key={`${chapter.period}-route`} href={`#capitulo-${index + 1}`} className="group/route min-w-[58%] snap-start border-r border-border p-5 last:border-r-0 sm:min-w-[38%] lg:min-w-0">
                        <span className="font-mono text-[10px] text-muted">0{index + 1}</span>
                        <strong className="mt-5 block font-mono text-[11px] text-(--ac)">{chapter.period}</strong>
                        <span className="mt-2 block text-sm font-black leading-snug transition-colors group-hover/route:text-(--ac)">{chapter.title}</span>
                    </a>
                ))}
            </div>
        </nav>
    )
}
