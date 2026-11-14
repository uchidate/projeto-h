import type { Metadata } from 'next'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import QuizCategoryPage, { generateMetadata as metadataDaCategoria, VALID_CATEGORIES } from '@/components/quiz/QuizCategoria'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 3600

type Params = Promise<{ locale: string; category: string }>
type SearchParams = Parameters<typeof QuizCategoryPage>[0]['searchParams']

const COM_QUIZ: readonly string[] = ['pt', 'en', 'es', 'ja']

// Pré-geração só do português. O filho devolve SEMPRE `{ locale, ... }` completos: se devolvesse
// vazio para `en`, o Next repassaria `{ locale: 'en' }` sem o parâmetro e, por haver um conjunto
// incompleto, desistiria de pré-gerar TODOS os caminhos. Os outros idiomas renderizam sob demanda com ISR.
export function generateStaticParams() {
    return VALID_CATEGORIES.map(category => ({ locale: DEFAULT_LOCALE, category }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, category } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    const p = Promise.resolve({ categoria: category })
    if (COM_QUIZ.includes(locale)) return metadataDaCategoria({ params: p, locale: locale as Locale })
    return comoFallback(await metadataDaCategoria({ params: p }))
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale, category } = await params
    entrarNaPagina(locale, { servePt: true })
    const p = Promise.resolve({ categoria: category })
    if (COM_QUIZ.includes(locale)) return <QuizCategoryPage params={p} searchParams={searchParams} locale={locale as Locale} />
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('quizCategory', { categoria: category }, DEFAULT_LOCALE)} />
            <QuizCategoryPage params={p} searchParams={searchParams} />
        </>
    )
}
