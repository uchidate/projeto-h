export function AccuracyBar({ correct, total }: { correct: number; total: number }) {
    if (total === 0) return null
    const pct = (correct / total) * 100
    const color = pct >= 70 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171'
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-border overflow-hidden">
                <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="font-mono text-[11px] font-black shrink-0" style={{ color }}>{Math.round(pct)}%</span>
        </div>
    )
}
