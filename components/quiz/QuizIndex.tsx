import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { QuizCategory } from '@/lib/wordpress/quiz'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { QuizPageContent } from '@/components/quiz/jogo/QuizPageContent'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { buildAlternates } from '@/lib/i18n/alternates'
import { categoriasDoIdioma, paramsDoTema } from './disponibilidade'

type SearchParams = Promise<{ sub?: string; category?: string }>

/** Idiomas em que o /quiz existe, para hreflang. */
const IDIOMAS_DO_QUIZ: readonly Locale[] = ['pt', 'en']

export async function generateMetadata({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'quiz.meta' })
    const alternates = buildAlternates('quiz', undefined, locale, IDIOMAS_DO_QUIZ)
    return {
        title: t('indexTitle'),
        description: t('indexDescription'),
        alternates,
        keywords: t.raw('indexKeywords') as string[],
        openGraph: baseOG(`${SITE_URL}${href('quiz', undefined, locale)}`),
        twitter: baseTwitter(),
    }
}

export default async function QuizPage({ searchParams, locale = DEFAULT_LOCALE }: { searchParams: SearchParams; locale?: Locale }) {
    const sp = await searchParams
    // Links antigos com ?category= viram a rota própria, melhor para o Google indexar.
    if (sp.category && (await categoriasDoIdioma(locale)).includes(sp.category as QuizCategory)) {
        redirect(`${href('quizCategory', paramsDoTema(sp.category), locale)}${sp.sub ? `?sub=${encodeURIComponent(sp.sub)}` : ''}`)
    }
    return <QuizPageContent category={null} sub={sp.sub ?? ''} locale={locale} />
}
