import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { EmFallback } from '@/components/i18n/EmFallback'
import Fandoms, { generateMetadata as metadataEmPortugues } from '@/components/fandoms/FandomsIndex'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 600

type Params = Promise<{ locale: string }>
type SearchParams = Parameters<typeof Fandoms>[0]['searchParams']

/** Português: a página. Outros idiomas: a mesma página com o aviso de que ainda não há tradução. */
export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    const metadata = await metadataEmPortugues({ searchParams })
    return locale === DEFAULT_LOCALE ? metadata : comoFallback(metadata)
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    return (
        <EmFallback locale={locale} hrefOriginal={href('fandoms', undefined, DEFAULT_LOCALE)}>
            <Fandoms searchParams={searchParams} />
        </EmFallback>
    )
}
