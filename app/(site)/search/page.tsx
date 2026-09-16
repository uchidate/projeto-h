import type { Metadata } from 'next'
import { searchWordPress } from '@/lib/wordpress/search'
import { getTrendingArtists } from '@/lib/wordpress/artists'
import { stripHtml } from '@/lib/utils'
import { SITE_URL } from '@/lib/constants/site'
import { SearchResultsPage } from '@/components/features/SearchResultsPage'
import type { SearchResult } from '@/lib/search/types'

export const revalidate = 0

type SearchParams = Promise<{ q?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const { q } = await searchParams
    return {
        title: q ? `Busca: ${q}` : 'Busca',
        alternates: { canonical: `${SITE_URL}/search${q ? `?q=${encodeURIComponent(q)}` : ''}` },
        robots: { index: false },
    }
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
    const { q } = await searchParams
    const query = q?.trim() ?? ''

    const results = (!query || query.length < 2) ? [] : await searchWordPress(query, 40)

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
