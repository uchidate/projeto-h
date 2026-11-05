import type { Metadata } from 'next'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { LocalizedCatalog, buildCatalogMetadata } from '@/components/features/LocalizedCatalog'
import EmpresasPage, { generateMetadata as metadataEmPortugues } from '@/components/empresas/EmpresasIndex'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 600

type Params = Promise<{ locale: string }>
type SearchParams = Parameters<typeof EmpresasPage>[0]['searchParams']

/** Português: a página. Outros idiomas: o catálogo das fichas traduzidas. */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale, { servePt: true })) return {}
    const metadata = await metadataEmPortugues()
    return locale === DEFAULT_LOCALE ? metadata : buildCatalogMetadata('companies', locale)
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const { locale } = await params
    entrarNaPagina(locale, { servePt: true })
    if (locale === DEFAULT_LOCALE) return <EmpresasPage searchParams={searchParams} />
    return <LocalizedCatalog kind="companies" locale={locale} />
}
