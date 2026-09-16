'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Trophy, CheckCircle2, XCircle, ArrowRight, RotateCcw, ChevronRight } from 'lucide-react'
import type { QuizQuestion, QuizCategory } from '@/lib/wordpress/quiz'

interface Props {
    questions: QuizQuestion[]
    category: QuizCategory
}

type Phase = 'idle' | 'playing' | 'done'

export function QuizEmbed({ questions, category }: Props) {
    const [phase, setPhase] = useState<Phase>('idle')
    const [current, setCurrent] = useState(0)
    const [answers, setAnswers] = useState<(number | null)[]>([])
    const [selected, setSelected] = useState<number | null>(null)
    const [revealed, setRevealed] = useState(false)

    const CATEGORY_LABEL: Record<QuizCategory, string> = {
        'k-pop':    'K-Pop',
        'k-drama':  'K-Drama',
        'cultura':  'Cultura',
        'historia': 'História',
    }
    const label = CATEGORY_LABEL[category] ?? 'Hallyu'

    const q = questions[current]
    const score = answers.filter((a, i) => a === questions[i]?.correct).length

    const handleAnswer = useCallback((idx: number) => {
        if (revealed) return
        setSelected(idx)
        setRevealed(true)
        setAnswers(prev => {
            const next = [...prev]
            next[current] = idx
            return next
        })
    }, [revealed, current])

    const handleNext = useCallback(() => {
        if (current + 1 >= questions.length) {
            setPhase('done')
        } else {
            setCurrent(c => c + 1)
            setSelected(null)
            setRevealed(false)
        }
    }, [current, questions.length])

    const reset = () => {
        setPhase('idle')
        setCurrent(0)
        setAnswers([])
        setSelected(null)
        setRevealed(false)
    }

    if (phase === 'idle') {
        return (
            <div className="my-8 border border-accent/30 bg-accent/5">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-accent/20">
                    <Trophy className="w-4 h-4 text-accent shrink-0" />
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-accent">Mini Quiz · {label}</p>
                </div>
                <div className="px-4 py-5">
                    <p className="text-[15px] font-black mb-1">Teste seus conhecimentos</p>
                    <p className="text-[12px] text-muted mb-4">{questions.length} perguntas rápidas sobre {label} — direto aqui no artigo</p>
                    <button type="button" onClick={() => setPhase('playing')}
                        className="flex items-center gap-2 bg-accent-a11y text-white px-5 py-2.5 text-[13px] font-black hover:opacity-90 active:scale-[0.99] transition-all">
                        <Trophy className="w-4 h-4" />
                        Começar o mini quiz
                    </button>
                </div>
            </div>
        )
    }

    if (phase === 'done') {
        const pct = score / questions.length
        const msg = pct === 1 ? 'Perfeito!' : pct >= 0.7 ? 'Muito bem!' : pct >= 0.5 ? 'Bom!' : 'Continue praticando'
        return (
            <div className="my-8 border border-border bg-surface">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                    <Trophy className="w-4 h-4 text-accent shrink-0" />
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted">Resultado · {label}</p>
                </div>
                <div className="px-4 py-5 text-center">
                    <p className="text-[32px] font-black tabular-nums text-accent">{score}<span className="text-[18px] text-muted font-medium">/{questions.length}</span></p>
                    <p className="text-[14px] font-black mb-4">{msg}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button type="button" onClick={reset}
                            className="flex items-center justify-center gap-2 border border-border px-4 py-2.5 text-[12px] font-black hover:border-foreground transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" />Repetir
                        </button>
                        <Link href={`/quiz?category=${category}`}
                            className="flex items-center justify-center gap-2 border border-accent/40 bg-accent/5 text-accent px-4 py-2.5 text-[12px] font-black hover:border-accent transition-colors">
                            Quiz completo <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // playing
    return (
        <div className="my-8 border border-border">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
                <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-accent shrink-0" />
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted">Mini Quiz · {label}</p>
                </div>
                <span className="font-mono text-[11px] text-muted">{current + 1}/{questions.length}</span>
            </div>

            {/* Progress */}
            <div className="h-1 bg-border">
                <div className="h-full bg-accent transition-all duration-300" style={{ width: `${((current) / questions.length) * 100}%` }} />
            </div>

            {/* Question */}
            <div className="px-4 py-5">
                <p className="text-[15px] font-black leading-snug mb-4">{q.question}</p>

                {/* Options */}
                <div className="grid gap-2 mb-4">
                    {q.options.map((opt, i) => {
                        const isCorrect = i === q.correct
                        const isSelected = i === selected
                        let cls = 'flex items-center gap-3 px-3 py-3 border text-left text-[13px] w-full transition-colors '
                        if (!revealed) {
                            cls += 'border-border hover:border-accent/60 hover:bg-accent/5 cursor-pointer'
                        } else if (isCorrect) {
                            cls += 'border-green-500 bg-green-500/10 text-green-400 cursor-default'
                        } else if (isSelected) {
                            cls += 'border-red-500 bg-red-500/10 text-red-400 cursor-default'
                        } else {
                            cls += 'border-border opacity-40 cursor-default'
                        }
                        return (
                            <button type="button" key={i} onClick={() => handleAnswer(i)} className={cls} disabled={revealed}>
                                <span className="w-5 h-5 border border-current flex items-center justify-center text-[10px] font-black shrink-0">
                                    {revealed && isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" />
                                     : revealed && isSelected ? <XCircle className="w-3.5 h-3.5" />
                                     : String.fromCharCode(65 + i)}
                                </span>
                                <span className="flex-1 text-left">{opt}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Explanation */}
                {revealed && (
                    <div className={`border-l-2 pl-3 py-1.5 mb-4 ${selected === q.correct ? 'border-green-500' : 'border-red-500'}`}>
                        <p className="text-[12px] text-foreground-subtle leading-relaxed">{q.explanation}</p>
                        {q.relatedHref && (
                            <Link href={q.relatedHref} className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-accent hover:underline">
                                Saiba mais <ArrowRight className="w-3 h-3" />
                            </Link>
                        )}
                    </div>
                )}

                {revealed && (
                    <button type="button" onClick={handleNext}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-foreground text-background font-black text-[13px] hover:opacity-90 transition-opacity">
                        {current + 1 >= questions.length ? <><Trophy className="w-4 h-4" />Ver resultado</> : <>Próxima<ChevronRight className="w-4 h-4" /></>}
                    </button>
                )}
            </div>
        </div>
    )
}
