import type { Metadata } from 'next'
import { getQuizQuestions } from '@/lib/wordpress/quiz'
import type { QuizCategory } from '@/lib/wordpress/quiz'
import { QuizClient } from './QuizClient'
import { SITE_URL } from '@/lib/constants/site'

export const revalidate = 3600

const VALID_CATEGORIES = ['k-pop', 'k-drama', 'cultura', 'historia'] as QuizCategory[]

type SearchParams = Promise<{ category?: string; sub?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const sp = await searchParams
    const cat = sp.category && VALID_CATEGORIES.includes(sp.category as QuizCategory) ? sp.category as QuizCategory : null
    const LABELS: Record<QuizCategory, string> = { 'k-pop': 'K-Pop', 'k-drama': 'K-Drama', 'cultura': 'Cultura', 'historia': 'História' }
    return {
        title: cat
            ? `Quiz ${LABELS[cat]} — Teste seus conhecimentos`
            : 'Quiz K-Pop e K-Drama — Teste seus conhecimentos',
        description: cat
            ? `Teste seus conhecimentos sobre ${LABELS[cat]}. Perguntas de diferentes dificuldades com placar e estatísticas.`
            : 'Teste seus conhecimentos sobre K-Pop, K-Drama e cultura coreana. Perguntas de diferentes dificuldades com placar e estatísticas.',
        alternates: {
            canonical: `${SITE_URL}/quiz${cat ? `?category=${encodeURIComponent(cat)}` : ''}`,
        },
        keywords: ['quiz kpop', 'quiz kdrama', 'teste kpop', 'perguntas kpop', 'quiz cultura coreana'],
    }
}

export default async function QuizPage({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams
    const activeCategory = (sp.category && VALID_CATEGORIES.includes(sp.category as QuizCategory)
        ? sp.category as QuizCategory
        : null)
    const activeSub = sp.sub ?? ''
    const questions = await getQuizQuestions()

    return (
        <QuizClient
            serverQuestions={questions}
            initialCategory={activeCategory ?? 'all'}
            initialSubcategory={activeSub}
        />
    )
}
