'use client'

import { useState, useMemo } from 'react'
import {
    Layers, Music, Tv, Globe, Clock, Play, ArrowRight, Keyboard, Medal,
} from 'lucide-react'
import type { QuizQuestion, QuizDifficulty } from '@/lib/wordpress/quiz'
import type { QuizStats } from '../lib/stats'
import { type CategoryFilter, DIFFICULTY_CONFIG, QUIZ_SIZE } from '../lib/config'
import { TeaserQuestion } from './TeaserQuestion'
import { ScoreHistory } from './ScoreHistory'

// ─── Start Screen ─────────────────────────────────────────────────────────────

export function StartScreen({ onStart, stats, allQuestions, initialCategory = 'all', initialSubcategory = '' }: {
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
