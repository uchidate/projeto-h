import type { Metadata } from 'next'
import { LocalizedCatalog, buildCatalogMetadata } from '@/components/features/LocalizedCatalog'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 600

type Params = Promise<{ locale: string }>
type SearchParams = Promise<{ page?: string }>

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
    const [{ locale }, { page }] = await Promise.all([params, searchParams])
    if (!idiomaValido(locale)) return {}
    return buildCatalogMetadata('groups', locale, page)
}

export default async function IntlCatalogPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const [{ locale }, { page }] = await Promise.all([params, searchParams])
    entrarNaPagina(locale)
    return <LocalizedCatalog kind="groups" locale={locale} pageParam={page} />
}
