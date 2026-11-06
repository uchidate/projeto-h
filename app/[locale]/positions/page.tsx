import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { EmFallback } from '@/components/i18n/EmFallback'
import PositionsIndexPage, { metadata as metadataEmPortugues } from '@/components/positions/PositionsIndex'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 3600

type Params = Promise<{ locale: string }>

/** Português: a página. Outros idiomas: a mesma página com o aviso de que ainda não há tradução. */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    return locale === DEFAULT_LOCALE ? metadataEmPortugues : comoFallback(metadataEmPortugues)
}

export default async function Page({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    return (
        <EmFallback locale={locale} hrefOriginal={href('positions', undefined, DEFAULT_LOCALE)}>
            <PositionsIndexPage />
        </EmFallback>
    )
}
