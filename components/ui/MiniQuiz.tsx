'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Check, X, ArrowRight, Trophy, Star, Sparkles, BookOpen } from 'lucide-react'
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
    relatedHref?: string
    relatedLabel?: string
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
    const containerRef = useRef<HTMLDivElement>(null)

    // Atalhos de teclado (A-F ou 1-6 pra responder, Enter/Espaço pra avançar) só
    // quando o quiz está visível na tela — evita roubar teclas de outro widget
    // da página enquanto o usuário rola o texto por perto.
    useEffect(() => {
        if (fim) return
        const el = containerRef.current
        if (!el || typeof IntersectionObserver === 'undefined') return
        let visivel = false
        const observer = new IntersectionObserver(([entry]) => { visivel = entry.isIntersecting }, { threshold: 0.5 })
        observer.observe(el)

        function handler(e: KeyboardEvent) {
            if (!visivel) return
            if ((e.target as Element)?.tagName?.match(/^(INPUT|TEXTAREA|SELECT)$/)) return
            if (picked !== null) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setI(v => v + 1); setPicked(null) }
                return
            }
            const letra: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, a: 0, b: 1, c: 2, d: 3, e: 4, f: 5 }
            const idx = letra[e.key.toLowerCase()]
            if (idx !== undefined && idx < (q?.options.length ?? 0)) responder(idx)
        }
        window.addEventListener('keydown', handler)
        return () => { window.removeEventListener('keydown', handler); observer.disconnect() }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- responder já lê picked/q por closure; só precisamos reanexar quando a pergunta ou a resposta mudam
    }, [i, picked, fim])

    return (
        <div ref={containerRef} className={`border-t-2 border-x border-b border-border bg-surface p-4 sm:p-5 ${tone.border}`}>
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
                                        certa ? `border-green-500 bg-green-500/10 text-foreground ${picked === idx ? 'animate-in zoom-in-95 duration-200' : ''}`
                                        : errada ? 'animate-in zoom-in-95 duration-200 border-red-500 bg-red-500/10 text-foreground'
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
                            {q.relatedHref && (
                                <Link href={q.relatedHref} className={`mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-bold hover:underline ${tone.text}`}>
                                    <BookOpen className="h-3.5 w-3.5" />{q.relatedLabel || 'Saiba mais'}
                                </Link>
                            )}
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
