import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import CalendarioPage, { metadata as metadataEmPortugues } from '@/app/(site)/calendario/page'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 3600

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale)) return {}
    return comoFallback(metadataEmPortugues)
}

export default async function IntlCalendarPage({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale)
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('calendar', undefined, DEFAULT_LOCALE)} />
            <CalendarioPage />
        </>
    )
}
