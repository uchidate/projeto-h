'use client'
/* eslint-disable react-hooks/set-state-in-effect -- quiz transitions intentionally reset coordinated state */

import { useState, useCallback, useEffect } from 'react'
import { BarChart3 } from 'lucide-react'
import type { QuizQuestion, QuizDifficulty } from '@/lib/wordpress/quiz'
import { trackQuizStart, trackQuizComplete } from '@/lib/analytics'
import { type QuizStats, EMPTY_STATS, loadStats, saveStats, updateStats } from './lib/stats'
import { type CategoryFilter, type Screen, CATEGORY_META, DIFFICULTY_CONFIG, QUIZ_SIZE, shuffle } from './lib/config'
import { AccuracyBar } from './components/AccuracyBar'
import { StartScreen } from './components/StartScreen'
import { QuizScreen } from './components/QuizScreen'
import { ResultScreen } from './components/ResultScreen'

function _PersonalStats({ stats }: { stats: QuizStats }) {
    if (stats.totalGames === 0) return null
    const avgPct = stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0
    const best = stats.scores[0]
    const bestStreak = Math.max(...stats.scores.map(s => s.streak ?? 0), 0)
    const bestCat = Object.entries(stats.categoryStats)
        .filter(([, v]) => v.total >= 3)
        .sort((a, b) => (b[1].correct / b[1].total) - (a[1].correct / a[1].total))[0]

    return (
        <div className="border border-border bg-surface p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-4 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />Suas estatísticas
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                    <p className="text-[24px] font-black tabular-nums">{stats.totalGames}</p>
                    <p className="text-[10px] text-muted">partidas</p>
                </div>
                <div className="text-center">
                    <p className="text-[24px] font-black tabular-nums text-accent">{avgPct}%</p>
                    <p className="text-[10px] text-muted">taxa de acerto</p>
                </div>
                <div className="text-center">
                    <p className="text-[24px] font-black tabular-nums text-amber-400">{best?.points.toLocaleString() ?? '—'}</p>
                    <p className="text-[10px] text-muted">melhor pts</p>
                </div>
                <div className="text-center">
                    {bestStreak >= 2 ? (
                        <>
                            <p className="text-[24px] font-black tabular-nums text-orange-400">🔥{bestStreak}</p>
                            <p className="text-[10px] text-muted">melhor streak</p>
                        </>
                    ) : bestCat ? (
                        <>
                            <p className={`text-[13px] font-black ${CATEGORY_META[bestCat[0]]?.color ?? 'text-foreground'}`}>
                                {CATEGORY_META[bestCat[0]]?.label ?? bestCat[0]}
                            </p>
                            <p className="text-[10px] text-muted">categoria forte</p>
                        </>
                    ) : (
                        <>
                            <p className="text-[13px] font-black text-muted">—</p>
                            <p className="text-[10px] text-muted">categoria forte</p>
                        </>
                    )}
                </div>
            </div>
            <AccuracyBar correct={stats.totalCorrect} total={stats.totalQuestions} />
        </div>
    )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function QuizClient({ serverQuestions, initialCategory = 'all', initialSubcategory = '' }: {
    serverQuestions: QuizQuestion[]
    initialCategory?: CategoryFilter
    initialSubcategory?: string
}) {
    const [screen, setScreen] = useState<Screen>('start')
    const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([])
    const [difficulty, setDifficulty] = useState<QuizDifficulty>('medium')
    const [answers, setAnswers] = useState<(number | null)[]>([])
    const [points, setPoints] = useState(0)
    const [timeHistory, setTimeHistory] = useState<number[]>([])
    const [bestStreak, setBestStreak] = useState(0)
    const [stats, setStats] = useState<QuizStats>(EMPTY_STATS)

    useEffect(() => { setStats(loadStats()) }, [])

    const handleStart = useCallback((cat: CategoryFilter, diff: QuizDifficulty, excludeId?: number) => {
        // `excludeId` é a pergunta que a pessoa já respondeu na capa: repeti-la
        // como primeira do quiz valendo pontos entregaria um acerto de graça.
        let pool = serverQuestions.filter(q => q.id !== excludeId)
        if (cat !== 'all') pool = pool.filter(q => q.category === cat)
        if (initialSubcategory) pool = pool.filter(q => !q.subcategory || q.subcategory === initialSubcategory)
        pool = pool.filter(q => q.difficulty === diff)

        if (pool.length < 5) {
            const wide = serverQuestions.filter(q => q.id !== excludeId)
            pool = cat !== 'all' ? wide.filter(q => q.category === cat) : wide
        }

        const selected = shuffle(pool).slice(0, QUIZ_SIZE)
        setActiveQuestions(selected)
        setDifficulty(diff)
        trackQuizStart({ category: cat, difficulty: diff, total: selected.length })
        setScreen('quiz')
    }, [serverQuestions, initialSubcategory])

    const handleFinish = useCallback((ans: (number | null)[], pts: number, times: number[], streak: number) => {
        setAnswers(ans)
        setPoints(pts)
        setTimeHistory(times)
        setBestStreak(streak)
        setStats(prev => {
            const next = updateStats(prev, activeQuestions, ans, pts, difficulty, streak)
            saveStats(next)
            return next
        })
        const correct = ans.filter((a, i) => a === activeQuestions[i]?.correct).length
        trackQuizComplete({
            score: correct,
            total: activeQuestions.length,
            points: pts,
            category: activeQuestions[0]?.category ?? 'all',
            difficulty,
        })
        setScreen('result')
    }, [activeQuestions, difficulty])

    const handleReset = useCallback(() => {
        setScreen('start')
        setActiveQuestions([])
        setAnswers([])
        setPoints(0)
        setTimeHistory([])
        setBestStreak(0)
    }, [])

    if (screen === 'quiz') {
        return (
            <QuizScreen
                questions={activeQuestions}
                difficulty={difficulty}
                onFinish={handleFinish}
            />
        )
    }

    if (screen === 'result') {
        return (
            <ResultScreen
                questions={activeQuestions}
                answers={answers}
                points={points}
                timeHistory={timeHistory}
                maxTime={DIFFICULTY_CONFIG[difficulty].time}
                bestStreak={bestStreak}
                onReset={handleReset}
            />
        )
    }

    return (
        <StartScreen
            onStart={handleStart}
            stats={stats}
            allQuestions={serverQuestions}
            initialCategory={initialCategory}
            initialSubcategory={initialSubcategory}
        />
    )
}
