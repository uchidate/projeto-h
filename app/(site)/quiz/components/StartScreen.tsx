'use client'

import { useState, useMemo, type ReactNode } from 'react'
import {
    Layers, Music, Tv, Globe, Clock, Play, ArrowRight, Keyboard,
} from 'lucide-react'
import type { QuizQuestion, QuizDifficulty } from '@/lib/wordpress/quiz'
import type { QuizStats } from '../lib/stats'
import { type CategoryFilter, DIFFICULTY_CONFIG, QUIZ_SIZE } from '../lib/config'
import { ScoreHistory } from './ScoreHistory'

// Cor de cada tema: identifica o assunto de relance. Sala de jogo, de propósito mais viva que o resto do site.
const TOM: Record<string, { cor: string; emoji: string }> = {
    'k-pop': { cor: '#ff5fa2', emoji: '🎤' }, 'k-drama': { cor: '#7aa2ff', emoji: '📺' },
    'cultura': { cor: '#38e1c0', emoji: '🍜' }, 'historia': { cor: '#c39bff', emoji: '🏯' },
}
const NIVEL_EMOJI: Record<string, string> = { easy: '🐣', medium: '⚡', hard: '🚀' }

// ─── Start Screen ─────────────────────────────────────────────────────────────

export function StartScreen({ onStart, stats, allQuestions, initialCategory = 'all', initialSubcategory = '', aposTitulo }: {
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

    const alvo = category === 'all' ? 'Tudo misturado' : categories.find(c => c.value === category)?.label ?? ''

    return (
        <>
            <style>{`@keyframes cffall { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }`}</style>

            {/* Sala de jogo: fundo roxo, cartões de cor viva com sombra dura. */}
            <div className="bg-[#15102b] text-white">
            <div className="relative mx-auto max-w-[1100px] overflow-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                <span aria-hidden className="pointer-events-none absolute right-6 top-6 hidden rotate-12 text-[56px] sm:block">🎤</span>
                <span aria-hidden className="pointer-events-none absolute right-16 top-[300px] hidden rotate-[10deg] text-[40px] lg:block">🍜</span>

                <div className="relative mb-8 flex flex-col gap-5 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <span className="inline-block -rotate-2 bg-[#ffe14d] px-3 py-1 text-[12px] font-black tracking-[0.08em] text-[#15102b]">{totalAvailable} PERGUNTAS</span>
                        <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-[38px] font-extrabold leading-[1] sm:text-[52px] lg:text-[64px]">
                            <span className="sr-only">Quiz Hallyu: </span>Bora testar seu<br />lado <span className="text-[#ff5fa2]">fã</span>? <span className="text-[#38e1c0]">✦</span>
                        </h1>
                    </div>
                    {stats.totalGames > 0 && (
                        <div className="flex flex-wrap gap-3">
                            {bestStreak >= 2 && <div className="bg-[#ffe14d] px-4 py-2.5 font-black text-[#15102b] shadow-[5px_5px_0_#000]"><div className="text-[24px] leading-tight">🔥 {bestStreak}</div><div className="text-[11px] font-bold">melhor sequência</div></div>}
                            <div className="bg-[#38e1c0] px-4 py-2.5 font-black text-[#15102b] shadow-[5px_5px_0_#000]"><div className="text-[24px] leading-tight">{avgPct}%</div><div className="text-[11px] font-bold">de acerto</div></div>
                            {bestScore !== null && <div className="bg-[#ff5fa2] px-4 py-2.5 font-black text-[#15102b] shadow-[5px_5px_0_#000]"><div className="text-[24px] leading-tight">{bestScore.toLocaleString()}</div><div className="text-[11px] font-bold">melhor placar</div></div>}
                        </div>
                    )}
                </div>

                {totalAvailable === 0 && (
                    <div className="mb-8 border border-amber-400/30 bg-amber-400/5 px-4 py-4 text-[13px] text-amber-400">
                        Nenhuma pergunta encontrada. Adicione perguntas no WordPress Admin → Quiz Questions.
                    </div>
                )}

                {/* Pergunta do dia + convite para a rodada completa */}
                <div className="relative grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
                    {aposTitulo}
                    <div className="flex flex-col justify-center gap-3 bg-[#1f1840] p-6 shadow-[10px_10px_0_#000] lg:-ml-px">
                        <span aria-hidden className="text-[30px]">🎉</span>
                        <p className="font-[family-name:var(--font-playfair)] text-[24px] font-extrabold leading-tight">Quer mais? Uma rodada de {QUIZ_SIZE}!</p>
                        <p className="text-[13px] text-[#c9c2ee]">{alvo} · {DIFFICULTY_CONFIG[difficulty].label}</p>
                        <button type="button" onClick={() => onStart(category, difficulty)} disabled={totalAvailable === 0}
                            className="flex h-[54px] items-center justify-center gap-2 bg-[#ff5fa2] text-[16px] font-black text-[#15102b] shadow-[4px_4px_0_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40">
                            <Play className="h-5 w-5 fill-current" />Jogar agora<ArrowRight className="h-5 w-5" />
                        </button>
                        {availableCount < QUIZ_SIZE && <p className="text-[12px] text-[#ffe14d]">Só {availableCount} perguntas neste filtro: todas serão usadas.</p>}
                    </div>
                </div>

                {/* Temas */}
                <h2 className="mt-12 font-[family-name:var(--font-playfair)] text-[28px] font-extrabold sm:text-[34px]">Escolha seu time</h2>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
                    {categories.filter(c => c.value !== 'all').map(c => {
                        const active = category === c.value
                        const { cor, emoji } = TOM[c.value]
                        const countInCat = allQuestions.filter(q => q.category === c.value).length
                        const cs = stats.categoryStats[c.value]
                        const catPct = cs ? Math.round((cs.correct / cs.total) * 100) : null
                        return (
                            <button type="button" key={c.value} aria-pressed={active} onClick={() => setCategory(c.value)}
                                style={{ background: cor }}
                                className={`relative flex h-[150px] flex-col justify-between overflow-hidden p-4 text-left text-[#15102b] shadow-[6px_6px_0_#000] transition-transform hover:-translate-y-1 sm:h-[210px] sm:p-5 ${active ? 'outline outline-4 outline-offset-2 outline-white' : ''}`}>
                                <span aria-hidden className="absolute -right-1 top-3 text-[56px] leading-none sm:top-4 sm:text-[84px]">{emoji}</span>
                                <span className="relative flex items-center justify-between text-[12px] font-black uppercase tracking-[0.1em]">
                                    {c.label}
                                    {active && <span className="bg-[#15102b] px-1.5 text-white">✓</span>}
                                </span>
                                <span className="relative">
                                    <span className="block font-[family-name:var(--font-playfair)] text-[44px] font-extrabold leading-none sm:text-[58px]">{countInCat}</span>
                                    <span className="block text-[13px] font-bold sm:text-[15px]">{c.sub}{catPct !== null ? ` · ${catPct}% seu` : ''}</span>
                                </span>
                            </button>
                        )
                    })}
                </div>
                <button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')}
                    className={`mt-5 flex h-[60px] w-full items-center justify-between bg-white px-6 text-[17px] font-black text-[#15102b] shadow-[6px_6px_0_#000] transition-transform hover:-translate-y-0.5 ${category === 'all' ? 'outline outline-4 outline-offset-2 outline-[#ffe14d]' : ''}`}>
                    <span>🎲 Tudo misturado</span>
                    <span className="text-[14px]">{allQuestions.length} perguntas</span>
                </button>

                {/* Ritmo */}
                <h2 className="mt-12 font-[family-name:var(--font-playfair)] text-[28px] font-extrabold sm:text-[34px]">Qual é o seu ritmo?</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-3 sm:gap-5">
                    {difficulties.map(d => {
                        const active = difficulty === d.value
                        const cfg = DIFFICULTY_CONFIG[d.value]
                        return (
                            <button type="button" key={d.value} aria-pressed={active} onClick={() => setDifficulty(d.value)}
                                className={`p-5 text-left transition-transform hover:-translate-y-0.5 ${active ? 'bg-[#ffe14d] text-[#15102b] shadow-[6px_6px_0_#000]' : 'border-[3px] border-[#5a4d99] bg-[#1f1840] text-white'}`}>
                                <span aria-hidden className="text-[26px]">{NIVEL_EMOJI[d.value]}</span>
                                <span className="mt-1 block text-[20px] font-black">{d.label}</span>
                                <span className={`mt-1 block text-[14px] font-bold ${active ? '' : 'text-[#c9c2ee]'}`}>{cfg.time} s por pergunta · até {cfg.pts * QUIZ_SIZE} pts</span>
                            </button>
                        )
                    })}
                </div>

                <div className="mt-6 hidden items-center gap-2 text-[12px] text-[#c9c2ee] sm:flex">
                    <Keyboard className="h-3.5 w-3.5 shrink-0" />
                    <span>Use <kbd className="font-mono font-black">A B C D</kbd> ou <kbd className="font-mono font-black">1 2 3 4</kbd> para responder</span>
                </div>

                {stats.totalGames > 0 && <div className="mt-10"><ScoreHistory scores={stats.scores} /></div>}
            </div>
            </div>

            {/* CTA mobile sticky */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t-[3px] border-black bg-[#ffe14d] p-3">
                <button type="button" onClick={() => onStart(category, difficulty)} disabled={totalAvailable === 0}
                    className="flex h-[52px] w-full items-center justify-center gap-3 bg-[#ff5fa2] text-[16px] font-black text-[#15102b] shadow-[4px_4px_0_#000] active:translate-y-0.5 disabled:opacity-40">
                    <Play className="h-5 w-5 fill-current" />Jogar · {DIFFICULTY_CONFIG[difficulty].label}
                </button>
            </div>
            <div className="h-24 sm:hidden" />
        </>
    )
}
