'use client'
import { SITE_NAME } from '@/lib/constants/site'
import { intlLocale } from '@/lib/i18n/format'
/* eslint-disable react-hooks/set-state-in-effect -- quiz transitions intentionally reset coordinated state */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
    Trophy, ChevronRight, CheckCircle2, XCircle,
    Share2, Flame, Zap, BookOpen, ChevronDown, ChevronUp, Medal,
    ArrowRight, RotateCcw, Music, Tv, Globe, Clock, Layers,
    Target, Play, BarChart3, Keyboard,
    Users, Film, Mic2,
} from 'lucide-react'
import type { QuizQuestion, QuizCategory, QuizDifficulty } from '@/lib/wordpress/quiz'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { trackQuizStart, trackQuizComplete } from '@/lib/analytics'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizStats {
    totalGames: number
    totalCorrect: number
    totalQuestions: number
    categoryStats: Record<string, { correct: number; total: number }>
    scores: Array<{ points: number; score: number; total: number; date: string; difficulty: QuizDifficulty; streak: number }>
}

const EMPTY_STATS: QuizStats = { totalGames: 0, totalCorrect: 0, totalQuestions: 0, categoryStats: {}, scores: [] }

function loadStats(): QuizStats {
    try {
        const s = localStorage.getItem('oc_quiz_stats')
        return s ? JSON.parse(s) : EMPTY_STATS
    } catch { return EMPTY_STATS }
}

function saveStats(stats: QuizStats) {
    try { localStorage.setItem('oc_quiz_stats', JSON.stringify(stats)) } catch { /* ignore */ }
}

