import { ExternalLink } from 'lucide-react'
import { SectionHeader } from '@/app/(site)/agencies/[slug]/components/SectionHeader'
import type { AgencyView } from '@/app/(site)/agencies/[slug]/lib/carregarAgencia'

export function AgencyBusinessModel({ view }: { view: AgencyView }) {
    const { businessPillars, pillarsHeading } = view
    return (
        <section id="modelo" className="scroll-mt-(--scroll-anchor-offset,106px)">
            <SectionHeader label={pillarsHeading.label} title={pillarsHeading.title} count={businessPillars.length} />
            <p className="profile-content-measure -mt-2 text-[14px] leading-6 text-muted">
                Frentes declaradas pela própria organização, contextualizadas para distinguir produção musical, plataformas e outras operações.
            </p>
            <div className={`mt-6 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 ${businessPillars.length >= 3 ? 'lg:grid-cols-3' : ''} ${businessPillars.length === 4 ? 'xl:grid-cols-4' : ''}`}>
                {businessPillars.map((pillar, index) => (
                    <article key={`${pillar.title}-${index}`} className="bg-background p-6 sm:min-h-56">
                        <div className="flex items-center justify-between gap-4">
                            <span className="font-mono text-[10px] font-black tabular-nums text-(--ac)">0{index + 1}</span>
                            {pillar.source_url && (
                                <a href={pillar.source_url} target="_blank" rel="noopener noreferrer" aria-label={`Fonte do pilar ${pillar.title}`} className="text-muted transition-colors hover:text-foreground">
                                    <ExternalLink size={13} />
                                </a>
                            )}
                        </div>
                        <h3 className="mt-8 text-xl font-black tracking-tight">{pillar.title}</h3>
                        <p className="mt-3 text-[13px] leading-6 text-foreground/70">{pillar.description}</p>
                    </article>
                ))}
            </div>
        </section>
    )
}
