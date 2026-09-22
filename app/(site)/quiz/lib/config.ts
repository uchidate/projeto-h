import {
    Music, Tv, Globe, Clock, Users, Mic2, Film, BookOpen,
} from 'lucide-react'
import type { QuizCategory, QuizDifficulty } from '@/lib/wordpress/quiz'

// ─── Config ───────────────────────────────────────────────────────────────────

export const CATEGORY_META: Record<string, { label: string; color: string; bg: string; Icon: React.FC<{ className?: string }> }> = {
    'k-pop':    { label: 'K-Pop',    color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/20',   Icon: Music },
    'k-drama':  { label: 'K-Drama',  color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',   Icon: Tv },
    'cultura':  { label: 'Cultura',  color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', Icon: Globe },
    'historia': { label: 'História', color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20', Icon: Clock },
}

export const DIFFICULTY_CONFIG: Record<QuizDifficulty, { label: string; time: number; pts: number; color: string }> = {
    easy:   { label: 'Iniciante',     time: 20, pts: 80,  color: 'text-emerald-400' },
    medium: { label: 'Intermediário', time: 15, pts: 100, color: 'text-amber-400'   },
    hard:   { label: 'Expert',        time: 10, pts: 150, color: 'text-red-400'     },
}

// Links para correlacionar o quiz com o conteúdo do site
export const CONTENT_LINKS: Record<string, Array<{ href: string; label: string; Icon: React.FC<{ className?: string }> }>> = {
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

export type CategoryFilter = 'all' | QuizCategory
export type Screen = 'start' | 'quiz' | 'result'
export const QUIZ_SIZE = 15

export function getResult(pct: number) {
    if (pct === 1)   return { title: 'Perfeito!',         sub: 'Expert Hallyu',       color: '#f59e0b' }
    if (pct >= 0.8)  return { title: 'Excelente!',        sub: 'Fã dedicado',         color: 'var(--color-accent,#ff246e)' }
    if (pct >= 0.6)  return { title: 'Muito bom!',        sub: 'Bom conhecimento',    color: '#60a5fa' }
    if (pct >= 0.4)  return { title: 'Quase lá!',         sub: 'Continue explorando', color: '#a78bfa' }
    return             { title: 'Continue tentando!', sub: 'Iniciante',          color: '#6b7280' }
}

export function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}
