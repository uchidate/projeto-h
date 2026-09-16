import { GroupSectionHeading } from '@/components/groups/GroupSectionHeading'
import type { ArtistMilestone } from '@/lib/profiles/structuredFields'

export function ArtistTimeline({ milestones, eyebrow, accent }: { milestones: ArtistMilestone[]; eyebrow: string; accent: string }) {
    if (!milestones.length) return null

    return (
        <div>
            <div className="mb-6"><GroupSectionHeading id="marcos-titulo" eyebrow={eyebrow} title="Marcos da carreira" accent={accent} /></div>
            <ol className="profile-panel grid gap-0 divide-y divide-border/70 profile-measure">
                {milestones.map((m, i) => (
                    <li key={i} className="grid gap-3 p-4 sm:grid-cols-[96px_minmax(0,1fr)] sm:p-5">
                        <span className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-accent">{m.year}</span>
                        <p className="text-[0.95rem] leading-7 text-foreground-subtle">{m.description}</p>
                    </li>
                ))}
            </ol>
        </div>
    )
}
