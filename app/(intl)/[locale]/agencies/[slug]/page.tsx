import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE, isActiveLocale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { setPageLocale } from '@/lib/i18n/request-locale'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import { metadataDaAgencia } from '@/app/(site)/agencies/[slug]/lib/metadata'
import AgencyDetailPage from '@/app/(site)/agencies/[slug]/page'

export const revalidate = 3600

type Params = Promise<{ locale: string; slug: string }>

// Sem pré-geração: renderização sob demanda com ISR, como as fichas traduzidas.
export function generateStaticParams() {
    return []
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) return {}
    return comoFallback(await metadataDaAgencia(slug))
}

export default async function IntlAgencyPage({ params }: { params: Params }) {
    const { locale, slug } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) notFound()
    setPageLocale(locale)
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('agency', { slug }, DEFAULT_LOCALE)} />
            <AgencyDetailPage params={Promise.resolve({ slug })} />
        </>
    )
}
