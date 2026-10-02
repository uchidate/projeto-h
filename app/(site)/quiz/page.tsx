import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import type { QuizCategory } from '@/lib/wordpress/quiz'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { QuizPageContent } from './quizPageContent'

export const revalidate = 3600

const VALID_CATEGORIES = ['k-pop', 'k-drama', 'cultura', 'historia'] as QuizCategory[]

type SearchParams = Promise<{ sub?: string; category?: string }>

export async function generateMetadata(): Promise<Metadata> {
    const canonical = `${SITE_URL}/quiz`
    return {
        title: 'Quiz de K-Pop e K-Drama: 300+ perguntas',
        description: 'Quiz de K-Pop e K-Drama grátis: mais de 300 perguntas sobre música, séries, cultura e história da Coreia, em três níveis e com pergunta nova por dia.',
        alternates: { canonical: canonical },
        keywords: ['quiz kpop', 'quiz kdrama', 'teste kpop', 'perguntas kpop', 'quiz cultura coreana'],
        openGraph: baseOG(canonical),
        twitter: baseTwitter(),
    }
}

export default async function QuizPage({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams
    // Links antigos com ?category= viram a rota própria, melhor para o Google indexar.
    if (sp.category && VALID_CATEGORIES.includes(sp.category as QuizCategory)) {
        redirect(`/quiz/${sp.category}${sp.sub ? `?sub=${encodeURIComponent(sp.sub)}` : ''}`)
    }
    return <QuizPageContent category={null} sub={sp.sub ?? ''} />
}
