import type { Metadata } from 'next'
import { getQuizQuestions } from '@/lib/wordpress/quiz'
import type { QuizCategory } from '@/lib/wordpress/quiz'
import { PerguntaDoDiaServer } from '@/components/quiz/PerguntaDoDiaServer'
import { QuizClient } from './QuizClient'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { QuizSobre, PERGUNTAS_QUIZ } from '@/components/quiz/QuizSobre'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildBreadcrumbSchema } from '@/lib/seo/jsonld'

export const revalidate = 3600

const VALID_CATEGORIES = ['k-pop', 'k-drama', 'cultura', 'historia'] as QuizCategory[]

type SearchParams = Promise<{ category?: string; sub?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const sp = await searchParams
    const cat = sp.category && VALID_CATEGORIES.includes(sp.category as QuizCategory) ? sp.category as QuizCategory : null
    const LABELS: Record<QuizCategory, string> = { 'k-pop': 'K-Pop', 'k-drama': 'K-Drama', 'cultura': 'Cultura', 'historia': 'História' }
    const canonical = `${SITE_URL}/quiz${cat ? `?category=${encodeURIComponent(cat)}` : ''}`
    return {
        title: cat
            ? `Quiz de ${LABELS[cat]}: teste seus conhecimentos`
            : 'Quiz de K-Pop e K-Drama: 300+ perguntas',
        description: cat
            ? `Quiz de ${LABELS[cat]} grátis: perguntas em três níveis, cronômetro, placar e a explicação de cada resposta. Jogue agora e descubra quanto você sabe.`
            : 'Quiz grátis de K-Pop, K-Drama, cultura e história da Coreia: mais de 300 perguntas em três níveis e uma pergunta nova por dia. Descubra quanto você sabe!',
        alternates: {
            canonical,
        },
        keywords: ['quiz kpop', 'quiz kdrama', 'teste kpop', 'perguntas kpop', 'quiz cultura coreana'],
        openGraph: baseOG(canonical),
        twitter: baseTwitter(),
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
        <>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'WebApplication',
                name: 'Quiz Hallyu',
                url: `${SITE_URL}/quiz`,
                applicationCategory: 'GameApplication',
                operatingSystem: 'Qualquer',
                inLanguage: 'pt-BR',
                isAccessibleForFree: true,
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
                description: 'Quiz de K-Pop, K-Drama, cultura e história da Coreia com pergunta do dia, placar e três níveis de dificuldade.',
            }} />
            <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: PERGUNTAS_QUIZ.map(({ p, r }) => ({ '@type': 'Question', name: p, acceptedAnswer: { '@type': 'Answer', text: r } })) }} />
            <JsonLd data={buildBreadcrumbSchema([{ name: 'HallyuHub', url: SITE_URL }, { name: 'Quiz', url: `${SITE_URL}/quiz` }])} />
            <QuizClient
                serverQuestions={questions}
                initialCategory={activeCategory ?? 'all'}
                initialSubcategory={activeSub}
                aposTitulo={<PerguntaDoDiaServer variante="alegre" />}
                rodape={<QuizSobre />}
            />
        </>
    )
}
