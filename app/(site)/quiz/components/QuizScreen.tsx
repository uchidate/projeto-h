'use client'
/* eslint-disable react-hooks/set-state-in-effect -- quiz transitions intentionally reset coordinated state */

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Trophy, ChevronRight, CheckCircle2, XCircle, BookOpen } from 'lucide-react'
import type { QuizQuestion, QuizDifficulty } from '@/lib/wordpress/quiz'
import { CATEGORY_META, DIFFICULTY_CONFIG, TEMA_VISUAL } from '../lib/config'
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

    const timePct = (timeLeft / cfg.time) * 100
    const tema = TEMA_VISUAL[q.category] ?? TEMA_VISUAL['k-pop']
    const CHIPS = ['#ff5fa2', '#38e1c0', '#7aa2ff', '#c39bff']
    const SOMBRA = 'shadow-[5px_5px_0_#15102b] dark:shadow-[5px_5px_0_#000]'

    return (
        <div className="bg-[#f3efff] text-[#15102b] dark:bg-[#15102b] dark:text-white">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
            <style>{`
                @keyframes cffall { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
                @keyframes correctPulse { 0%,100%{transform:scale(1)} 40%{transform:scale(1.015)} }
                @keyframes wrongShake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
            `}</style>

            {/* Cabeçalho: tema, ritmo, sequência, pontos e tempo como etiquetas */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-[12px] font-black uppercase tracking-[0.1em] text-[#15102b]" style={{ background: tema.cor }}>{tema.emoji} {meta?.label}</span>
                    <span className="text-[12px] font-bold opacity-70">{difficulty === 'easy' ? 'Iniciante' : difficulty === 'medium' ? 'Intermediário' : 'Expert'}</span>
                </div>
                <div className="flex items-center gap-2">
                    {streak >= 2 && <span className="animate-pulse bg-[#ffe14d] px-2 py-1 text-[13px] font-black text-[#15102b]">🔥 {streak}x</span>}
                    <span className="bg-[#15102b] px-2 py-1 text-[13px] font-black tabular-nums text-[#ffe14d] dark:bg-[#ffe14d] dark:text-[#15102b]">{points.toLocaleString()} pts</span>
                    <span className={`px-2 py-1 text-[15px] font-black tabular-nums text-[#15102b] ${timeLeft <= 3 ? 'bg-[#ff5fa2]' : timeLeft <= 6 ? 'bg-[#ffe14d]' : 'bg-[#38e1c0]'}`}>{timeLeft}s</span>
                </div>
            </div>

            {/* Progresso da partida e relógio da pergunta */}
            <div className="mb-1 h-3 overflow-hidden border-2 border-[#15102b] bg-white dark:border-white/30 dark:bg-[#1f1840]">
                <div className="h-full bg-[#ff5fa2] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="mb-6 h-1.5 overflow-hidden bg-[#15102b]/15 dark:bg-white/15">
                <div className="linear h-full transition-all duration-1000" style={{ width: `${timePct}%`, background: timeLeft <= 3 ? '#ff5fa2' : timeLeft <= 6 ? '#ffe14d' : '#38e1c0' }} />
            </div>

            <p className="mb-3 text-[12px] font-black uppercase tracking-[0.12em] opacity-70">Pergunta {current + 1} de {questions.length}</p>

            <h2 className="mb-6 font-[family-name:var(--font-playfair)] text-[26px] font-extrabold leading-[1.12] sm:text-[34px]">
                <QuestionText text={q.question} />
            </h2>

            <div className="mb-5 grid gap-3"
                style={{ animation: answerAnim === 'wrong' ? 'wrongShake 0.4s ease' : answerAnim === 'correct' ? 'correctPulse 0.4s ease' : undefined }}>
                {q.options.map((opt, i) => {
                    const isCorrect = i === q.correct
                    const isSelected = i === selected
                    let cls = `relative flex min-h-[58px] w-full items-center gap-3 border-[3px] border-[#15102b] px-4 py-3 text-left text-[16px] font-extrabold text-[#15102b] transition-transform sm:text-[18px] ${SOMBRA} `
                    if (!revealed) cls += 'cursor-pointer bg-white hover:-translate-y-0.5'
                    else if (isCorrect) cls += 'cursor-default bg-[#38e1c0]'
                    else if (isSelected) cls += 'cursor-default bg-[#ff5fa2]'
                    else cls += 'cursor-default bg-white opacity-40'

                    const shortcut = String.fromCharCode(65 + i)
                    return (
                        <button type="button" key={i} onClick={() => handleAnswer(i)} className={cls} disabled={revealed}>
                            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center text-[14px] font-black" style={{ background: CHIPS[i] }}>
                                {revealed && isCorrect ? <CheckCircle2 className="h-4 w-4" /> : revealed && isSelected ? <XCircle className="h-4 w-4" /> : shortcut}
                            </span>
                            <span className="flex-1">{opt}</span>
                        </button>
                    )
                })}
            </div>

            {revealed && streakBonus > 0 && streak >= 3 && (
                <div className="mb-4 bg-[#ffe14d] px-3 py-2 text-[13px] font-black text-[#15102b]">🔥 Sequência de {streak}! +{streakBonus} pts de bônus</div>
            )}

            {revealed && (
                <div className={`mb-6 bg-[#ffe14d] p-4 text-[#15102b] ${SOMBRA}`}>
                    <p className="mb-1 text-[13px] font-black uppercase tracking-[0.1em]">
                        {selected === q.correct ? '🎉 Acertou!' : selected === null ? '⏰ Tempo esgotado!' : '😅 Quase!'}
                    </p>
                    <p className="text-[15px] font-medium leading-relaxed"><QuestionText text={q.explanation} /></p>
                    {q.relatedHref && (
                        <Link href={q.relatedHref} className="mt-2 inline-flex items-center gap-1 text-[13px] font-black underline">
                            <BookOpen className="h-3.5 w-3.5" />{q.relatedLabel ?? 'Saiba mais'}
                        </Link>
                    )}
                </div>
            )}

            {revealed && (
                <button type="button" onClick={handleNext}
                    className={`flex h-14 w-full items-center justify-center gap-2 bg-[#ff5fa2] text-[16px] font-black text-[#15102b] transition-transform hover:-translate-y-0.5 ${SOMBRA}`}>
                    {current + 1 >= questions.length ? (
                        <><Trophy className="h-5 w-5" />Ver resultado</>
                    ) : (
                        <>Próxima{autoSecs !== null ? ` (${autoSecs}s)` : ''}<ChevronRight className="h-5 w-5" /></>
                    )}
                </button>
            )}
        </div>
        </div>
    )
}
