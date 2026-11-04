import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { comoFallback } from '@/lib/i18n/fallback-ficha'
import { AvisoSemTraducao } from '@/components/i18n/AvisoSemTraducao'
import SearchPage, { generateMetadata as metadataEmPortugues } from '@/app/(site)/search/page'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 0

type Params = Promise<{ locale: string }>
type SearchParams = Parameters<typeof SearchPage>[0]['searchParams']

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale)) return {}
    return comoFallback(await metadataEmPortugues({ searchParams }))
}

export default async function IntlSearchPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    entrarNaPagina(locale)
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={href('search', undefined, DEFAULT_LOCALE)} />
            <SearchPage searchParams={searchParams} />
        </>
    )
}
