'use client'

import { useState, useMemo, type ReactNode } from 'react'
import {
    Layers, Music, Tv, Globe, Clock, Play, ArrowRight, Keyboard, Medal,
} from 'lucide-react'
import type { QuizQuestion, QuizDifficulty } from '@/lib/wordpress/quiz'
import type { QuizStats } from '../lib/stats'
import { type CategoryFilter, DIFFICULTY_CONFIG, QUIZ_SIZE } from '../lib/config'
import Image from 'next/image'
import { ScoreHistory } from './ScoreHistory'

// Cor de cada tema: identifica o assunto de relance e dá ritmo à página.
const TOM: Record<string, string> = { 'k-pop': '#ff3d81', 'k-drama': '#4f8cff', 'cultura': '#a16bff', 'historia': '#f5b301' }

// ─── Start Screen ─────────────────────────────────────────────────────────────

export function StartScreen({ onStart, stats, allQuestions, initialCategory = 'all', initialSubcategory = '', aposTitulo, capas }: {
    /** Imagem de capa de cada tema (do próprio site); sem ela o cartão fica só na cor. */
    capas?: Partial<Record<string, string | null>>
    aposTitulo?: ReactNode
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
                    <h1 className="font-[family-name:var(--font-playfair)] whitespace-nowrap text-[34px] font-bold leading-none sm:text-[44px]">
                        Quiz<span className="sr-only"> Hallyu: teste o que você sabe sobre K-pop, K-drama e a Coreia</span><span className="text-accent">.</span>
                        <span className="ml-3.5 font-sans text-[13px] font-semibold text-muted sm:text-[14px]">{totalAvailable} perguntas</span>
                    </h1>
                    <p className="mb-3 mt-2.5 text-[15px] text-muted sm:text-[16px]">Quanto você sabe sobre a Coreia? Escolha um tema e jogue.</p>
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

                {aposTitulo}

                {totalAvailable === 0 && (
                    <div className="mb-8 border border-amber-400/30 bg-amber-400/5 px-4 py-4 text-[13px] text-amber-400">
                        Nenhuma pergunta encontrada. Adicione perguntas no WordPress Admin → Quiz Questions.
                    </div>
                )}

                {/* 2 colunas no desktop */}
                <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start">

                    {/* ── Coluna esquerda: temas em cartões com capa ── */}
                    <div>
                        <h2 className="font-[family-name:var(--font-playfair)] text-[24px] font-semibold leading-tight sm:text-[30px]">Escolha um tema</h2>
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
                            {categories.filter(c => c.value !== 'all').map(c => {
                                const active = category === c.value
                                const tom = TOM[c.value]
                                const capa = capas?.[c.value] ?? null
                                const countInCat = allQuestions.filter(q => q.category === c.value).length
                                const cs = stats.categoryStats[c.value]
                                const catPct = cs ? Math.round((cs.correct / cs.total) * 100) : null
                                return (
                                    <button
                                        type="button" key={c.value} aria-pressed={active} onClick={() => setCategory(c.value)}
                                        style={{ borderColor: active ? tom : undefined, ['--tom' as string]: tom }}
                                        className={`group relative flex h-[150px] flex-col justify-between overflow-hidden border-2 p-4 text-left transition-colors sm:h-[190px] sm:p-5 ${active ? '' : 'border-border hover:border-[color:var(--tom)]'}`}
                                    >
                                        {capa && <Image src={capa} alt="" fill sizes="(min-width: 1024px) 380px, 50vw" className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]" />}
                                        <span aria-hidden className="absolute inset-0" style={{ background: capa ? `linear-gradient(180deg, ${tom}55 0%, rgba(13,11,15,0.92) 78%)` : `linear-gradient(160deg, ${tom}40 0%, rgba(13,11,15,0.96) 85%)` }} />
                                        <span className="relative flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1.5 bg-black/55 px-2 py-1 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-white">
                                                <span style={{ color: tom }}><c.Icon className="h-4 w-4" /></span>{c.label}
                                            </span>
                                            {active && <span className="flex h-5 w-5 items-center justify-center text-[12px] font-black text-black" style={{ background: tom }}>✓</span>}
                                        </span>
                                        <span className="relative">
                                            <span className="block font-[family-name:var(--font-playfair)] text-[40px] font-bold leading-none text-white sm:text-[52px]">{countInCat}</span>
                                            <span className="mt-1 flex items-center justify-between gap-2 text-[12px] text-white/80 sm:text-[13px]">
                                                <span>{c.sub}</span>
                                                {catPct !== null && <span className="font-mono text-[11px] font-black" style={{ color: tom }}>{catPct}% seu</span>}
                                            </span>
                                        </span>
                                    </button>
                                )
                            })}
                        </div>

                        <button
                            type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')}
                            className={`mt-3 flex h-14 w-full items-center justify-between border-2 px-5 transition-colors sm:mt-4 ${category === 'all' ? 'border-accent text-accent' : 'border-border text-muted hover:border-foreground/40 hover:text-foreground'}`}
                        >
                            <span className="flex items-center gap-3 text-[15px] font-black"><Layers className="h-4 w-4" />Tudo misturado</span>
                            <span className="font-mono text-[12px]">{allQuestions.length} perguntas</span>
                        </button>

                        {stats.totalGames > 0 && (
                            <div className="mt-8 hidden lg:block">
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
                        <div className="mb-5 grid gap-2">
                            {difficulties.map(d => {
                                const active = difficulty === d.value
                                const cfg = DIFFICULTY_CONFIG[d.value]
                                return (
                                    <button type="button" key={d.value} aria-pressed={active} onClick={() => setDifficulty(d.value)}
                                        className={`flex items-center justify-between gap-3 border-2 px-4 py-3 text-left transition-colors ${active ? `${cfg.color} border-current bg-current/5` : 'border-border text-muted hover:border-foreground/40 hover:text-foreground'}`}>
                                        <span>
                                            <span className="block text-[15px] font-black">{d.label}</span>
                                            <span className="block text-[12px] font-medium opacity-80">{d.desc}</span>
                                        </span>
                                        <span className="font-mono text-[12px] font-black">até {cfg.pts * QUIZ_SIZE} pts</span>
                                    </button>
                                )
                            })}
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
