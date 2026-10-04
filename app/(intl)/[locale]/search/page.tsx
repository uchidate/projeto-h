import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE, isActiveLocale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { setPageLocale } from '@/lib/i18n/request-locale'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import SearchPage, { generateMetadata as metadataEmPortugues } from '@/app/(site)/search/page'

export const revalidate = 0

type Params = Promise<{ locale: string }>
type SearchParams = Parameters<typeof SearchPage>[0]['searchParams']

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
    const { locale } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) return {}
    return comoFallback(await metadataEmPortugues({ searchParams }))
}

export default async function IntlSearchPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) notFound()
    setPageLocale(locale)
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('search', undefined, DEFAULT_LOCALE)} />
            <SearchPage searchParams={searchParams} />
        </>
    )
}
