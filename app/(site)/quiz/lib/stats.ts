import type { QuizQuestion, QuizDifficulty } from '@/lib/wordpress/quiz'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuizStats {
    totalGames: number
    totalCorrect: number
    totalQuestions: number
    categoryStats: Record<string, { correct: number; total: number }>
    scores: Array<{ points: number; score: number; total: number; date: string; difficulty: QuizDifficulty; streak: number }>
}

export const EMPTY_STATS: QuizStats = { totalGames: 0, totalCorrect: 0, totalQuestions: 0, categoryStats: {}, scores: [] }

export function loadStats(): QuizStats {
    try {
        const s = localStorage.getItem('oc_quiz_stats')
        return s ? JSON.parse(s) : EMPTY_STATS
    } catch { return EMPTY_STATS }
}

export function saveStats(stats: QuizStats) {
    try { localStorage.setItem('oc_quiz_stats', JSON.stringify(stats)) } catch { /* ignore */ }
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
