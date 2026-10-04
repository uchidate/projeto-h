import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE, isActiveLocale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { setPageLocale } from '@/lib/i18n/request-locale'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import FandomPage, { generateMetadata as metadataEmPortugues } from '@/app/(site)/fandoms/[slug]/page'

export const revalidate = 600

type Params = Promise<{ locale: string; slug: string }>

// Sem pré-geração: renderização sob demanda com ISR.
export function generateStaticParams() {
    return []
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) return {}
    return comoFallback(await metadataEmPortugues({ params: Promise.resolve({ slug }) }))
}

export default async function IntlFandomPage({ params }: { params: Params }) {
    const { locale, slug } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) notFound()
    setPageLocale(locale)
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('fandom', { slug }, DEFAULT_LOCALE)} />
            <FandomPage params={Promise.resolve({ slug })} />
        </>
    )
}
