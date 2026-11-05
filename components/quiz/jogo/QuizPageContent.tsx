import { getTranslations } from 'next-intl/server'
import { getQuizQuestions } from '@/lib/wordpress/quiz'
import type { QuizCategory } from '@/lib/wordpress/quiz'
import { PerguntaDoDiaServer } from '@/components/quiz/PerguntaDoDiaServer'
import { QuizClient } from './QuizClient'
import { SITE_URL } from '@/lib/constants/site'
import { QuizSobre, perguntasDoQuiz } from '@/components/quiz/QuizSobre'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildBreadcrumbSchema } from '@/lib/seo/jsonld'
import { DEFAULT_LOCALE, LOCALE_META, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { paramsDoTema } from '@/components/quiz/disponibilidade'
import { perguntasNoIdioma } from '@/lib/quiz/i18n'



/** Corpo da página do quiz, compartilhado entre /quiz (todas as categorias) e /quiz/{categoria}. */
export async function QuizPageContent({ category, sub, locale = DEFAULT_LOCALE }: { category: QuizCategory | null; sub: string; locale?: Locale }) {
    const [todas, t, tc] = await Promise.all([
        getQuizQuestions(),
        getTranslations({ locale, namespace: 'quiz.ld' }),
        getTranslations({ locale, namespace: 'client.quiz.categorias' }),
    ])
    const questions = perguntasNoIdioma(todas, locale)
    const emPt = locale === DEFAULT_LOCALE
    const label = category ? tc(category) : ''
    const canonicalPath = category ? href('quizCategory', paramsDoTema(category), locale) : href('quiz', undefined, locale)
    const canonical = `${SITE_URL}${canonicalPath}`
    const inicio = { name: 'HallyuHub', url: emPt ? SITE_URL : `${SITE_URL}${href('home', undefined, locale)}` }
    const breadcrumb = category
        ? [inicio, { name: 'Quiz', url: `${SITE_URL}${href('quiz', undefined, locale)}` }, { name: label, url: canonical }]
        : [inicio, { name: 'Quiz', url: canonical }]

    return (
        <>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'WebApplication',
                name: category ? t('categoryName', { label }) : t('name'),
                url: canonical,
                applicationCategory: 'GameApplication',
                operatingSystem: t('os'),
                inLanguage: LOCALE_META[locale].htmlLang,
                isAccessibleForFree: true,
                offers: { '@type': 'Offer', price: '0', priceCurrency: t('currency') },
                description: category ? t('categoryDescription', { label }) : t('description'),
            }} />
            {emPt && <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: (await perguntasDoQuiz(locale)).map(({ p, r }) => ({ '@type': 'Question', name: p, acceptedAnswer: { '@type': 'Answer', text: r } })) }} />}
            <JsonLd data={buildBreadcrumbSchema(breadcrumb)} />
            <QuizClient
                serverQuestions={questions}
                initialCategory={category ?? 'all'}
                initialSubcategory={sub}
                aposTitulo={<PerguntaDoDiaServer variante="alegre" locale={locale} />}
                rodape={<QuizSobre locale={locale} />}
            />
        </>
    )
}
