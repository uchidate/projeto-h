'use client'
/* eslint-disable react-hooks/set-state-in-effect -- quiz transitions intentionally reset coordinated state */

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Trophy, ChevronRight, CheckCircle2, XCircle, BookOpen } from 'lucide-react'
import type { QuizQuestion, QuizDifficulty } from '@/lib/wordpress/quiz'
import { CATEGORY_META, DIFFICULTY_CONFIG } from '../lib/config'
import { QuestionText } from './QuestionText'

// ─── Quiz Screen ──────────────────────────────────────────────────────────────

export function QuizScreen({ questions, difficulty, onFinish }: {
    questions: QuizQuestion[]
    difficulty: QuizDifficulty
    onFinish: (answers: (number | null)[], points: number, timeHistory: number[], bestStreak: number) => void
}) {
    const cfg = DIFFICULTY_CONFIG[difficulty]
    const [current, setCurrent] = useState(0)
    const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null))
    const [selected, setSelected] = useState<number | null>(null)
    const [revealed, setRevealed] = useState(false)
    const [timeLeft, setTimeLeft] = useState(cfg.time)
    const [points, setPoints] = useState(0)
    const [timeHistory, setTimeHistory] = useState<number[]>([])
    const [streak, setStreak] = useState(0)
    const [bestStreak, setBestStreak] = useState(0)
    const [streakBonus, setStreakBonus] = useState(0)
    const [autoSecs, setAutoSecs] = useState<number | null>(null)
    const [answerAnim, setAnswerAnim] = useState<'correct' | 'wrong' | null>(null)

    // Refs para auto-advance sem stale closure
    const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const autoTickRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const stateRef = useRef({ answers, points, timeHistory, bestStreak })
    useEffect(() => { stateRef.current = { answers, points, timeHistory, bestStreak } }, [answers, points, timeHistory, bestStreak])

    const q = questions[current]
    const meta = q ? CATEGORY_META[q.category] : null
    const progress = ((current + (revealed ? 1 : 0)) / questions.length) * 100

    useEffect(() => {
        setTimeLeft(cfg.time)
        setSelected(null)
        setRevealed(false)
        setAnswerAnim(null)
        clearAutoAdvance()

    }, [current, cfg.time])

    useEffect(() => {
        if (revealed) return
        if (timeLeft <= 0) { handleAnswer(null, cfg.time); return }
        const t = setTimeout(() => setTimeLeft(v => v - 1), 1000)
        return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só o tique do relógio reinicia o timer; incluir handleAnswer/cfg recriaria o setTimeout a cada render e o cronômetro correria mais rápido
    }, [timeLeft, revealed])

    // Auto-advance após revelar
    useEffect(() => {
        if (!revealed) return
        let remaining = 2500
        setAutoSecs(3)
        autoTickRef.current = setInterval(() => {
            remaining -= 500
            setAutoSecs(Math.max(1, Math.ceil(remaining / 1000)))
        }, 500)
        autoRef.current = setTimeout(() => {
            clearAutoAdvance()
            const s = stateRef.current
            if (current + 1 >= questions.length) {
                onFinish(s.answers, s.points, s.timeHistory, s.bestStreak)
            } else {
                setCurrent(c => c + 1)
            }
        }, 2500)
        return clearAutoAdvance
    // eslint-disable-next-line react-hooks/exhaustive-deps -- o avanço automático começa quando a resposta é revelada; incluir as funções de navegação reiniciaria a contagem a cada render
    }, [revealed])

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.target as Element)?.tagName?.match(/^(INPUT|TEXTAREA|SELECT)$/)) return
            if (revealed) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNext() }
            } else {
                const map: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 }
                const idx = map[e.key.toLowerCase()]
                if (idx !== undefined && idx < (q?.options.length ?? 0)) handleAnswer(idx)
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- o atalho só precisa reagir à pergunta atual e ao estado revelado; handleAnswer/handleNext mudam a cada render e recriariam o listener sem necessidade
    }, [revealed, q])

    function clearAutoAdvance() {
        if (autoRef.current) clearTimeout(autoRef.current)
        if (autoTickRef.current) clearInterval(autoTickRef.current)
        setAutoSecs(null)
    }

    function handleAnswer(option: number | null, elapsed?: number) {
        if (revealed) return
        setRevealed(true)
        setSelected(option)

        const timeUsed = elapsed ?? (cfg.time - timeLeft)
        const newTimeHistory = [...timeHistory, timeUsed]
        setTimeHistory(newTimeHistory)

        const newAnswers = [...answers]
        newAnswers[current] = option
        setAnswers(newAnswers)

        if (option !== null && option === q?.correct) {
            const timeBonus = Math.round(((cfg.time - timeUsed) / cfg.time) * 0.5 * cfg.pts)
            const newStreak = streak + 1
            const bonus = newStreak >= 3 ? 25 : 0
            setStreak(newStreak)
            setBestStreak(b => Math.max(b, newStreak))
            setStreakBonus(bonus)
            setPoints(p => p + cfg.pts + timeBonus + bonus)
            setAnswerAnim('correct')
        } else {
            setStreak(0)
            setStreakBonus(0)
            setAnswerAnim('wrong')
        }
    }

    function handleNext() {
        clearAutoAdvance()
        const s = stateRef.current
        if (current + 1 >= questions.length) {
            onFinish(s.answers, s.points, s.timeHistory, s.bestStreak)
        } else {
            setCurrent(c => c + 1)
        }
    }

    if (!q) return null

    const timeColor = timeLeft <= 3 ? 'text-red-400' : timeLeft <= 6 ? 'text-amber-400' : 'text-foreground'
    const timePct = (timeLeft / cfg.time) * 100

    return (
        <div className="page-wrap py-8 max-w-2xl">
            <style>{`
                @keyframes cffall { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
                @keyframes correctPulse { 0%,100%{transform:scale(1)} 40%{transform:scale(1.015)} }
                @keyframes wrongShake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
            `}</style>

            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {meta && <meta.Icon className={`w-4 h-4 ${meta.color}`} />}
                    <span className={`text-[11px] font-black uppercase tracking-[0.12em] ${meta?.color ?? 'text-muted'}`}>{meta?.label}</span>
                    <span className="text-[11px] text-muted">· {difficulty === 'easy' ? 'Iniciante' : difficulty === 'medium' ? 'Médio' : 'Expert'}</span>
                </div>
                <div className="flex items-center gap-3">
                    {streak >= 2 && (
                        <span className="font-mono text-[12px] font-black text-orange-400 animate-pulse">🔥{streak}x</span>
                    )}
                    <span className="font-mono text-[11px] font-black text-amber-400">{points.toLocaleString()} pts</span>
                    <span className={`font-mono text-[18px] font-black tabular-nums ${timeColor}`}>{timeLeft}s</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-border mb-1 overflow-hidden">
                <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            {/* Timer bar */}
            <div className="h-0.5 bg-border mb-6 overflow-hidden">
                <div className="h-full transition-all duration-1000 linear"
                    style={{ width: `${timePct}%`, background: timeLeft <= 3 ? '#f87171' : timeLeft <= 6 ? '#fbbf24' : 'var(--color-accent)' }} />
            </div>

            {/* Question number */}
            <p className="text-[11px] font-mono text-muted mb-3">Pergunta {current + 1} de {questions.length}</p>

            {/* Question */}
            <h2 className="text-[20px] sm:text-[24px] font-black leading-tight tracking-[-0.02em] mb-6">
                <QuestionText text={q.question} />
            </h2>

            {/* Options */}
            <div className="grid gap-2 mb-4"
                style={{ animation: answerAnim === 'wrong' ? 'wrongShake 0.4s ease' : answerAnim === 'correct' ? 'correctPulse 0.4s ease' : undefined }}>
                {q.options.map((opt, i) => {
                    const isCorrect = i === q.correct
                    const isSelected = i === selected
                    let cls = 'flex items-center gap-3 px-4 py-3.5 border text-left text-[14px] font-semibold transition-all w-full relative'

                    if (!revealed) {
                        cls += ' border-border bg-background hover:border-accent hover:text-foreground cursor-pointer'
                    } else if (isCorrect) {
                        cls += ' border-green-500 bg-green-500/10 text-green-400 cursor-default'
                    } else if (isSelected) {
                        cls += ' border-red-500 bg-red-500/10 text-red-400 cursor-default'
                    } else {
                        cls += ' border-border bg-background text-muted cursor-default opacity-40'
                    }

                    const shortcut = String.fromCharCode(65 + i)
                    return (
                        <button type="button" key={i} onClick={() => handleAnswer(i)} className={cls} disabled={revealed}>
                            <span className="w-6 h-6 border border-current flex items-center justify-center text-[11px] font-black shrink-0">
                                {revealed && isCorrect ? <CheckCircle2 className="w-4 h-4" /> :
                                 revealed && isSelected ? <XCircle className="w-4 h-4" /> :
                                 shortcut}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {!revealed && (
                                <kbd className="font-mono text-[9px] text-muted/50 shrink-0 hidden sm:block">{shortcut}</kbd>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Streak bonus flash */}
            {revealed && streakBonus > 0 && streak >= 3 && (
                <div className="mb-3 px-3 py-1.5 border border-orange-400/30 bg-orange-400/8 text-[12px] font-black text-orange-400 animate-fade-in">
                    🔥 Sequência de {streak}! +{streakBonus} pts bônus
                </div>
            )}

            {/* Explanation */}
            {revealed && (
                <div className={`border-l-2 pl-4 py-2 mb-6 ${selected === q.correct ? 'border-green-500' : 'border-red-500'}`}>
                    <p className="text-[12px] font-black uppercase tracking-widest text-muted mb-1">
                        {selected === q.correct ? 'Correto!' : selected === null ? 'Tempo esgotado!' : 'Incorreto!'}
                    </p>
                    <p className="text-[14px] text-foreground-subtle leading-relaxed"><QuestionText text={q.explanation} /></p>
                    {q.relatedHref && (
                        <Link href={q.relatedHref} className="mt-2 inline-flex items-center gap-1 text-[12px] text-accent hover:underline">
                            <BookOpen className="w-3 h-3" />{q.relatedLabel ?? 'Saiba mais'}
                        </Link>
                    )}
                </div>
            )}

            {/* Next button */}
            {revealed && (
                <button type="button" onClick={handleNext}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-foreground text-background font-black text-[14px] hover:opacity-90 transition-opacity">
                    {current + 1 >= questions.length ? (
                        <><Trophy className="w-4 h-4" />Ver resultado</>
                    ) : (
                        <>Próxima{autoSecs !== null ? ` (${autoSecs}s)` : ''}<ChevronRight className="w-4 h-4" /></>
                    )}
                </button>
            )}
        </div>
    )
}
