import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { EmFallback } from '@/components/i18n/EmFallback'
import SearchPage, { generateMetadata as metadataEmPortugues } from '@/components/search/SearchIndex'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 0

type Params = Promise<{ locale: string }>
type SearchParams = Parameters<typeof SearchPage>[0]['searchParams']

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
        <EmFallback locale={locale} hrefOriginal={href('search', undefined, DEFAULT_LOCALE)}>
            <SearchPage searchParams={searchParams} />
        </EmFallback>
    )
}
