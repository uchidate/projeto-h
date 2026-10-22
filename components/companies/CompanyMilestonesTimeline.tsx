interface Props {
    milestones: string[]
    accent: string
}

/**
 * Linha do tempo simples — diferente de GroupErasTimeline (com abas por era):
 * empresa tem 2-4 marcos, não dezenas, então agrupar em eras seria ruído.
 */
export function CompanyMilestonesTimeline({ milestones, accent }: Props) {
    const items = milestones
        .map(m => { const [year, ...rest] = m.split('|'); return { year: year.trim(), text: rest.join('|').trim() } })
        .filter(i => i.year && i.text)
        .sort((a, b) => parseInt(a.year) - parseInt(b.year))

    if (items.length === 0) return null

    return (
        <section id="historia">
            <div className="mb-5 border-b border-foreground pb-3">
                <p className="font-mono text-[10px] font-black uppercase leading-4 tracking-[0.12em] text-muted">Linha do tempo</p>
                <h2 className="text-xl font-black tracking-[-0.03em]">Marcos da história</h2>
            </div>
            <div className="flex flex-col gap-3">
                {items.map((item, i) => (
                    <div key={`${item.year}-${i}`} className="flex gap-4 p-4 border border-border bg-background">
                        <div className="shrink-0 flex flex-col items-center pt-0.5">
                            <span className="font-mono text-[22px] font-black leading-none tabular-nums" style={{ color: accent }}>
                                {item.year}
                            </span>
                            {i < items.length - 1 && (
                                <div className="mt-2 w-px flex-1 min-h-[16px]" style={{ background: accent, opacity: 0.2 }} />
                            )}
                        </div>
                        <p className="text-[13px] leading-relaxed text-foreground pt-1">{item.text}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}
