export function TimeChart({ times, maxTime }: { times: number[]; maxTime: number }) {
    if (times.length === 0) return null
    return (
        <div className="flex items-end gap-0.5 h-10">
            {times.map((t, i) => {
                const pct = maxTime > 0 ? (t / maxTime) * 100 : 0
                const fast = t <= maxTime * 0.4
                return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`Q${i+1}: ${t}s`}>
                        <div className="w-full min-h-[2px] transition-all"
                            style={{ height: `${Math.max(4, pct)}%`, background: fast ? '#4ade80' : t <= maxTime * 0.7 ? '#fbbf24' : '#f87171' }} />
                    </div>
                )
            })}
        </div>
    )
}
