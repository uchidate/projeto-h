import type { Metadata } from 'next'
import BirthdaysPage, { metadataDaPagina } from '@/components/birthdays/BirthdaysIndex'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'
import type { Locale } from '@/lib/i18n/config'

export const revalidate = 3600

type Params = Promise<{ locale: string }>
type SearchParams = Parameters<typeof BirthdaysPage>[0]['searchParams']

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return metadataDaPagina({ searchParams, locale: locale as Locale })
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    return <BirthdaysPage searchParams={searchParams} locale={locale as Locale} />
}
