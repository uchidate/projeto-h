import { SITE_NAME } from '@/lib/constants/site'
import { ExternalLink } from 'lucide-react'
import { FactGrid } from '@/components/blocks/FactGrid'
import type { AgencyView } from '@/app/(site)/agencies/[slug]/lib/carregarAgencia'

export function AgencySummary({ view }: { view: AgencyView }) {
    const { agency, name, acf, interfaceAccent, excerptText, updatedAtLabel, aboutFallback, summaryFacts } = view
    return (
        <section id="sobre" aria-labelledby="resumo-agencia" className="scroll-mt-(--scroll-anchor-offset,106px) border-y border-foreground/10 py-7 sm:py-9">
            <div>
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-(--ac)">Em resumo</p>
                <h2 id="resumo-agencia" className="mt-2 max-w-4xl text-2xl font-black leading-tight tracking-[-0.035em] sm:text-4xl">
                    O que você precisa saber sobre {name}
                </h2>
                <p className="mt-4 max-w-4xl border-l-[3px] pl-5 text-[17px] font-semibold leading-8 text-foreground/80 sm:text-xl sm:leading-9" style={{ borderColor: interfaceAccent }}>
                    {acf.story_intro || excerptText || aboutFallback}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                    <span className="font-black text-foreground/70">Curadoria {SITE_NAME}</span>
                    {updatedAtLabel && (
                        <>
                            <span aria-hidden="true" className="text-border">·</span>
                            <span>Atualizado em <time dateTime={agency.modified}>{updatedAtLabel}</time></span>
                        </>
                    )}
                    {acf.website && (
                        <>
                            <span aria-hidden="true" className="text-border">·</span>
                            <a href={acf.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline decoration-border underline-offset-4 hover:text-foreground">
                                Fonte institucional <ExternalLink size={9} />
                            </a>
                        </>
                    )}
                </div>
            </div>
            <FactGrid items={summaryFacts} columns={4} className="mt-7 grid-cols-2" />
        </section>
    )
}
