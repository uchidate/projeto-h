import {
    Music, Tv, Globe, Clock, Users, Mic2, Film, BookOpen,
} from 'lucide-react'
import type { QuizCategory, QuizDifficulty } from '@/lib/wordpress/quiz'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'

// ─── Config ───────────────────────────────────────────────────────────────────

export const CATEGORY_META: Record<string, { color: string; bg: string; Icon: React.FC<{ className?: string }> }> = {
    'k-pop':    { color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/20',   Icon: Music },
    'k-drama':  { color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',   Icon: Tv },
    'cultura':  { color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', Icon: Globe },
    'historia': { color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20', Icon: Clock },
}

export const DIFFICULTY_CONFIG: Record<QuizDifficulty, { time: number; pts: number; color: string }> = {
    easy:   { time: 20, pts: 80,  color: 'text-emerald-400' },
    medium: { time: 15, pts: 100, color: 'text-amber-400'   },
    hard:   { time: 10, pts: 150, color: 'text-red-400'     },
}

// Links para correlacionar o quiz com o conteúdo do site. `chave` aponta para `client.quiz.links`; o destino sai de `hrefDoLink`.
export type LinkDoQuiz = 'boyGroups' | 'girlGroups' | 'soloArtists' | 'dramaCatalog' | 'romanceDramas' | 'bestDramas'
    | 'cultureArticles' | 'blog' | 'koreanArtists' | 'historicalDramas' | 'historyGuide' | 'kpopGroups' | 'artists'

export const CONTENT_LINKS: Record<string, Array<{ chave: LinkDoQuiz; Icon: React.FC<{ className?: string }> }>> = {
    'k-pop': [
        { chave: 'boyGroups', Icon: Users },
        { chave: 'girlGroups', Icon: Users },
        { chave: 'soloArtists', Icon: Mic2 },
    ],
    'k-drama': [
        { chave: 'dramaCatalog', Icon: Film },
        { chave: 'romanceDramas', Icon: Film },
        { chave: 'bestDramas', Icon: Film },
    ],
    'cultura': [
        { chave: 'cultureArticles', Icon: Globe },
        { chave: 'blog', Icon: BookOpen },
        { chave: 'koreanArtists', Icon: Mic2 },
    ],
    'historia': [
        { chave: 'blog', Icon: BookOpen },
        { chave: 'historicalDramas', Icon: Film },
        { chave: 'historyGuide', Icon: Film },
    ],
    'all': [
        { chave: 'dramaCatalog', Icon: Film },
        { chave: 'kpopGroups', Icon: Users },
        { chave: 'artists', Icon: Mic2 },
    ],
}

/** Destino de cada link no idioma. Em PT mantém os caminhos de sempre; em EN só aponta para o que existe em inglês. */
export function hrefDoLink(chave: LinkDoQuiz, locale: Locale): string {
    const en = locale !== DEFAULT_LOCALE
    switch (chave) {
        case 'boyGroups': return en ? href('groups', undefined, locale) : '/groups/boy-groups'
        case 'girlGroups': return en ? href('groups', undefined, locale) : '/groups/girl-groups'
        case 'soloArtists': case 'koreanArtists': case 'artists': return href('artists', undefined, locale)
        case 'dramaCatalog': return href('productions', undefined, locale)
        case 'romanceDramas': return en ? href('guide', { slug: 'korean-romance-dramas' }, locale) : '/guias/doramas-romanticos'
        case 'bestDramas': return en ? href('guide', { slug: 'best-korean-dramas-of-all-time' }, locale) : '/guias/melhores-doramas'
        case 'historicalDramas': return href('productions', undefined, locale)
        case 'historyGuide': return en ? href('guide', { slug: 'korean-historical-dramas' }, locale) : '/guias/doramas-historicos'
        case 'cultureArticles': return `${href('blog', undefined, locale)}?category=cultura`
        case 'kpopGroups': return href('groups', undefined, locale)
        case 'blog': return href('blog', undefined, locale)
    }
}

/** Os quatro temas do quiz; chave de `client.quiz.categorias`. */
export const TEMAS_DO_QUIZ = ['k-pop', 'k-drama', 'cultura', 'historia'] as const
export type TemaDoQuiz = (typeof TEMAS_DO_QUIZ)[number]
export function ehTema(c: unknown): c is TemaDoQuiz { return (TEMAS_DO_QUIZ as readonly unknown[]).includes(c) }

export type CategoryFilter = 'all' | QuizCategory
export type Screen = 'start' | 'quiz' | 'result'
export const QUIZ_SIZE = 15

export type ChaveResultado = 'perfeito' | 'excelente' | 'muitoBom' | 'quaseLa' | 'continue'

/** Faixa de resultado e cor; os textos vêm de `client.quiz.resultado.<chave>`. */
export function getResult(pct: number): { chave: ChaveResultado; color: string } {
    if (pct === 1)   return { chave: 'perfeito',  color: '#f59e0b' }
    if (pct >= 0.8)  return { chave: 'excelente', color: 'var(--color-accent,#ff246e)' }
    if (pct >= 0.6)  return { chave: 'muitoBom',  color: '#60a5fa' }
    if (pct >= 0.4)  return { chave: 'quaseLa',   color: '#a78bfa' }
    return             { chave: 'continue',  color: '#6b7280' }
}

export function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

/** Identidade visual da "sala de jogo": cor e emoji de cada tema, usados na capa e nas telas de partida e resultado. */
export const TEMA_VISUAL: Record<string, { cor: string; emoji: string }> = {
    'k-pop': { cor: '#ff5fa2', emoji: '🎤' }, 'k-drama': { cor: '#7aa2ff', emoji: '📺' },
    'cultura': { cor: '#38e1c0', emoji: '🍜' }, 'historia': { cor: '#c39bff', emoji: '🏯' },
}
