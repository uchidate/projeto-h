import type { QuizQuestion, QuizDifficulty } from '@/lib/wordpress/quiz'
import { podeGuardarHistorico, recusouConsentimento } from '@/lib/consent'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuizStats {
    totalGames: number
    totalCorrect: number
    totalQuestions: number
    categoryStats: Record<string, { correct: number; total: number }>
    scores: Array<{ points: number; score: number; total: number; date: string; difficulty: QuizDifficulty; streak: number }>
}

export const EMPTY_STATS: QuizStats = { totalGames: 0, totalCorrect: 0, totalQuestions: 0, categoryStats: {}, scores: [] }

const CHAVE = 'oc_quiz_stats'

export function loadStats(): QuizStats {
    try {
        // Quem recusa os cookies não tem estatística guardada: apaga o que já existia e não lê.
        if (recusouConsentimento()) { localStorage.removeItem(CHAVE); return EMPTY_STATS }
        const s = localStorage.getItem(CHAVE)
        return s ? JSON.parse(s) : EMPTY_STATS
    } catch { return EMPTY_STATS }
}

/** Só guarda com permissão. Sem ela as estatísticas valem na visita (o componente as mantém em memória). */
export function saveStats(stats: QuizStats) {
    if (!podeGuardarHistorico()) return
    try { localStorage.setItem(CHAVE, JSON.stringify(stats)) } catch { /* ignore */ }
}

export function updateStats(
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
