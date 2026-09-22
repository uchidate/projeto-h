'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
    Share2, Flame, Zap, BookOpen, ChevronDown, ChevronUp,
    ArrowRight, RotateCcw, Clock,
    Target, BarChart3,
} from 'lucide-react'
import { SITE_NAME } from '@/lib/constants/site'
import type { QuizQuestion } from '@/lib/wordpress/quiz'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { CATEGORY_META, CONTENT_LINKS, getResult } from '../lib/config'
import { QuestionText } from './QuestionText'
import { Confetti } from './Confetti'
import { AccuracyBar } from './AccuracyBar'
import { TimeChart } from './TimeChart'
import { ScoreTimeline } from './ScoreTimeline'

// ─── Result Screen ────────────────────────────────────────────────────────────

export function ResultScreen({ questions, answers, points, timeHistory, maxTime, bestStreak, onReset }: {
    questions: QuizQuestion[]
    answers: (number | null)[]
    points: number
    timeHistory: number[]
    maxTime: number
    bestStreak: number
    onReset: () => void
}) {
    const [showReview, setShowReview] = useState(false)

    const score  = answers.filter((a, i) => a === questions[i]?.correct).length
    const pct    = score / questions.length
    const result = getResult(pct)
    const perfect = score === questions.length

    const scoreByCategory = useMemo(() => {
        const map: Record<string, { correct: number; total: number }> = {}
        questions.forEach((q, i) => {
            if (!map[q.category]) map[q.category] = { correct: 0, total: 0 }
            map[q.category].total++
            if (answers[i] === q.correct) map[q.category].correct++
        })
        return map
    }, [questions, answers])

    const relatedContent = useMemo(() =>
        questions.filter((q, i) => answers[i] !== q.correct && q.relatedHref)
            .slice(0, 3).map(q => ({ href: q.relatedHref!, label: q.relatedLabel!, category: q.category }))
    , [questions, answers])

    const wrongAnswers = questions.filter((_, i) => answers[i] !== questions[i].correct)
    const avgTime = timeHistory.length > 0 ? (timeHistory.reduce((a, b) => a + b, 0) / timeHistory.length).toFixed(1) : '—'
    const fastAnswers = timeHistory.filter(t => t <= maxTime * 0.4).length

    const weakestCat = useMemo(() => {
        const cats = Object.entries(scoreByCategory)
            .filter(([, v]) => v.total >= 2)
            .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
        return cats[0]?.[0] ?? null
    }, [scoreByCategory])

    const strongestCat = useMemo(() => {
        const cats = Object.entries(scoreByCategory)
            .filter(([, v]) => v.total >= 2 && v.correct / v.total >= 0.6)
            .sort((a, b) => (b[1].correct / b[1].total) - (a[1].correct / a[1].total))
        const best = cats[0]?.[0] ?? null
        return best !== weakestCat ? best : (cats[1]?.[0] ?? null)
    }, [scoreByCategory, weakestCat])

    const EXPLORE_META: Record<string, { href: string; label: string }> = {
        'k-drama':  { href: '/productions', label: 'Explorar doramas' },
        'k-pop':    { href: '/groups',       label: 'Explorar grupos K-Pop' },
        'cultura':  { href: '/blog?category=cultura', label: 'Explorar cultura coreana' },
        'historia': { href: '/blog?category=cultura', label: 'Explorar história coreana' },
    }

    const exploreHref  = EXPLORE_META[weakestCat ?? '']?.href  ?? '/blog'
    const exploreLabel = EXPLORE_META[weakestCat ?? '']?.label ?? 'Explorar conteúdo'

    const strongExploreHref  = EXPLORE_META[strongestCat ?? '']?.href  ?? '/blog'
    const strongExploreLabel = EXPLORE_META[strongestCat ?? '']?.label ?? 'Explorar mais'

    const shareText = `Fiz o Quiz Hallyu na ${SITE_NAME}! Acertei ${score}/${questions.length} e fiz ${points.toLocaleString()} pts${bestStreak >= 3 ? ` 🔥${bestStreak}x sequência` : ''} — tente você também!`

    const handleShare = async () => {
        const url = typeof window !== 'undefined' ? window.location.href : ''
        if (navigator.share) {
            try { await navigator.share({ title: 'Quiz Hallyu', text: shareText, url }); return } catch { /* fallback */ }
        }
        navigator.clipboard?.writeText(`${shareText} ${url}`)
    }

    const radius = 54
    const circ   = 2 * Math.PI * radius
    const dash   = circ * pct

    return (
        <>
            {perfect && <Confetti />}
            <style>{`
                @keyframes cffall { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
                @keyframes drawin { from{stroke-dashoffset:${circ}} to{stroke-dashoffset:${circ - dash}} }
            `}</style>

            <div className="page-wrap py-8">
                <div className="border-b-2 border-foreground pb-5 mb-8 flex items-start justify-between gap-4 flex-wrap">
                    <h1 className="font-serif text-[28px] font-medium leading-[1.1] tracking-[-0.02em]">
                        {result.title} <span className="text-muted font-medium text-[18px]">{result.sub}</span>
                    </h1>
                    {bestStreak >= 3 && (
                        <div className="flex items-center gap-2 border border-orange-400/30 bg-orange-400/8 px-3 py-2">
                            <span className="text-[18px]">🔥</span>
                            <div>
                                <p className="text-[13px] font-black text-orange-400">Sequência de {bestStreak}!</p>
                                <p className="text-[10px] text-muted">melhor streak</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Score + categorias */}
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="border border-border bg-surface p-6 flex flex-col items-center justify-center text-center">
                        <div className="relative inline-flex items-center justify-center mb-4">
                            <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
                                <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="10" stroke="var(--color-border)" />
                                <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="10"
                                    stroke={result.color} strokeLinecap="round"
                                    strokeDasharray={circ} strokeDashoffset={circ - dash}
                                    style={{ animation: 'drawin 1s ease 0.3s both' }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black tabular-nums">{score}</span>
                                <span className="text-sm text-muted font-semibold">de {questions.length}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 border border-amber-400/20 bg-amber-400/8 px-5 py-2 mb-3">
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span className="text-base font-black text-amber-400">{points.toLocaleString()} pts</span>
                        </div>
                        <div className="w-full mt-2">
                            <AccuracyBar correct={score} total={questions.length} />
                        </div>
                    </div>

                    <div className="border border-border bg-surface p-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-4 flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5" />Por categoria
                        </p>
                        <div className="space-y-4">
                            {Object.entries(scoreByCategory).map(([cat, { correct, total }]) => {
                                const meta = CATEGORY_META[cat]
                                if (!meta) return null
                                const pctCat = correct / total
                                return (
                                    <div key={cat}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <meta.Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                                                <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
                                            </div>
                                            <span className="text-xs font-bold tabular-nums">{correct}/{total}</span>
                                        </div>
                                        <div className="h-1.5 bg-border">
                                            <div className="h-full transition-all duration-700" style={{ width: `${pctCat * 100}%`, background: result.color }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        {relatedContent.length > 0 && (
                            <div className="mt-5 pt-4 border-t border-border">
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-3 flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5" />Saiba mais sobre o que você errou
                                </p>
                                <div className="space-y-2">
                                    {relatedContent.map((item, i) => {
                                        const meta = CATEGORY_META[item.category ?? '']
                                        return (
                                            <Link key={i} href={item.href}
                                                className="flex items-center gap-3 border border-border bg-background hover:border-accent/50 hover:bg-accent/5 transition-colors p-2.5 group">
                                                {meta && (
                                                    <div className="w-8 h-8 shrink-0 flex items-center justify-center border border-border bg-surface">
                                                        <meta.Icon className={`w-4 h-4 ${meta.color}`} />
                                                    </div>
                                                )}
                                                <span className="text-[12px] font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug flex-1">
                                                    {item.label}
                                                </span>
                                                <ArrowRight className="w-3.5 h-3.5 shrink-0 text-muted group-hover:text-accent transition-colors" />
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Timeline + tempo */}
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="border border-border bg-surface p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-3">Mapa de respostas</p>
                        <ScoreTimeline answers={answers} questions={questions} />
                        <p className="text-[10px] text-muted mt-2">cada bloco = 1 pergunta · ícone = categoria</p>
                    </div>
                    <div className="border border-border bg-surface p-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />Tempo por pergunta
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-muted">
                                <span>média <span className="font-black text-foreground">{avgTime}s</span></span>
                                <span>rápidas <span className="font-black text-green-400">{fastAnswers}</span></span>
                            </div>
                        </div>
                        <TimeChart times={timeHistory} maxTime={maxTime} />
                        <div className="flex items-center gap-3 mt-2 text-[9px] text-muted">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 inline-block" />rápido (≤40%)</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 inline-block" />médio</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 inline-block" />lento</span>
                        </div>
                    </div>
                </div>

                {/* Revisar erros */}
                {wrongAnswers.length > 0 && (
                    <div className="border border-border mb-4 overflow-hidden">
                        <button type="button" onClick={() => setShowReview(v => !v)}
                            className="w-full flex items-center justify-between px-4 py-3.5 bg-surface hover:bg-surface/80 transition-colors text-left">
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-red-400" />
                                <span className="text-[13px] font-black">Revisar erros</span>
                                <span className="font-mono text-[11px] text-red-400">{wrongAnswers.length} erradas</span>
                            </div>
                            {showReview ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                        </button>
                        {showReview && (
                            <div className="divide-y divide-border">
                                {questions.map((q, i) => {
                                    if (answers[i] === q.correct) return null
                                    const meta = CATEGORY_META[q.category]
                                    return (
                                        <div key={q.id} className="px-4 py-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                {meta && <meta.Icon className={`w-3 h-3 ${meta.color}`} />}
                                                <span className="text-[10px] font-mono text-muted">Q{i+1}</span>
                                            </div>
                                            <p className="text-[14px] font-semibold mb-3"><QuestionText text={q.question} /></p>
                                            <div className="grid gap-1.5 mb-3">
                                                {q.options.map((opt, j) => (
                                                    <div key={j} className={`px-3 py-2 text-[13px] border ${j === q.correct ? 'border-green-500/50 bg-green-500/10 text-green-400' : j === answers[i] ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-border text-muted opacity-50'}`}>
                                                        <span className="font-black mr-2">{String.fromCharCode(65 + j)}.</span>{opt}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[12px] text-foreground-subtle border-l-2 border-green-500 pl-3"><QuestionText text={q.explanation} /></p>
                                            {q.relatedHref && (
                                                <Link href={q.relatedHref} className="mt-2 inline-flex items-center gap-1 text-[12px] text-accent hover:underline">
                                                    <BookOpen className="w-3 h-3" />{q.relatedLabel ?? 'Saiba mais'}
                                                </Link>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {ADSENSE.slots.inline && (
                    <div className="mb-8">
                        <AdSlotInline slot={ADSENSE.slots.inline} layout="content" analyticsPlacement="quiz_result" />
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap mb-10">
                    <button type="button" onClick={onReset}
                        className="flex items-center justify-center gap-2 border border-border px-5 py-3.5 sm:py-3 text-[13px] font-black hover:border-foreground transition-colors">
                        <RotateCcw className="w-4 h-4" />Jogar novamente
                    </button>
                    <button type="button" onClick={handleShare}
                        className="flex items-center justify-center gap-2 border border-border px-5 py-3.5 sm:py-3 text-[13px] font-black hover:border-foreground transition-colors">
                        <Share2 className="w-4 h-4" />Compartilhar resultado
                    </button>
                    <Link href={exploreHref}
                        className="flex items-center justify-center gap-2 border border-accent/40 bg-accent/5 px-5 py-3.5 sm:py-3 text-[13px] font-black hover:border-accent transition-colors text-accent">
                        <Flame className="w-4 h-4" />{exploreLabel}
                    </Link>
                </div>

                {/* Categoria mais forte */}
                {strongestCat && (
                    <div className="border-t border-border pt-8 mb-6">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted">
                                Você manda em{' '}
                                <span className={CATEGORY_META[strongestCat]?.color}>{CATEGORY_META[strongestCat]?.label}</span>
                            </p>
                            <span className="font-mono text-[10px] text-green-400 font-black">
                                {scoreByCategory[strongestCat]?.correct}/{scoreByCategory[strongestCat]?.total} certas
                            </span>
                        </div>
                        <p className="text-[12px] text-muted mb-4">Vai fundo — tem muito mais conteúdo esperando por você.</p>
                        <Link href={strongExploreHref}
                            className="flex items-center gap-3 border border-green-500/30 bg-green-500/5 px-4 py-3 hover:border-green-500/60 transition-colors group">
                            {(() => { const meta = CATEGORY_META[strongestCat]; return meta ? <meta.Icon className={`w-4 h-4 ${meta.color} shrink-0`} /> : null })()}
                            <span className="text-[13px] font-black text-foreground group-hover:text-green-400 transition-colors flex-1">{strongExploreLabel}</span>
                            <ArrowRight className="w-4 h-4 text-muted group-hover:text-green-400 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                    </div>
                )}

                {/* Correlação com conteúdo — baseada na categoria mais fraca */}
                {weakestCat && (
                    <div className="border-t border-border pt-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-1">
                            Estude mais sobre{' '}
                            <span className={CATEGORY_META[weakestCat]?.color}>{CATEGORY_META[weakestCat]?.label}</span>
                        </p>
                        <p className="text-[12px] text-muted mb-4">Você teve mais dificuldade nesta categoria — explore o conteúdo do site para melhorar.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {(CONTENT_LINKS[weakestCat] ?? CONTENT_LINKS['all']).map(({ href, label, Icon }) => (
                                <Link key={href} href={href}
                                    className="flex items-center sm:flex-col gap-3 sm:gap-2 border border-border bg-surface px-4 py-3 sm:p-4 sm:text-center hover:border-accent/50 hover:bg-accent/5 transition-colors group">
                                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted group-hover:text-accent transition-colors shrink-0" />
                                    <span className="text-[12px] font-bold text-foreground group-hover:text-accent transition-colors">{label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
