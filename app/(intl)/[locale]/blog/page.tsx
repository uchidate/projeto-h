import type { Metadata } from 'next'
import { LocalizedBlogList, buildLocalizedBlogMetadata } from '@/components/blog/LocalizedBlogList'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

export const revalidate = 600

type Params = Promise<{ locale: string }>
type SearchParams = Promise<{ page?: string }>

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
    const [{ locale }, { page }] = await Promise.all([params, searchParams])
    if (!idiomaValido(locale)) return {}
    return buildLocalizedBlogMetadata(locale, page)
}

export default async function IntlBlogPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
    const [{ locale }, { page }] = await Promise.all([params, searchParams])
    entrarNaPagina(locale)
    return <LocalizedBlogList locale={locale} pageParam={page} />
}
