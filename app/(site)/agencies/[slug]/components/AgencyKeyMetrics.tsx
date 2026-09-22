import { ExternalLink } from 'lucide-react'
import type { WPAgency } from '@/lib/wordpress/types'

type KeyMetric = NonNullable<NonNullable<WPAgency['acf']>['key_metrics']>[number]

export function AgencyKeyMetrics({ name, keyMetrics }: { name: string; keyMetrics: KeyMetric[] }) {
    return (
        <section id="numeros" aria-labelledby="numeros-agencia" className="scroll-mt-(--scroll-anchor-offset,106px) overflow-hidden border border-border bg-surface">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border px-5 py-4 sm:px-6">
                <div>
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-(--ac)">Em números</p>
                    <h2 id="numeros-agencia" className="mt-1 text-sm font-bold text-foreground/75">A escala da {name}, em dados com fonte</h2>
                </div>
                <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">Cada número liga para a fonte primária</p>
            </div>
            <dl className="grid sm:grid-cols-2 lg:grid-cols-3">
                {keyMetrics.map((metric, index) => (
                    <div key={`${metric.label}-${index}`} className="group/metric relative border-b border-border p-5 transition-colors last:border-b-0 hover:bg-(--ac-08) sm:border-r sm:nth-[2n]:border-r-0 lg:nth-[2n]:border-r lg:nth-[3n]:border-r-0 sm:nth-last-[-n+2]:border-b-0 lg:nth-last-[-n+3]:border-b-0 sm:p-6">
                        <dt className="block font-mono text-[9px] font-black uppercase leading-4 tracking-[0.12em] text-muted">{metric.label}</dt>
                        <dd className="mt-3">
                            <strong className="block text-3xl font-black leading-none tracking-[-0.04em] transition-colors group-hover/metric:text-(--ac) sm:text-4xl">{metric.value}</strong>
                            {metric.context && <span className="mt-3 block max-w-[36ch] text-[12px] leading-5 text-foreground/60">{metric.context}</span>}
                            <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[8px] font-black uppercase tracking-[0.11em]">
                                {metric.as_of && <span className="text-muted">ref. {metric.as_of}</span>}
                                {metric.source_url && (
                                    <a href={metric.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted underline decoration-border underline-offset-4 hover:text-(--ac)">
                                        Fonte <ExternalLink size={9} />
                                    </a>
                                )}
                            </span>
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    )
}
