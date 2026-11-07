'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toRgba } from '@/lib/theme/color'

interface EraItem {
    year: string
    text: string
}

interface Props {
    historico: string[]
    accent: string
    groupName: string
}

function groupIntoEras(items: EraItem[], eraNames: string[], fallback: (year: number) => string): { label: string; years: string; items: EraItem[]; startYear: number }[] {
    if (items.length === 0) return []
    const sorted = [...items].sort((a, b) => parseInt(a.year) - parseInt(b.year))
    const groups: typeof sorted[] = []
    let current: typeof sorted = [sorted[0]]
    for (let i = 1; i < sorted.length; i++) {
        const gap = parseInt(sorted[i].year) - parseInt(sorted[i - 1].year)
        if (gap > 2) { groups.push(current); current = [sorted[i]] }
        else { current.push(sorted[i]) }
    }
    groups.push(current)
    return groups.map((g, i) => {
        const years = g.map(x => x.year)
        const minY = Math.min(...years.map(Number))
        const maxY = Math.max(...years.map(Number))
        return { label: eraNames[i] ?? fallback(minY), years: minY === maxY ? String(minY) : `${minY}–${maxY}`, items: g, startYear: minY }
    })
}

export function GroupErasTimeline({ historico, accent, groupName }: Props) {
    const t = useTranslations('client.groupBlocks')
    const [activeEra, setActiveEra] = useState(0)
    const eraNames = [t('eraDebut'), t('eraRise'), t('eraConsolidation'), t('eraGolden'), t('eraReinvention'), t('eraLegacy'), t('eraNew')]

    const items: EraItem[] = historico
        .filter(c => c.startsWith('HISTÓRICO|'))
        .map(c => { const [, year, ...rest] = c.split('|'); return { year, text: rest.join('|') } })

    if (items.length === 0) return null

    const eras = groupIntoEras(items, eraNames, year => t('eraFallback', { year }))
    const active = eras[activeEra]

    return (
        <section id="timeline">
            <div className="mb-5 border-b border-foreground pb-3">
                <p className="font-mono text-[10px] font-black uppercase leading-4 tracking-[0.12em] text-muted">{t('dossier')}</p>
                <h2 className="text-xl font-black tracking-[-0.03em]">{t('timelineTitle')}</h2>
            </div>

            {/* Era nav — pill buttons */}
            <div className="overflow-x-auto pb-4 mb-5 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="flex items-center gap-2 min-w-max">
                    {eras.map((era, i) => {
                        const isActive = i === activeEra
                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setActiveEra(i)}
                                className="touch-target flex flex-col items-start border px-4 py-2.5 transition-all duration-150 focus:outline-hidden"
                                style={isActive ? {
                                    borderColor: accent,
                                    background: toRgba(accent, 0.1),
                                } : {
                                    borderColor: toRgba(accent, 0.25),
                                    background: 'transparent',
                                }}
                            >
                                <span className="font-mono text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                                    style={{ color: isActive ? accent : toRgba(accent, 0.6) }}>
                                    {era.label}
                                </span>
                                <span className="whitespace-nowrap font-mono text-[10px] leading-4"
                                    style={{ color: isActive ? toRgba(accent, 0.8) : 'var(--color-muted)' }}>
                                    {era.years} · {t('milestones', { count: era.items.length })}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Events of active era */}
            <div className="flex flex-col gap-3">
                {active.items.map((item, i) => (
                    <div key={`${item.year}-${i}`}
                        className="flex gap-4 p-4 border border-border bg-background">
                        <div className="shrink-0 flex flex-col items-center pt-0.5">
                            <span className="font-mono text-[22px] font-black leading-none tabular-nums"
                                style={{ color: accent }}>
                                {item.year}
                            </span>
                            {i < active.items.length - 1 && (
                                <div className="mt-2 w-px flex-1 min-h-[16px]"
                                    style={{ background: toRgba(accent, 0.2) }} />
                            )}
                        </div>
                        <p className="text-[13px] leading-relaxed text-foreground pt-1">
                            {item.text}
                        </p>
                    </div>
                ))}
            </div>

            <p className="mt-3 text-right font-mono text-[10px] uppercase leading-4 tracking-widest text-muted">
                {groupName} · {t('milestones', { count: items.length })} · {t('erasCount', { count: eras.length })}
            </p>
        </section>
    )
}
