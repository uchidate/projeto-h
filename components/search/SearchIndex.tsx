import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { searchWordPress } from '@/lib/wordpress/search'
import { getTrendingArtists } from '@/lib/wordpress/artists'
import { stripHtml } from '@/lib/utils'
import { SITE_URL } from '@/lib/constants/site'
import { SearchResultsPage } from '@/components/features/SearchResultsPage'
import type { SearchResult } from '@/lib/search/types'


type SearchParams = Promise<{ q?: string }>

export async function metadataDaPagina({ searchParams, locale = DEFAULT_LOCALE }: { searchParams: SearchParams; locale?: Locale }): Promise<Metadata> {
    const { q } = await searchParams
    const t = await getTranslations({ locale, namespace: 'client.searchPage' })
    return {
        title: q ? t('titleQuery', { q }) : t('title'),
        alternates: { canonical: `${SITE_URL}${href('search', undefined, locale)}${q ? `?q=${encodeURIComponent(q)}` : ''}` },
        robots: { index: false },
    }
}

export default async function SearchPage({ searchParams, locale = DEFAULT_LOCALE }: { searchParams: SearchParams; locale?: Locale }) {
    const { q } = await searchParams
    const query = q?.trim() ?? ''

    const todos = (!query || query.length < 2) ? [] : await searchWordPress(query, 40)
    // Loja: preço em R$ e frete nacional; fora do português não entra.
    const results = locale === DEFAULT_LOCALE ? todos : todos.filter(r => r.type !== 'store_product')

    let suggestions: SearchResult[] = []
    if (query.length >= 2 && results.length === 0) {
        const trending = await getTrendingArtists(6)
        suggestions = trending.map(a => ({
            id: a.id,
            title: stripHtml(a.title.rendered),
            href: `/artists/${a.slug}`,
            type: 'artist' as const,
            thumbnail: a.featured_image_url ?? undefined,
        }))
    }

    return (
        <SearchResultsPage query={query} results={results} suggestions={suggestions} />
    )
}
