import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { QuizCategory } from '@/lib/wordpress/quiz'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { QuizPageContent } from '@/components/quiz/jogo/QuizPageContent'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { buildAlternates } from '@/lib/i18n/alternates'
import { VALID_CATEGORIES, categoriasDoIdioma, idiomasDoTema, paramsDoTema } from './disponibilidade'

export { VALID_CATEGORIES }

type Params = Promise<{ categoria: string }>
type SearchParams = Promise<{ sub?: string }>

export async function generateMetadata({ params, locale = DEFAULT_LOCALE }: { params: Params; locale?: Locale }): Promise<Metadata> {
    const { categoria } = await params
    if (!(await categoriasDoIdioma(locale)).includes(categoria as QuizCategory)) return {}
    const cat = categoria as QuizCategory
    const [t, tc] = await Promise.all([
        getTranslations({ locale, namespace: 'quiz.meta' }),
        getTranslations({ locale, namespace: 'client.quiz.categorias' }),
    ])
    const label = tc(cat)
    const minusculo = locale === DEFAULT_LOCALE ? label.toLowerCase() : label
    const alternates = buildAlternates('quizCategory', paramsDoTema(cat), locale, await idiomasDoTema(cat, ['pt', 'en']))
    return {
        title: t('categoryTitle', { label }),
        description: t('categoryDescription', { label }),
        alternates,
        keywords: (t.raw('categoryKeywords') as string[]).map(k => k.replace('{label}', minusculo)),
        openGraph: baseOG(`${SITE_URL}${href('quizCategory', paramsDoTema(cat), locale)}`),
        twitter: baseTwitter(),
    }
}

export default async function QuizCategoriaPage({ params, searchParams, locale = DEFAULT_LOCALE }: { params: Params; searchParams: SearchParams; locale?: Locale }) {
    const [{ categoria }, sp] = await Promise.all([params, searchParams])
    if (!(await categoriasDoIdioma(locale)).includes(categoria as QuizCategory)) notFound()
    return <QuizPageContent category={categoria as QuizCategory} sub={sp.sub ?? ''} locale={locale} />
}
