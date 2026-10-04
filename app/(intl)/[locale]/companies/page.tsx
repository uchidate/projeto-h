import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE, isActiveLocale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { setPageLocale } from '@/lib/i18n/request-locale'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import EmpresasPage, { generateMetadata as metadataEmPortugues } from '@/app/(site)/empresas/page'

export const revalidate = 600

type Params = Promise<{ locale: string }>
type SearchParams = Promise<{ search?: string; page?: string; industry?: string; chaebol?: string }>

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
    const { locale } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) return {}
    return comoFallback(await metadataEmPortugues())
}

export default async function IntlCompaniesPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) notFound()
    setPageLocale(locale)
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('companies', undefined, DEFAULT_LOCALE)} />
            <EmpresasPage searchParams={searchParams} />
        </>
    )
}
