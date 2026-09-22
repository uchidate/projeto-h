import { Trophy, Medal } from 'lucide-react'
import { intlLocale } from '@/lib/i18n/format'
import type { QuizStats } from '../lib/stats'
import { DIFFICULTY_CONFIG } from '../lib/config'

export function ScoreHistory({ scores }: { scores: QuizStats['scores'] }) {
    if (scores.length === 0) return null
    return (
        <div className="border border-border bg-surface p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-4 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />Últimas partidas
            </p>
            <div className="space-y-1.5">
                {scores.slice(0, 5).map((s, i) => {
                    const pct = Math.round((s.score / s.total) * 100)
                    const cfg = DIFFICULTY_CONFIG[s.difficulty]
                    return (
                        <div key={i} className={`flex items-center gap-3 px-3 py-2 border ${i === 0 ? 'border-amber-400/30 bg-amber-400/5' : 'border-border'}`}>
                            <span className={`text-[13px] font-black w-5 tabular-nums shrink-0 ${i === 0 ? 'text-amber-400' : 'text-muted'}`}>{i + 1}</span>
                            {i === 0 && <Medal className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            <span className="font-mono text-[11px] font-black text-amber-400 tabular-nums flex-1">{s.points.toLocaleString()} pts</span>
                            <span className="text-[11px] text-muted tabular-nums">{s.score}/{s.total} · {pct}%</span>
                            {(s.streak ?? 0) >= 3 && <span className="text-[10px]">🔥{s.streak}</span>}
                            <span className={`font-mono text-[9px] font-black ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-[10px] text-muted hidden sm:inline">
                                {new Date(s.date).toLocaleDateString(intlLocale(), { day: '2-digit', month: 'short' })}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
