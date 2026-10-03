import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE, isActiveLocale } from '@/lib/i18n/config'
import { setPageLocale } from '@/lib/i18n/request-locale'
import { ContactPage } from '@/components/institucional/ContactPage'
import { metadataInstitucional } from '@/components/institucional/Texto'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) return {}
    return metadataInstitucional('contact', locale)
}

export default async function Page({ params }: { params: Params }) {
    const { locale } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) notFound()
    setPageLocale(locale)
    return <ContactPage locale={locale} />
}
