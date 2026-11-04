import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import QuizCategoryPage, { generateMetadata as metadataEmPortugues } from '@/app/(site)/quiz/[categoria]/page'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 3600

type Params = Promise<{ locale: string; category: string }>
type SearchParams = Parameters<typeof QuizCategoryPage>[0]['searchParams']

// Sem pré-geração: renderização sob demanda com ISR.
export function generateStaticParams() {
    return []
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, category } = await params
    if (!idiomaValido(locale)) return {}
    return comoFallback(await metadataEmPortugues({ params: Promise.resolve({ categoria: category }) }))
}

export default async function IntlQuizCategoryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale, category } = await params
    entrarNaPagina(locale)
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('quizCategory', { categoria: category }, DEFAULT_LOCALE)} />
            <QuizCategoryPage params={Promise.resolve({ categoria: category })} searchParams={searchParams} />
        </>
    )
}
