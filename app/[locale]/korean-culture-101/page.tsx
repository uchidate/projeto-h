import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { EmFallback } from '@/components/i18n/EmFallback'
import CulturaCoreana101Page, { metadata as metadataEmPortugues } from '@/components/cultura/Cultura101Pagina'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 3600

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return locale === DEFAULT_LOCALE ? metadataEmPortugues : comoFallback(metadataEmPortugues)
}

export default async function IntlCultura101Page({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    return (
        <EmFallback locale={locale} hrefOriginal={href('cultura101', undefined, DEFAULT_LOCALE)}>
            <CulturaCoreana101Page />
        </EmFallback>
    )
}
