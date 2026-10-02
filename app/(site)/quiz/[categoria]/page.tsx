import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { QuizCategory } from '@/lib/wordpress/quiz'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { QuizPageContent, CATEGORY_LABELS } from '../quizPageContent'

export const revalidate = 3600

const VALID_CATEGORIES = ['k-pop', 'k-drama', 'cultura', 'historia'] as QuizCategory[]

type Params = Promise<{ categoria: string }>
type SearchParams = Promise<{ sub?: string }>

export function generateStaticParams() {
    return VALID_CATEGORIES.map(categoria => ({ categoria }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { categoria } = await params
    if (!VALID_CATEGORIES.includes(categoria as QuizCategory)) return {}
    const cat = categoria as QuizCategory
    const label = CATEGORY_LABELS[cat]
    const canonical = `${SITE_URL}/quiz/${cat}`
    return {
        title: `Quiz de ${label}: teste seus conhecimentos`,
        description: `Quiz de ${label} grátis: perguntas em três níveis, cronômetro, placar e a explicação de cada resposta. Jogue agora e descubra quanto você sabe de ${label}.`,
        alternates: { canonical: canonical },
        keywords: [`quiz ${label.toLowerCase()}`, `perguntas ${label.toLowerCase()}`, `teste ${label.toLowerCase()}`],
        openGraph: baseOG(canonical),
        twitter: baseTwitter(),
    }
}

export default async function QuizCategoriaPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const [{ categoria }, sp] = await Promise.all([params, searchParams])
    if (!VALID_CATEGORIES.includes(categoria as QuizCategory)) notFound()
    return <QuizPageContent category={categoria as QuizCategory} sub={sp.sub ?? ''} />
}
