import type { Metadata } from 'next'
import TrendingPage, { metadataDaPagina } from '@/components/trending/TrendingPage'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'
import type { Locale } from '@/lib/i18n/config'

export const revalidate = 300

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return metadataDaPagina(locale as Locale)
}

export default async function Page({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    return <TrendingPage locale={locale as Locale} />
}
