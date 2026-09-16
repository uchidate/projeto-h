import { useTranslations } from 'next-intl'
import { ExternalLink } from 'lucide-react'
import type { WPGroup } from '@/lib/wordpress/types'
import { GroupHeadlineStat } from '@/components/groups/GroupHeadlineStat'

type Metric = NonNullable<NonNullable<WPGroup['acf']>['key_metrics']>[number]

interface Props {
    metrics: Metric[]
    accent: string
}

function MetricCard({ metric, className = '' }: { metric: Metric, className?: string }) {
    const t = useTranslations('profile.ui')
    return (
        // A cifra lidera e o rótulo vem abaixo: rótulos de 1 a 3 linhas
        // empurravam os números para alturas diferentes, quebrando a linha de
        // base comum entre as colunas. A inversão é só visual (order-*) — no
        // DOM o termo continua antes da definição, como a <dl> exige.
        <div className={`group/metric flex flex-col py-5 pr-8 ${className}`}>
            <dt className="order-2 mt-2.5 block max-w-[34ch] font-mono text-[9px] font-black uppercase leading-4 tracking-[0.12em] text-muted">{metric.label}</dt>
            <dd className="order-1">
                <strong className="block text-2xl font-black leading-none tracking-[-0.035em] transition-colors sm:text-3xl group-hover/metric:text-(--gkm-accent)">{metric.value}</strong>
            </dd>
            <dd className="order-3">
                {metric.context && <span className="mt-2 block max-w-[36ch] text-[12px] leading-5 text-foreground/60">{metric.context}</span>}
                <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[8px] font-black uppercase tracking-[0.11em]">
                    {metric.as_of && <span className="text-muted">{t('asOf', { date: metric.as_of })}</span>}
                    {metric.source_url && (
                        <a href={metric.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted underline decoration-border underline-offset-4 hover:text-foreground">
                            {t('source')} <ExternalLink size={9} />
                        </a>
                    )}
                </span>
            </dd>
        </div>
    )
}

export function GroupKeyMetrics({ metrics, accent }: Props) {
    const t = useTranslations('profile.ui')
    const [headline, ...rest] = metrics
    return (
        // Sem moldura externa: a seção antes era um card contendo cards. A voz
        // editorial separa por fio e respiro, então a régua fica nas células.
        <div style={{ '--gkm-accent': accent } as React.CSSProperties}>
            {headline && (
                <GroupHeadlineStat
                    value={headline.value}
                    label={headline.label}
                    context={headline.context}
                    asOf={headline.as_of}
                    sourceUrl={headline.source_url}
                    accent={accent}
                />
            )}
            {rest.length > 0 && (
                <>
                    {/* Mobile: carrossel com swipe e "espiada" do próximo card */}
                    <div className="flex items-center justify-between px-5 pt-3 sm:hidden">
                        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">{t('moreNumbers')}</span>
                        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">{t('swipe')}</span>
                    </div>
                    <dl className="no-scrollbar flex snap-x snap-mandatory divide-x divide-border overflow-x-auto sm:hidden">
                        {rest.map((metric, index) => (
                            <MetricCard key={`m-${index}`} metric={metric} className="min-w-[78%] shrink-0 snap-start" />
                        ))}
                    </dl>
                    {/* Desktop/tablet: grade fixa */}
                    <dl className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3">
                        {rest.map((metric, index) => (
                            <MetricCard
                                key={`m-${index}`}
                                metric={metric}
                                className="border-t border-border/70"
                            />
                        ))}
                    </dl>
                </>
            )}
        </div>
    )
}
