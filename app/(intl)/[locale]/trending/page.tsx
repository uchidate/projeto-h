import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE, isActiveLocale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { setPageLocale } from '@/lib/i18n/request-locale'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import TrendingPage, { metadata as metadataEmPortugues } from '@/app/(site)/trending/page'

export const revalidate = 300

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) return {}
    return comoFallback(metadataEmPortugues)
}

export default async function IntlTrendingPage({ params }: { params: Params }) {
    const { locale } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) notFound()
    setPageLocale(locale)
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('trending', undefined, DEFAULT_LOCALE)} />
            <TrendingPage />
        </>
    )
}
