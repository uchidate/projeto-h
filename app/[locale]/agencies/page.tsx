import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { LocalizedCatalog, buildCatalogMetadata } from '@/components/features/LocalizedCatalog'
import AgenciesPage, { generateMetadata as metadataEmPortugues } from '@/components/agencies/AgenciesIndex'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 3600

type Params = Promise<{ locale: string }>
type SearchParams = Parameters<typeof AgenciesPage>[0]['searchParams']

/** Português: a página. Outros idiomas: o catálogo das fichas traduzidas. */
export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    const metadata = await metadataEmPortugues({ searchParams })
    return locale === DEFAULT_LOCALE ? metadata : buildCatalogMetadata('agencies', locale)
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale === DEFAULT_LOCALE) return <AgenciesPage searchParams={searchParams} />
    return <LocalizedCatalog kind="agencies" locale={locale} />
}
