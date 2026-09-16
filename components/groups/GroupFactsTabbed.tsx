'use client'

import { useState } from 'react'
import { GroupTrophyWall } from './GroupTrophyWall'
import { GroupErasTimeline } from './GroupErasTimeline'

interface Props {
    curiosidades: string[]
    accent: string
    groupName: string
}

export function GroupFactsTabbed({ curiosidades, accent, groupName }: Props) {
    const facts = curiosidades.filter(c => !c.startsWith('HISTÓRICO|'))
    const history = curiosidades.filter(c => c.startsWith('HISTÓRICO|'))
    const hasFacts = facts.length > 0
    const hasHistory = history.length > 0

    const tabs = [
        hasHistory && { id: 'timeline',   label: `Timeline · ${history.length}` },
        hasFacts   && { id: 'conquistas', label: `Conquistas · ${facts.length}` },
    ].filter(Boolean) as Array<{ id: string; label: string }>

    const [active, setActive] = useState(tabs[0]?.id ?? 'conquistas')

    if (tabs.length === 0) return null

    return (
        <section id="conquistas" className="scroll-mt-(--scroll-anchor-offset,106px)">
            {/* Tab bar */}
            {tabs.length > 1 && (
                <div className="flex gap-1 mb-6 border-b border-border">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActive(tab.id)}
                            className={`touch-target px-4 py-2.5 font-mono text-[11px] font-black uppercase tracking-widest transition-colors border-b-2 -mb-px ${
                                active === tab.id
                                    ? 'border-current text-foreground'
                                    : 'border-transparent text-muted hover:text-foreground'
                            }`}
                            style={active === tab.id ? { borderColor: accent, color: accent } : undefined}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {active === 'timeline' && hasHistory && (
                <GroupErasTimeline historico={curiosidades} accent={accent} groupName={groupName} />
            )}
            {active === 'conquistas' && hasFacts && (
                <GroupTrophyWall curiosidades={curiosidades} accent={accent} groupName={groupName} />
            )}
        </section>
    )
}
