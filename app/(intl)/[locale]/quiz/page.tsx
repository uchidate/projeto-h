import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE, isActiveLocale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { setPageLocale } from '@/lib/i18n/request-locale'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import QuizPage, { generateMetadata as metadataEmPortugues } from '@/app/(site)/quiz/page'

export const revalidate = 3600

type Params = Promise<{ locale: string }>
type SearchParams = Parameters<typeof QuizPage>[0]['searchParams']

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) return {}
    return comoFallback(await metadataEmPortugues())
}

export default async function IntlQuizPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) notFound()
    setPageLocale(locale)
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('quiz', undefined, DEFAULT_LOCALE)} />
            <QuizPage searchParams={searchParams} />
        </>
    )
}
