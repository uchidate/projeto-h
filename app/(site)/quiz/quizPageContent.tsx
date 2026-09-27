import { getQuizQuestions } from '@/lib/wordpress/quiz'
import type { QuizCategory } from '@/lib/wordpress/quiz'
import { PerguntaDoDiaServer } from '@/components/quiz/PerguntaDoDiaServer'
import { QuizClient } from './QuizClient'
import { SITE_URL } from '@/lib/constants/site'
import { QuizSobre, PERGUNTAS_QUIZ } from '@/components/quiz/QuizSobre'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildBreadcrumbSchema } from '@/lib/seo/jsonld'

export const CATEGORY_LABELS: Record<QuizCategory, string> = { 'k-pop': 'K-Pop', 'k-drama': 'K-Drama', 'cultura': 'Cultura', 'historia': 'História' }

/** Corpo da página do quiz, compartilhado entre /quiz (todas as categorias) e /quiz/{categoria}. */
export async function QuizPageContent({ category, sub }: { category: QuizCategory | null; sub: string }) {
    const questions = await getQuizQuestions()
    const canonical = `${SITE_URL}/quiz${category ? `/${category}` : ''}`
    const breadcrumb = category
        ? [{ name: 'HallyuHub', url: SITE_URL }, { name: 'Quiz', url: `${SITE_URL}/quiz` }, { name: CATEGORY_LABELS[category], url: canonical }]
        : [{ name: 'HallyuHub', url: SITE_URL }, { name: 'Quiz', url: canonical }]

    return (
        <>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'WebApplication',
                name: category ? `Quiz de ${CATEGORY_LABELS[category]}` : 'Quiz Hallyu',
                url: canonical,
                applicationCategory: 'GameApplication',
                operatingSystem: 'Qualquer',
                inLanguage: 'pt-BR',
                isAccessibleForFree: true,
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
                description: category
                    ? `Quiz de ${CATEGORY_LABELS[category]} grátis, com pergunta do dia, placar e três níveis de dificuldade.`
                    : 'Quiz de K-Pop, K-Drama, cultura e história da Coreia com pergunta do dia, placar e três níveis de dificuldade.',
            }} />
            <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: PERGUNTAS_QUIZ.map(({ p, r }) => ({ '@type': 'Question', name: p, acceptedAnswer: { '@type': 'Answer', text: r } })) }} />
            <JsonLd data={buildBreadcrumbSchema(breadcrumb)} />
            <QuizClient
                serverQuestions={questions}
                initialCategory={category ?? 'all'}
                initialSubcategory={sub}
                aposTitulo={<PerguntaDoDiaServer variante="alegre" />}
                rodape={<QuizSobre />}
            />
        </>
    )
}
