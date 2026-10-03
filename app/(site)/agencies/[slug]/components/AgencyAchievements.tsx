import { Trophy, ChevronRight } from 'lucide-react'
import { SectionHeader } from '@/app/(site)/agencies/[slug]/components/SectionHeader'
import type { AgencyView } from '@/app/(site)/agencies/[slug]/lib/carregarAgencia'

export function AgencyAchievements({ view }: { view: AgencyView }) {
    const { achievements } = view
    return (
        <section id="conquistas" className="scroll-mt-(--scroll-anchor-offset,106px)">
            <SectionHeader label="Impacto" title="Marcos e impacto" count={achievements.length} />
            <div className={`profile-panel mt-6 grid gap-0 overflow-hidden ${achievements.length > 1 ? 'lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]' : ''}`}>
                <div className={`p-6 lg:p-8 ${achievements.length > 1 ? 'border-b border-border/70 lg:border-b-0 lg:border-r' : ''}`}>
                    <Trophy size={22} className="mb-5 text-(--ac)" />
                    <p className="profile-kicker mb-3 text-(--ac)">Marco principal</p>
                    <p className="max-w-2xl text-xl font-black leading-snug tracking-tight sm:text-2xl">{achievements[0]}</p>
                </div>
                {achievements.length > 1 && (
                    <div className="divide-y divide-border/70">
                        {achievements.slice(1, 5).map((a, i) => (
                            <div key={i} className="group flex items-start gap-3 p-4 transition-colors hover:bg-foreground/2.5">
                                <Trophy size={14} className="mt-0.5 shrink-0 text-(--ac) opacity-70" />
                                <p className="text-[13px] leading-snug">{a}</p>
                            </div>
                        ))}
                        {achievements.length > 5 && (
                            <details className="group/details">
                                <summary className="cursor-pointer list-none p-4 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-muted transition-colors hover:text-foreground marker:content-none">
                                    <span className="inline-flex items-center gap-2">
                                        <ChevronRight size={12} className="transition-transform group-open/details:rotate-90" />
                                        Ver mais {achievements.length - 5} marcos
                                    </span>
                                </summary>
                                <div className="divide-y divide-border/70 border-t border-border/70">
                                    {achievements.slice(5).map((a, i) => (
                                        <div key={i} className="flex items-start gap-3 p-4">
                                            <Trophy size={14} className="mt-0.5 shrink-0 text-(--ac) opacity-70" />
                                            <p className="text-[13px] leading-snug">{a}</p>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        )}
                    </div>
                )}
            </div>
        </section>
    )
}
