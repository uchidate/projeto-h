import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE, isActiveLocale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { setPageLocale } from '@/lib/i18n/request-locale'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { ComidasListagem, metadataComidas } from '@/app/(site)/comidas/ComidasListagem'

export const revalidate = 600

type Params = Promise<{ locale: string }>
type SearchParams = Parameters<typeof ComidasListagem>[0]['searchParams']

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
    const { locale } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) return {}
    return comoFallback(await metadataComidas({ searchParams }))
}

export default async function IntlFoodsPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) notFound()
    setPageLocale(locale)
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('foods', undefined, DEFAULT_LOCALE)} />
            <ComidasListagem searchParams={searchParams} />
        </>
    )
}
