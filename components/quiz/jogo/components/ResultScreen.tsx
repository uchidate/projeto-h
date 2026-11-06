'use client'

import { useMemo, useState } from 'react'
import Link from '@/components/i18n/LocalizedLink'
import { useLocale, useTranslations } from 'next-intl'
import {
    Share2, Flame, Zap, BookOpen, ChevronDown, ChevronUp,
    ArrowRight, RotateCcw, Clock,
    Target, BarChart3,
} from 'lucide-react'
import { SITE_NAME } from '@/lib/constants/site'
import type { Locale } from '@/lib/i18n/config'
import { href as rotaHref } from '@/lib/i18n/routes'
import type { QuizQuestion } from '@/lib/wordpress/quiz'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { CATEGORY_META, CONTENT_LINKS, getResult, hrefDoLink, ehTema } from '../lib/config'
import { AvisoConsentimento } from '@/components/consent/AvisoConsentimento'
import { generateShareCard } from './ShareCard'
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
    const t = useTranslations('client.quiz')
    const locale = useLocale() as Locale
    const [showReview, setShowReview] = useState(false)
    const nomeCat = (c: string | undefined) => (ehTema(c) ? t(`categorias.${c}`) : (c ?? ''))

    const score  = answers.filter((a, i) => a === questions[i]?.correct).length
    const pct    = score / questions.length
    const faixa = getResult(pct)
    const result = { color: faixa.color, title: t(`resultado.${faixa.chave}.titulo`), sub: t(`resultado.${faixa.chave}.sub`) }
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

    const EXPLORE_HREF: Record<string, string> = {
        'k-drama':  rotaHref('productions', undefined, locale),
        'k-pop':    rotaHref('groups', undefined, locale),
        'cultura':  `${rotaHref('blog', undefined, locale)}?category=cultura`,
        'historia': `${rotaHref('blog', undefined, locale)}?category=cultura`,
    }
    const blogHref = rotaHref('blog', undefined, locale)
    const rotuloExplorar = (c: string | null) => (ehTema(c) ? t(`explorar.${c}`) : t('explorar.padrao'))

    const exploreHref  = EXPLORE_HREF[weakestCat ?? ''] ?? blogHref
    const exploreLabel = rotuloExplorar(weakestCat)

    const strongExploreHref  = EXPLORE_HREF[strongestCat ?? ''] ?? blogHref
    const strongExploreLabel = ehTema(strongestCat) ? t(`explorar.${strongestCat}`) : t('explorar.mais')

    const pontos = points.toLocaleString(locale)
    const shareText = t('res.compartilharTexto', {
        site: SITE_NAME, score, total: questions.length, pts: pontos,
        streak: bestStreak >= 3 ? t('res.compartilharSeq', { n: bestStreak }) : '',
    })

    const handleShare = async () => {
        const url = typeof window !== 'undefined' ? window.location.href : ''
        const blob = await generateShareCard({
            title: result.title, score, total: questions.length, points, streak: bestStreak, accent: result.color,
            labels: {
                header: 'HALLYUHUB · QUIZ',
                myResult: t('cartao.meuResultado'),
                scoreLine: t('cartao.deTotal', { score, total: questions.length, pts: pontos }),
                streakLine: t('cartao.sequencia', { n: bestStreak }),
                cta: t('cartao.faca', { host: `${SITE_NAME.toLowerCase()}.com.br${rotaHref('quiz', undefined, locale)}` }),
            },
        }).catch(() => null)
        const file = blob ? new File([blob], 'quiz-hallyuhub.png', { type: 'image/png' }) : null

        if (file && navigator.canShare?.({ files: [file] })) {
            try { await navigator.share({ title: t('res.compartilharTitulo'), text: shareText, url, files: [file] }); return } catch { /* fallback */ }
        }
        if (navigator.share) {
            try { await navigator.share({ title: t('res.compartilharTitulo'), text: shareText, url }); return } catch { /* fallback */ }
        }
        if (file) {
            const a = document.createElement('a')
            a.href = URL.createObjectURL(file)
            a.download = file.name
            a.click()
            URL.revokeObjectURL(a.href)
        }
        navigator.clipboard?.writeText(`${shareText} ${url}`)
    }

    const SOMBRA = 'shadow-[5px_5px_0_#15102b] dark:shadow-[5px_5px_0_#000]'
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

            <div className="bg-[#f3efff] text-[#15102b] [--color-bg:#f3efff] [--color-border:#b9aee6] [--color-foreground:#15102b] [--color-muted:#5a4d99] [--color-surface:#ffffff] dark:bg-[#15102b] dark:text-white dark:[--color-bg:#15102b] dark:[--color-border:#3a2f6b] dark:[--color-foreground:#ffffff] dark:[--color-muted:#c9c2ee] dark:[--color-surface:#1f1840]">
            <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
                <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <span className="inline-block -rotate-2 bg-[#ffe14d] px-3 py-1 text-[12px] font-black tracking-[0.08em] text-[#15102b]">{result.sub.toUpperCase()}</span>
                        <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-[40px] font-extrabold leading-none sm:text-[56px]">
                            {perfect ? '🏆 ' : pct >= 0.6 ? '🎉 ' : '💪 '}{result.title}
                        </h1>
                    </div>
                    {bestStreak >= 3 && (
                        <div className={`flex items-center gap-2 bg-[#ffe14d] px-3 py-2 text-[#15102b] ${SOMBRA}`}>
                            <span className="text-[18px]">🔥</span>
                            <div>
                                <p className="text-[14px] font-black">{t('res.sequenciaDe', { n: bestStreak })}</p>
                                <p className="text-[11px] font-bold">{t('res.melhorSequencia')}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Score + categorias */}
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className={`flex flex-col items-center justify-center border-[3px] border-[#15102b] bg-surface p-6 text-center dark:border-white/30 ${SOMBRA}`}>
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
                                <span className="text-sm text-muted font-semibold">{t('res.deTotal', { total: questions.length })}</span>
                            </div>
                        </div>
                        <div className="mb-3 flex items-center gap-2 bg-[#ffe14d] px-5 py-2 text-[#15102b]">
                            <Zap className="h-4 w-4" />
                            <span className="text-base font-black">{t('hist.pts', { n: pontos })}</span>
                        </div>
                        <div className="w-full mt-2">
                            <AccuracyBar correct={score} total={questions.length} />
                        </div>
                    </div>

                    <div className={`border-[3px] border-[#15102b] bg-surface p-6 dark:border-white/30 ${SOMBRA}`}>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-4 flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5" />{t('res.porCategoria')}
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
                                                <span className={`text-xs font-bold ${meta.color}`}>{nomeCat(cat)}</span>
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
                                    <BookOpen className="w-3.5 h-3.5" />{t('res.saibaErrou')}
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
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-3">{t('res.mapa')}</p>
                        <ScoreTimeline answers={answers} questions={questions} />
                        <p className="text-[10px] text-muted mt-2">{t('res.mapaLegenda')}</p>
                    </div>
                    <div className="border border-border bg-surface p-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />{t('res.tempoPorPergunta')}
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-muted">
                                <span>{t('res.media')} <span className="font-black text-foreground">{avgTime}s</span></span>
                                <span>{t('res.rapidas')} <span className="font-black text-green-400">{fastAnswers}</span></span>
                            </div>
                        </div>
                        <TimeChart times={timeHistory} maxTime={maxTime} />
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 inline-block" />{t('res.rapido')}</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 inline-block" />{t('res.medio')}</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 inline-block" />{t('res.lento')}</span>
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
                                <span className="text-[13px] font-black">{t('res.revisar')}</span>
                                <span className="font-mono text-[11px] text-red-400">{t('res.erradas', { n: wrongAnswers.length })}</span>
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
                                                    <BookOpen className="w-3 h-3" />{q.relatedLabel ?? t('partida.saibaMais')}
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
                        className="flex items-center justify-center gap-2 bg-[#ff5fa2] px-6 py-3.5 text-[15px] font-black text-[#15102b] transition-transform hover:-translate-y-0.5 ${SOMBRA}">
                        <RotateCcw className="w-4 h-4" />{t('res.novamente')}
                    </button>
                    <button type="button" onClick={handleShare}
                        className="flex items-center justify-center gap-2 bg-[#38e1c0] px-6 py-3.5 text-[15px] font-black text-[#15102b] transition-transform hover:-translate-y-0.5 shadow-[5px_5px_0_#15102b] dark:shadow-[5px_5px_0_#000]">
                        <Share2 className="w-4 h-4" />{t('res.compartilhar')}
                    </button>
                    <Link href={exploreHref}
                        className="flex items-center justify-center gap-2 bg-[#ffe14d] px-6 py-3.5 text-[15px] font-black text-[#15102b] transition-transform hover:-translate-y-0.5 shadow-[5px_5px_0_#15102b] dark:shadow-[5px_5px_0_#000]">
                        <Flame className="w-4 h-4" />{exploreLabel}
                    </Link>
                </div>
                <AvisoConsentimento recurso="placar" className="mb-10" />

                {/* Categoria mais forte */}
                {strongestCat && (
                    <div className="border-t border-border pt-8 mb-6">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted">
                                {t('res.mandaEm')}{' '}
                                <span className={CATEGORY_META[strongestCat]?.color}>{nomeCat(strongestCat)}</span>
                            </p>
                            <span className="font-mono text-[10px] text-green-400 font-black">
                                {t('res.certas', { c: scoreByCategory[strongestCat]?.correct ?? 0, t: scoreByCategory[strongestCat]?.total ?? 0 })}
                            </span>
                        </div>
                        <p className="text-[12px] text-muted mb-4">{t('res.vaiFundo')}</p>
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
                            {t('res.estude')}{' '}
                            <span className={CATEGORY_META[weakestCat]?.color}>{nomeCat(weakestCat)}</span>
                        </p>
                        <p className="text-[12px] text-muted mb-4">{t('res.dificuldade')}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {(CONTENT_LINKS[weakestCat] ?? CONTENT_LINKS['all']).map(({ chave, Icon }) => (
                                <Link key={chave} href={hrefDoLink(chave, locale)}
                                    className="flex items-center sm:flex-col gap-3 sm:gap-2 border border-border bg-surface px-4 py-3 sm:p-4 sm:text-center hover:border-accent/50 hover:bg-accent/5 transition-colors group">
                                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted group-hover:text-accent transition-colors shrink-0" />
                                    <span className="text-[12px] font-bold text-foreground group-hover:text-accent transition-colors">{t(`links.${chave}`)}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            </div>
        </>
    )
}
