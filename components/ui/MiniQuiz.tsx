'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, ArrowRight, Trophy, Star, Sparkles } from 'lucide-react'
import { quizCategoryTone, type QuizCategoryTone } from '@/lib/quiz/categoryMeta'

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F']

function resultadoFinal(acertos: number, total: number, entityName: string) {
    const taxa = acertos / total
    if (taxa === 1) return { Icone: Trophy, titulo: `Perfeito! Você é expert em ${entityName}`, cor: 'text-amber-400' }
    if (taxa >= 0.5) return { Icone: Star, titulo: `Nada mal! Você conhece ${entityName}`, cor: 'text-foreground' }
    return { Icone: Sparkles, titulo: `Agora você sabe mais sobre ${entityName}`, cor: 'text-foreground' }
}

interface MiniQuizItem {
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
    /** Cor da categoria das perguntas (K-Pop rosa, K-Drama azul...), em vez do acento genérico do site. */
    tone?: QuizCategoryTone
}

export function MiniQuiz({ items, entityName, quizHref, tone = quizCategoryTone() }: Props) {
    const [i, setI] = useState(0)
    const [picked, setPicked] = useState<number | null>(null)
    const [acertos, setAcertos] = useState(0)
    const [sequencia, setSequencia] = useState(0)
    const fim = i >= items.length
    const q = items[i]

    function responder(idx: number) {
        if (picked !== null || !q) return
        setPicked(idx)
        if (idx === q.correct) {
            setAcertos(a => a + 1)
            setSequencia(s => s + 1)
        } else {
            setSequencia(0)
        }
    }

    const resultado = fim ? resultadoFinal(acertos, items.length, entityName) : null

    return (
        <div className={`border-t-2 border-x border-b border-border bg-surface p-4 sm:p-5 ${tone.border}`}>
            {fim && resultado ? (
                <div className="flex flex-col items-center py-2 text-center animate-in fade-in duration-300">
                    <div className={`flex h-14 w-14 items-center justify-center border ${tone.border} ${tone.bg}`}>
                        <resultado.Icone className={`h-7 w-7 ${resultado.cor}`} />
                    </div>
                    <p className={`mt-3 text-[17px] font-black leading-tight ${resultado.cor}`}>{resultado.titulo}</p>
                    <p className="mt-1 font-mono text-[12px] font-bold uppercase tracking-widest text-muted">
                        {acertos} de {items.length} corretas
                    </p>
                    <Link href={quizHref} className={`touch-target mt-4 inline-flex items-center gap-2 border px-4 py-2 text-[13px] font-black transition-colors ${tone.border} ${tone.text} ${tone.hoverBorder}`}>
                        Mais perguntas no quiz <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            ) : (
                <div key={i} className="animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                            Pergunta {i + 1} de {items.length}
                        </p>
                        <div className="flex items-center gap-2">
                            {sequencia >= 2 && (
                                <p className="animate-pulse font-mono text-[10px] font-black uppercase tracking-[0.14em] text-amber-400">
                                    🔥 {sequencia}x
                                </p>
                            )}
                            {acertos > 0 && (
                                <p className={`font-mono text-[10px] font-black uppercase tracking-[0.14em] ${tone.text}`}>
                                    {acertos} acerto{acertos > 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="mt-1.5 h-1 w-full overflow-hidden bg-border/50">
                        <div
                            className={`h-full ${tone.solidBg} transition-all duration-300`}
                            style={{ width: `${(i / items.length) * 100}%` }}
                        />
                    </div>
                    <p className="mt-3 text-[16px] font-black leading-snug text-foreground">{q.question}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {q.options.map((op, idx) => {
                            const certa = picked !== null && idx === q.correct
                            const errada = picked === idx && idx !== q.correct
                            return (
                                <button
                                    key={idx} type="button" onClick={() => responder(idx)} disabled={picked !== null}
                                    className={`touch-target flex items-center gap-2.5 border px-3 py-2 text-left text-[14px] font-bold transition-colors ${
                                        certa ? 'border-green-500 bg-green-500/10 text-foreground'
                                        : errada ? 'border-red-500 bg-red-500/10 text-foreground'
                                        : `border-border bg-background text-foreground ${tone.hoverBorder} disabled:opacity-70`
                                    }`}
                                >
                                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center border font-mono text-[10px] font-black ${
                                        certa ? 'border-green-500 text-green-500' : errada ? 'border-red-500 text-red-500' : 'border-border text-muted'
                                    }`}>
                                        {LETRAS[idx]}
                                    </span>
                                    <span className="flex-1">{op}</span>
                                    {certa && <Check className="h-4 w-4 shrink-0 text-green-500" />}
                                    {errada && <X className="h-4 w-4 shrink-0 text-red-500" />}
                                </button>
                            )
                        })}
                    </div>
                    {picked !== null && (
                        <div className="mt-3 animate-in fade-in duration-200" aria-live="polite">
                            <p className="text-[13px] leading-relaxed text-muted">{q.explanation}</p>
                            <button type="button" onClick={() => { setI(i + 1); setPicked(null) }}
                                className={`touch-target mt-2 inline-flex items-center gap-2 text-[13px] font-black hover:underline ${tone.text}`}>
                                {i + 1 < items.length ? 'Próxima' : 'Ver resultado'} <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
