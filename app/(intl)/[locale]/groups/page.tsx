import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isActiveLocale } from '@/lib/i18n/config'
import { setPageLocale } from '@/lib/i18n/request-locale'
import { LocalizedCatalog, buildCatalogMetadata } from '@/components/features/LocalizedCatalog'

export const revalidate = 600

type Params = Promise<{ locale: string }>
type SearchParams = Promise<{ page?: string }>

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
    const [{ locale }, { page }] = await Promise.all([params, searchParams])
    if (!isActiveLocale(locale)) return {}
    return buildCatalogMetadata('groups', locale, page)
}

export default async function IntlCatalogPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const [{ locale }, { page }] = await Promise.all([params, searchParams])
    if (!isActiveLocale(locale)) notFound()
    setPageLocale(locale)
    return <LocalizedCatalog kind="groups" locale={locale} pageParam={page} />
}
