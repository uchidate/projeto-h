import type { QuizQuestion } from '@/lib/wordpress/quiz'
import { CATEGORY_META } from '../lib/config'

export function ScoreTimeline({ answers, questions }: { answers: (number | null)[]; questions: QuizQuestion[] }) {
    return (
        <div className="flex gap-0.5 flex-wrap">
            {questions.map((q, i) => {
                const a = answers[i]
                if (a === null) return <div key={i} className="w-5 h-5 bg-surface border border-border" />
                const correct = a === q.correct
                const meta = CATEGORY_META[q.category]
                return (
                    <div key={i} title={`Q${i+1}: ${q.category} — ${correct ? 'Certo' : 'Errado'}`}
                        className={`w-5 h-5 flex items-center justify-center border ${correct ? 'border-green-500/30 bg-green-500/20' : 'border-red-500/30 bg-red-500/20'}`}>
                        {meta && <meta.Icon className={`w-2.5 h-2.5 ${correct ? 'text-green-400' : 'text-red-400'}`} />}
                    </div>
                )
            })}
        </div>
    )
}
