import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE, isActiveLocale } from '@/lib/i18n/config'
import { setPageLocale } from '@/lib/i18n/request-locale'
import { LocalizedBlogList, buildLocalizedBlogMetadata } from '@/components/blog/LocalizedBlogList'

export const revalidate = 600

type Params = Promise<{ locale: string }>
type SearchParams = Promise<{ page?: string }>

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
    const [{ locale }, { page }] = await Promise.all([params, searchParams])
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) return {}
    return buildLocalizedBlogMetadata(locale, page)
}

export default async function IntlBlogPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const [{ locale }, { page }] = await Promise.all([params, searchParams])
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) notFound()
    setPageLocale(locale)
    return <LocalizedBlogList locale={locale} pageParam={page} />
}