function updateStats(
    stats: QuizStats,
    questions: QuizQuestion[],
    answers: (number | null)[],
    points: number,
    difficulty: QuizDifficulty,
    bestStreak: number,
): QuizStats {
    const correct = answers.filter((a, i) => a === questions[i]?.correct).length
    const categoryStats = { ...stats.categoryStats }
    questions.forEach((q, i) => {
        if (!categoryStats[q.category]) categoryStats[q.category] = { correct: 0, total: 0 }
        categoryStats[q.category].total++
        if (answers[i] === q.correct) categoryStats[q.category].correct++
    })
    const newScore = { points, score: correct, total: questions.length, date: new Date().toISOString(), difficulty, streak: bestStreak }
    return {
        totalGames: stats.totalGames + 1,
        totalCorrect: stats.totalCorrect + correct,
        totalQuestions: stats.totalQuestions + questions.length,
        categoryStats,
        scores: [newScore, ...stats.scores].slice(0, 10),
    }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; Icon: React.FC<{ className?: string }> }> = {
    'k-pop':    { label: 'K-Pop',    color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/20',   Icon: Music },
    'k-drama':  { label: 'K-Drama',  color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',   Icon: Tv },
    'cultura':  { label: 'Cultura',  color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', Icon: Globe },
    'historia': { label: 'História', color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20', Icon: Clock },
}

const DIFFICULTY_CONFIG: Record<QuizDifficulty, { label: string; time: number; pts: number; color: string }> = {
    easy:   { label: 'Iniciante',     time: 20, pts: 80,  color: 'text-emerald-400' },
    medium: { label: 'Intermediário', time: 15, pts: 100, color: 'text-amber-400'   },
    hard:   { label: 'Expert',        time: 10, pts: 150, color: 'text-red-400'     },
}

// Links para correlacionar o quiz com o conteúdo do site
const CONTENT_LINKS: Record<string, Array<{ href: string; label: string; Icon: React.FC<{ className?: string }> }>> = {
    'k-pop': [
        { href: '/groups/boy-groups',  label: 'Boy groups',   Icon: Users },
        { href: '/groups/girl-groups', label: 'Girl groups',  Icon: Users },
        { href: '/artists',            label: 'Artistas solo', Icon: Mic2 },
    ],
    'k-drama': [
        { href: '/productions',              label: 'Catálogo de doramas', Icon: Film },
        { href: '/guias/doramas-romanticos', label: 'Doramas românticos',  Icon: Film },
        { href: '/guias/melhores-doramas',   label: 'Melhores doramas',    Icon: Film },
    ],
    'cultura': [
        { href: '/blog?category=cultura', label: 'Artigos de cultura', Icon: Globe },
        { href: '/blog',                  label: 'Blog',               Icon: BookOpen },
        { href: '/artists',               label: 'Artistas coreanos',  Icon: Mic2 },
    ],
    'historia': [
        { href: '/blog',                   label: 'Blog',              Icon: BookOpen },
        { href: '/productions',            label: 'Doramas históricos', Icon: Film },
        { href: '/guias/doramas-historicos', label: 'Guia histórico',  Icon: Film },
    ],
    'all': [
        { href: '/productions', label: 'Catálogo de doramas', Icon: Film },
        { href: '/groups',      label: 'Grupos K-Pop',        Icon: Users },
        { href: '/artists',     label: 'Artistas',            Icon: Mic2 },
    ],
}

type CategoryFilter = 'all' | QuizCategory
type Screen = 'start' | 'quiz' | 'result'
const QUIZ_SIZE = 15

function getResult(pct: number) {
    if (pct === 1)   return { title: 'Perfeito!',         sub: 'Expert Hallyu',       color: '#f59e0b' }
    if (pct >= 0.8)  return { title: 'Excelente!',        sub: 'Fã dedicado',         color: 'var(--color-accent,#ff246e)' }
    if (pct >= 0.6)  return { title: 'Muito bom!',        sub: 'Bom conhecimento',    color: '#60a5fa' }
    if (pct >= 0.4)  return { title: 'Quase lá!',         sub: 'Continue explorando', color: '#a78bfa' }
    return             { title: 'Continue tentando!', sub: 'Iniciante',          color: '#6b7280' }
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

function QuestionText({ text }: { text: string }) {
    // WP REST may return escaped quotes as \" — normalize first, then highlight "quoted" spans
    const normalized = text.replace(/\\"/g, '"')
    const parts = normalized.split(/("[^"]*")/)
    return (
        <>
            {parts.map((part, i) =>
                /^"[^"]*"$/.test(part)
                    ? <em key={i} className="not-italic text-accent">{part.slice(1, -1)}</em>
                    : <span key={i}>{part}</span>
            )}
        </>
    )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Confetti() {
    const colors = ['#ec4899','#a855f7','#f59e0b','#60a5fa','#34d399','#f472b6']
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-50" aria-hidden>
            {Array.from({ length: 50 }).map((_, i) => (
                <div key={i} style={{
                    position: 'absolute', left: `${(i * 2.1) % 100}%`, top: '-12px',
                    width: i % 3 === 0 ? '9px' : '6px', height: i % 3 === 0 ? '9px' : '14px',
                    borderRadius: i % 4 === 0 ? '50%' : '2px', background: colors[i % colors.length],
                    opacity: 0, animation: `cffall ${1.8 + (i % 5) * 0.3}s ease-in forwards`,
                    animationDelay: `${(i % 6) * 0.1}s`, transform: `rotate(${i * 37}deg)`,
                }} />
            ))}
        </div>
    )
}

function AccuracyBar({ correct, total }: { correct: number; total: number }) {
    if (total === 0) return null
    const pct = (correct / total) * 100
    const color = pct >= 70 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171'
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-border overflow-hidden">
                <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="font-mono text-[11px] font-black shrink-0" style={{ color }}>{Math.round(pct)}%</span>
        </div>
    )
}

function TimeChart({ times, maxTime }: { times: number[]; maxTime: number }) {
    if (times.length === 0) return null
    return (
        <div className="flex items-end gap-0.5 h-10">
            {times.map((t, i) => {
                const pct = maxTime > 0 ? (t / maxTime) * 100 : 0
                const fast = t <= maxTime * 0.4
                return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`Q${i+1}: ${t}s`}>
                        <div className="w-full min-h-[2px] transition-all"
                            style={{ height: `${Math.max(4, pct)}%`, background: fast ? '#4ade80' : t <= maxTime * 0.7 ? '#fbbf24' : '#f87171' }} />
                    </div>
                )
            })}
        </div>
    )
}

function ScoreTimeline({ answers, questions }: { answers: (number | null)[]; questions: QuizQuestion[] }) {
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

function ScoreHistory({ scores }: { scores: QuizStats['scores'] }) {
    if (scores.length === 0) return null
    return (
        <div className="border border-border bg-surface p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-4 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />Últimas partidas
            </p>
            <div className="space-y-1.5">
                {scores.slice(0, 5).map((s, i) => {
                    const pct = Math.round((s.score / s.total) * 100)
                    const cfg = DIFFICULTY_CONFIG[s.difficulty]
                    return (
                        <div key={i} className={`flex items-center gap-3 px-3 py-2 border ${i === 0 ? 'border-amber-400/30 bg-amber-400/5' : 'border-border'}`}>
                            <span className={`text-[13px] font-black w-5 tabular-nums shrink-0 ${i === 0 ? 'text-amber-400' : 'text-muted'}`}>{i + 1}</span>
                            {i === 0 && <Medal className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            <span className="font-mono text-[11px] font-black text-amber-400 tabular-nums flex-1">{s.points.toLocaleString()} pts</span>
                            <span className="text-[11px] text-muted tabular-nums">{s.score}/{s.total} · {pct}%</span>
                            {(s.streak ?? 0) >= 3 && <span className="text-[10px]">🔥{s.streak}</span>}
                            <span className={`font-mono text-[9px] font-black ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-[10px] text-muted hidden sm:inline">
                                {new Date(s.date).toLocaleDateString(intlLocale(), { day: '2-digit', month: 'short' })}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Teaser ───────────────────────────────────────────────────────────────────

/**
 * Pergunta jogável na própria capa. A técnica é pré-compromisso: a página não
 * pede que a pessoa decida jogar, ela já a coloca jogando. Quem responde uma
 * pergunta e recebe a explicação na hora chega ao botão "continuar" já dentro
 * da atividade, não avaliando se entra nela.
 *
 * Três decisões deliberadas:
 * - A pergunta sai do nível iniciante quando existe. Um acerto logo de cara é o
 *   que sustenta a sequência; abrir com a mais difícil filtra gente fora.
 * - O feedback traz a explicação completa, não só certo/errado. É a amostra do
 *   que o quiz entrega, e o que justifica continuar.
 * - Vale zero ponto, e a tela diz isso. Contar pontos de uma pergunta respondida
 *   fora do cronômetro inflaria o placar de quem só passou pela capa.
 *
 * A escolha é determinística (menor id do lote) porque este componente é
 * renderizado no servidor: sortear no render daria hidratação divergente. O
 * botão "outra pergunta" faz o sorteio depois, já no cliente.
 */
function TeaserQuestion({ pool, onContinue }: {
    pool: QuizQuestion[]
    onContinue: (excludeId: number) => void
}) {
    const [step, setStep] = useState(0)
    const [picked, setPicked] = useState<number | null>(null)

    const candidates = useMemo(() => {
        const easy = pool.filter(q => q.difficulty === 'easy')
        const base = easy.length > 0 ? easy : pool
        return [...base].sort((a, b) => a.id - b.id)
    }, [pool])

    const q = candidates.length > 0 ? candidates[step % candidates.length] : null
    if (!q) return null

    const answered = picked !== null
    const correct = picked === q.correct

    return (
        <section className="border-t border-border pt-6">
            <div className="mb-4 flex items-baseline gap-3">
                <h2 className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent">
                    Comece por aqui
                </h2>
                <p className="font-mono text-[10px] text-muted">Sem cronômetro, sem pontos</p>
                {!answered && candidates.length > 1 && (
                    <button type="button" onClick={() => setStep(s => s + 1)}
                        className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-foreground">
                        Outra pergunta ↻
                    </button>
                )}
            </div>

            <p className="max-w-[34ch] font-serif text-[clamp(1.375rem,2.6vw,2rem)] font-medium leading-[1.15] text-foreground sm:max-w-[46ch]">
                {q.question}
            </p>

            <div className="mt-6 grid gap-x-6 sm:grid-cols-2">
                {q.options.map((opt, i) => {
                    const isCorrect = i === q.correct
                    const isPicked = i === picked
                    const state = !answered ? 'idle' : isCorrect ? 'correct' : isPicked ? 'wrong' : 'muted'
                    return (
                        <button key={i} type="button" disabled={answered}
                            onClick={() => setPicked(i)}
                            className={`flex items-start gap-3 border-t py-3 text-left transition-colors ${
                                state === 'correct' ? 'border-green-400 text-green-400'
                                : state === 'wrong' ? 'border-red-400 text-red-400'
                                : state === 'muted' ? 'border-border text-muted'
                                : 'border-border text-foreground hover:border-accent hover:text-accent'
                            }`}>
                            <span className="mt-0.5 font-mono text-[11px] font-black opacity-60">
                                {String.fromCharCode(65 + i)}
                            </span>
                            <span className="flex-1 text-[15px] font-bold leading-snug">{opt}</span>
                            {state === 'correct' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                            {state === 'wrong' && <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                        </button>
                    )
                })}
            </div>

            {answered && (
                <div className="mt-6 border-t border-border pt-5">
                    <p className={`font-mono text-[11px] font-black uppercase tracking-[0.14em] ${correct ? 'text-green-400' : 'text-red-400'}`}>
                        {correct ? 'Acertou' : 'Não foi dessa vez'}
                    </p>
                    {q.explanation && (
                        <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-muted">{q.explanation}</p>
                    )}
                    <button type="button" onClick={() => onContinue(q.id)}
                        className="mt-5 inline-flex items-center gap-3 bg-accent-a11y px-6 py-3.5 text-[15px] font-black text-white transition-opacity hover:opacity-90 active:scale-[0.99]">
                        <Play className="h-4 w-4 fill-current" />
                        {correct ? 'Continuar valendo pontos' : 'Tentar valendo pontos'}
                        <ArrowRight className="h-4 w-4" />
                    </button>
                    <p className="mt-2 font-mono text-[10px] text-muted">
                        {QUIZ_SIZE} perguntas · esta não se repete
                    </p>
                </div>
            )}
        </section>
    )
}

// ─── Start Screen ─────────────────────────────────────────────────────────────

function StartScreen({ onStart, stats, allQuestions, initialCategory = 'all', initialSubcategory = '' }: {
    onStart: (cat: CategoryFilter, diff: QuizDifficulty, excludeId?: number) => void
    stats: QuizStats
    allQuestions: QuizQuestion[]
    initialCategory?: CategoryFilter
    initialSubcategory?: string
}) {
    const [category, setCategory] = useState<CategoryFilter>(initialCategory)
    const [difficulty, setDifficulty] = useState<QuizDifficulty>('medium')

    // Conta questões disponíveis para o filtro atual
    const availableCount = useMemo(() => {
        let pool = allQuestions
        if (category !== 'all') pool = pool.filter(q => q.category === category)
        if (initialSubcategory) pool = pool.filter(q => !q.subcategory || q.subcategory === initialSubcategory)
        const byDiff = pool.filter(q => q.difficulty === difficulty)
        return byDiff.length >= 5 ? byDiff.length : pool.length
    }, [allQuestions, category, difficulty, initialSubcategory])

    // Sem cor por categoria: rosa/azul/roxo/âmbar aqui era decoração, não
    // informação — categoria não tem ordem nem valor a codificar. A cor
    // semântica da página (verde/âmbar/vermelho no aproveitamento, e a escala
    // de dificuldade) continua, porque essa carrega significado.
    const categories: { value: CategoryFilter; label: string; Icon: React.FC<{ className?: string }>; sub: string }[] = [
        { value: 'all',      label: 'Todas',    Icon: Layers, sub: 'K-Pop, Drama, Cultura' },
        { value: 'k-pop',    label: 'K-Pop',    Icon: Music,  sub: 'Grupos e artistas'      },
        { value: 'k-drama',  label: 'K-Drama',  Icon: Tv,     sub: 'Séries e cinema'        },
        { value: 'cultura',  label: 'Cultura',  Icon: Globe,  sub: 'Tradições coreanas'     },
        { value: 'historia', label: 'História', Icon: Clock,  sub: 'Passado e presente'     },
    ]

    const difficulties: { value: QuizDifficulty; label: string; desc: string; detail: string }[] = [
        { value: 'easy',   label: 'Iniciante',     desc: '20s / pergunta', detail: '80 pts/acerto'  },
        { value: 'medium', label: 'Intermediário', desc: '15s / pergunta', detail: '100 pts/acerto' },
        { value: 'hard',   label: 'Expert',        desc: '10s / pergunta', detail: '150 pts/acerto' },
    ]

    const bestScore = stats.scores[0]?.points ?? null
    const totalAvailable = allQuestions.length

    // A isca segue a categoria escolhida: trocar de categoria e continuar vendo
    // uma pergunta de outra área quebraria a promessa do próprio controle.
    const teaserPool = useMemo(() => {
        let pool = allQuestions
        if (category !== 'all') pool = pool.filter(q => q.category === category)
        if (initialSubcategory) pool = pool.filter(q => !q.subcategory || q.subcategory === initialSubcategory)
        return pool
    }, [allQuestions, category, initialSubcategory])

    // Stats compactas para o painel lateral desktop / topo mobile
    const avgPct = stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : null
    const bestStreak = stats.scores.length > 0 ? Math.max(...stats.scores.map(s => s.streak ?? 0)) : 0

    return (
        <>
            <style>{`@keyframes cffall { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }`}</style>

            {/* ── Layout: mobile stack / desktop 2-col ── */}
            <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

                {/* Headline — sempre acima das 2 colunas */}
                <div className="mb-8 lg:mb-10">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-3">
                        Quiz Hallyu · {totalAvailable} perguntas
                    </p>
                    <h1 className="font-serif text-[36px] font-medium leading-[1.02] tracking-[-0.02em] mb-4 sm:text-[52px] lg:text-[60px]">
                        Quanto você<br />sabe sobre<br className="sm:hidden" /> a Coreia?
                    </h1>
                    {/* Stats compactas inline — só para quem já jogou */}
                    {stats.totalGames > 0 && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
                            <span className="font-black text-foreground">{stats.totalGames}</span> partidas
                            <span className="w-px h-3 bg-border" />
                            <span className={`font-black ${avgPct! >= 70 ? 'text-green-400' : avgPct! >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{avgPct}%</span> de acerto
                            {bestStreak >= 3 && <><span className="w-px h-3 bg-border" /><span className="text-orange-400 font-black">🔥{bestStreak}</span> melhor streak</>}
                            {bestScore !== null && <><span className="w-px h-3 bg-border" /><span className="text-amber-400 font-black flex items-center gap-1"><Medal className="w-3 h-3" />{bestScore.toLocaleString()} pts</span> recorde</>}
                        </div>
                    )}
                </div>

                {/* A isca vem antes dos controles: a decisão de jogar é mais fácil
                    depois de já ter jogado uma pergunta do que antes. */}
                {teaserPool.length > 0 && (
                    <div className="mb-10 lg:mb-12">
                        <TeaserQuestion pool={teaserPool} onContinue={id => onStart(category, difficulty, id)} />
                    </div>
                )}

                {totalAvailable === 0 && (
                    <div className="mb-8 border border-amber-400/30 bg-amber-400/5 px-4 py-4 text-[13px] text-amber-400">
                        Nenhuma pergunta encontrada. Adicione perguntas no WordPress Admin → Quiz Questions.
                    </div>
                )}

                {/* 2 colunas no desktop */}
                <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start">

                    {/* ── Coluna esquerda: categorias ── */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted mb-3">Categoria</p>

                        {/* Grid 2×2 + "Todas" full-width */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-0 mb-4">
                            {categories.filter(c => c.value !== 'all').map(c => {
                                const active = category === c.value
                                const cs = stats.categoryStats[c.value]
                                const catPct = cs ? Math.round((cs.correct / cs.total) * 100) : null
                                const countInCat = allQuestions.filter(q => q.category === c.value).length
                                return (
                                    <button
                                        type="button"
                                        key={c.value}
                                        aria-pressed={active}
                                        onClick={() => setCategory(c.value)}
                                        className={`group relative flex flex-col gap-2 border-t pb-4 pt-3.5 pr-2 text-left transition-colors ${
                                            active ? 'border-accent' : 'border-border hover:border-foreground/40'
                                        }`}
                                    >
                                        <c.Icon className={`w-5 h-5 ${active ? 'text-accent' : 'text-muted group-hover:text-foreground'} transition-colors`} />
                                        <div>
                                            <p className={`text-[15px] sm:text-[17px] font-black leading-tight ${active ? 'text-accent' : 'text-foreground'}`}>{c.label}</p>
                                            <p className="text-[11px] text-muted mt-0.5">{c.sub}</p>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto pt-1">
                                            <span className="font-mono text-[10px] text-muted">{countInCat}q</span>
                                            {catPct !== null && (
                                                <span className={`font-mono text-[10px] font-black ${catPct >= 70 ? 'text-green-400' : catPct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                                    {catPct}%
                                                </span>
                                            )}
                                        </div>
                                        {/* Marcador redundante à cor: quem não distingue o accent do
                                            texto normal ainda vê qual categoria está escolhida. */}
                                        {active && <span className="absolute -top-px left-0 h-0.5 w-10 bg-accent" />}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Todas — full-width chip */}
                        <button
                            type="button"
                            aria-pressed={category === 'all'}
                            onClick={() => setCategory('all')}
                            className={`relative w-full flex items-center justify-between py-3.5 pr-2 border-t transition-colors ${
                                category === 'all'
                                    ? 'border-accent text-accent'
                                    : 'border-border text-muted hover:border-foreground/40 hover:text-foreground'
                            }`}
                        >
                            {category === 'all' && <span className="absolute -top-px left-0 h-0.5 w-10 bg-accent" />}
                            <div className="flex items-center gap-3">
                                <Layers className={`w-4 h-4 ${category === 'all' ? 'text-accent' : 'text-muted'}`} />
                                <span className="text-[14px] font-black">Todas as categorias</span>
                            </div>
                            <span className="font-mono text-[11px] text-muted">{allQuestions.length}q</span>
                        </button>

                        {/* Histórico de partidas — visível só em desktop na col esquerda */}
                        {stats.totalGames > 0 && (
                            <div className="hidden lg:block mt-8">
                                <ScoreHistory scores={stats.scores} />
                            </div>
                        )}
                    </div>

                    {/* ── Coluna direita: dificuldade + CTA ── */}
                    <div className="mt-8 lg:mt-0 lg:sticky lg:top-24">
                        {/* Dificuldade */}
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted mb-3">Dificuldade</p>
                        {/* Fio no topo, igual às categorias — a moldura do controle
                            segmentado era o único retângulo restante da página.
                            A cor aqui é semântica (escala de dificuldade), então fica. */}
                        <div className="flex gap-x-5 mb-5">
                            {difficulties.map(d => {
                                const active = difficulty === d.value
                                const cfg = DIFFICULTY_CONFIG[d.value]
                                return (
                                    <button type="button" key={d.value} aria-pressed={active} onClick={() => setDifficulty(d.value)}
                                        className={`relative flex-1 border-t pt-3 pb-1 text-left text-[13px] font-black transition-colors ${
                                            active
                                                ? `${cfg.color} border-current`
                                                : 'text-muted border-border hover:border-foreground/40 hover:text-foreground'
                                        }`}>
                                        {active && <span className="absolute -top-px left-0 h-0.5 w-8 bg-current" />}
                                        {d.label}
                                        <span className="block text-[10px] font-medium opacity-70 mt-0.5">{d.desc}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Info da partida — compacto */}
                        <div className="flex items-center justify-between text-[12px] text-muted mb-5 px-1">
                            <span>{QUIZ_SIZE} perguntas</span>
                            <span className={`font-black ${DIFFICULTY_CONFIG[difficulty].color}`}>{DIFFICULTY_CONFIG[difficulty].time}s / questão</span>
                            <span className="text-amber-400 font-black">até {DIFFICULTY_CONFIG[difficulty].pts * QUIZ_SIZE} pts</span>
                        </div>

                        {availableCount < QUIZ_SIZE && (
                            <p className="text-[11px] text-amber-400 border border-amber-400/20 bg-amber-400/5 px-3 py-2 mb-4">
                                ⚠ {availableCount} questões disponíveis — todas serão usadas.
                            </p>
                        )}

                        {/* CTA desktop */}
                        <button
                            type="button"
                            onClick={() => onStart(category, difficulty)}
                            disabled={totalAvailable === 0}
                            className="hidden sm:flex w-full items-center justify-center gap-3 py-4 bg-accent-a11y text-white font-black text-[15px] hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-4"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            Começar o Quiz
                            <ArrowRight className="w-5 h-5" />
                        </button>

                        {/* Keyboard hint */}
                        <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted border border-border/50 px-3 py-2">
                            <Keyboard className="w-3.5 h-3.5 shrink-0" />
                            <span>Use <kbd className="font-mono font-black">A B C D</kbd> ou <kbd className="font-mono font-black">1 2 3 4</kbd> para responder</span>
                        </div>

                        {/* Histórico — só mobile (fica abaixo do CTA sticky) */}
                        {stats.totalGames > 0 && (
                            <div className="lg:hidden mt-8">
                                <ScoreHistory scores={stats.scores} />
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* CTA mobile sticky */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
                <button
                    type="button"
                    onClick={() => onStart(category, difficulty)}
                    disabled={totalAvailable === 0}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-accent-a11y text-white font-black text-[15px] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Play className="w-5 h-5 fill-current" />
                    Começar · {DIFFICULTY_CONFIG[difficulty].label}
                </button>
            </div>
            <div className="h-24 sm:hidden" />
        </>
    )
}

// ─── Quiz Screen ──────────────────────────────────────────────────────────────

function QuizScreen({ questions, difficulty, onFinish }: {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

// ─── Result Screen ────────────────────────────────────────────────────────────

function ResultScreen({ questions, answers, points, timeHistory, maxTime, bestStreak, onReset }: {
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
