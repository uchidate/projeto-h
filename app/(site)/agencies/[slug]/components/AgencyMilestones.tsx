import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { toRgba } from '@/lib/agencies/presentation'
import { SectionHeader } from './SectionHeader'

type Milestone = { year: string; desc: string }

export function AgencyMilestones({ milestones, interfaceAccent }: { milestones: Milestone[]; interfaceAccent: string }) {
    return (
        <section id="historia" className="scroll-mt-(--scroll-anchor-offset,106px)">
            <SectionHeader label="Cronologia" title="Linha do tempo" count={null} />
            <div className="mt-8 relative">
                {/* Vertical line */}
                <div className="absolute left-[39px] top-0 bottom-6 w-px hidden sm:block [background:var(--ac-15)]" />

                <div className="space-y-0">
                    {milestones.map((m, i) => (
                        <div key={i} className="relative flex items-start gap-4 sm:gap-6 group/item">
                            {/* Year */}
                            <div className="relative z-1 shrink-0 w-[78px] pt-5">
                                <div
                                    className="hidden sm:flex items-center justify-center w-full h-8 border font-mono text-[11px] font-black transition-all duration-150 group-hover/item:text-white"
                                    style={{ borderColor: toRgba(interfaceAccent, 0.3) }}
                                >
                                    <style>{`.group\\/item:hover .year-badge-${i} { background: var(--ac); border-color: var(--ac); color: white; }`}</style>
                                    <span className={`year-badge-${i} w-full h-full flex items-center justify-center transition-all duration-150`}>
                                        {m.year}
                                    </span>
                                </div>
                                <div className="sm:hidden font-mono text-[11px] font-black text-(--ac)">{m.year}</div>
                            </div>

                            {/* Dot on the line */}
                            <div
                                className="hidden sm:block absolute left-[39px] top-[22px] w-3 h-3 -translate-x-1/2 border-2 bg-background z-2 transition-all duration-150 group-hover/item:[background:var(--ac)] group-hover/item:border-(--ac)"
                                style={{ borderColor: toRgba(interfaceAccent, 0.4) }}
                            />

                            {/* Text */}
                            <div className="flex-1 py-5 border-b border-border/20 last:border-b-0">
                                <p className="text-[13px] leading-[1.7] text-foreground/75 group-hover/item:text-foreground/90 transition-colors">{m.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 flex items-center justify-center">
                    <Link
                        href="/groups"
                        className="inline-flex items-center gap-2 border border-border px-5 py-3 font-mono text-[11px] font-black uppercase tracking-wider hover:border-(--ac) hover:text-(--ac) transition-colors group"
                    >
                        Explorar todos os artistas & grupos
                        <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </section>
    )
}
