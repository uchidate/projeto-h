import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE, isActiveLocale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { setPageLocale } from '@/lib/i18n/request-locale'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import PositionPage, { generateMetadata as metadataEmPortugues } from '@/app/(site)/positions/[position]/page'

export const revalidate = 1800

type Params = Promise<{ locale: string; position: string }>

// Sem pré-geração: renderização sob demanda com ISR.
export function generateStaticParams() {
    return []
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale, position } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) return {}
    return comoFallback(await metadataEmPortugues({ params: Promise.resolve({ position }) }))
}

export default async function IntlPositionPage({ params }: { params: Params }) {
    const { locale, position } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) notFound()
    setPageLocale(locale)
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('position', { position }, DEFAULT_LOCALE)} />
            <PositionPage params={Promise.resolve({ position })} />
        </>
    )
}
