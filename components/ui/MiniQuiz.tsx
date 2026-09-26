'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, ArrowRight } from 'lucide-react'

export interface MiniQuizItem {
    id: number
    question: string
    options: string[]
    correct: number
    explanation: string
}

interface Props {
    items: MiniQuizItem[]
    entityName: string
    quizHref: string
}

export function MiniQuiz({ items, entityName, quizHref }: Props) {
    const [i, setI] = useState(0)
    const [picked, setPicked] = useState<number | null>(null)
    const [acertos, setAcertos] = useState(0)
    const fim = i >= items.length
    const q = items[i]

    function responder(idx: number) {
        if (picked !== null || !q) return
        setPicked(idx)
        if (idx === q.correct) setAcertos(a => a + 1)
    }

    return (
        <div className="border border-border bg-surface p-4 sm:p-5">
            {fim ? (
                <div>
                    <p className="text-[16px] font-black leading-tight text-foreground">
                        {acertos} de {items.length} sobre {entityName}
                    </p>
                    <Link href={quizHref} className="touch-target mt-3 inline-flex items-center gap-2 text-[13px] font-black text-accent hover:underline">
                        Mais perguntas no quiz <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            ) : (
                <>
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                        Pergunta {i + 1} de {items.length}
                    </p>
                    <p className="mt-1 text-[16px] font-black leading-snug text-foreground">{q.question}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {q.options.map((op, idx) => {
                            const certa = picked !== null && idx === q.correct
                            const errada = picked === idx && idx !== q.correct
                            return (
                                <button
                                    key={idx} type="button" onClick={() => responder(idx)} disabled={picked !== null}
                                    className={`touch-target flex items-center justify-between gap-2 border px-3 py-2 text-left text-[14px] font-bold transition-colors ${
                                        certa ? 'border-green-500 bg-green-500/10 text-foreground'
                                        : errada ? 'border-red-500 bg-red-500/10 text-foreground'
                                        : 'border-border bg-background text-foreground hover:border-accent/60 disabled:opacity-70'
                                    }`}
                                >
                                    <span>{op}</span>
                                    {certa && <Check className="h-4 w-4 shrink-0 text-green-500" />}
                                    {errada && <X className="h-4 w-4 shrink-0 text-red-500" />}
                                </button>
                            )
                        })}
                    </div>
                    {picked !== null && (
                        <div className="mt-3" aria-live="polite">
                            <p className="text-[13px] leading-relaxed text-muted">{q.explanation}</p>
                            <button type="button" onClick={() => { setI(i + 1); setPicked(null) }}
                                className="touch-target mt-2 inline-flex items-center gap-2 text-[13px] font-black text-accent hover:underline">
                                {i + 1 < items.length ? 'Próxima' : 'Ver resultado'} <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
