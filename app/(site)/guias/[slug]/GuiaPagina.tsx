import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { SITE_URL } from '@/lib/constants/site'
import { getHub, getRelatedHubs } from '@/lib/guias'
import { getHubItems } from '@/lib/guias/hub-items'
import { getPosts } from '@/lib/wordpress/posts'
import { getProductionGenres } from '@/lib/wordpress/productions'
import { HubPageContent } from '@/components/features/HubPageContent'

export type SearchParamsGuia = Record<string, string | string[] | undefined>

export async function buildGuiaMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const hub = await getHub(slug)
    if (!hub) return {}
    const url = `${SITE_URL}/guias/${slug}`
    return {
        title: hub.title,
        description: hub.description,
        keywords: hub.keywords,
        alternates: { canonical: url },
        openGraph: {
            title: hub.title,
            description: hub.description,
            type: 'website',
            url,
        },
    }
}

/** Chaves de query que mudam o conteúdo do guia (filtros e paginação). */
export const CHAVES_FILTRO_GUIA = ['page', 'genre', 'platform', 'network', 'type', 'year'] as const

export async function GuiaPagina({ slug, sp }: { slug: string; sp: SearchParamsGuia }) {
    const hub = await getHub(slug)
    if (!hub) notFound()

    const page    = Math.max(1, Number(sp.page ?? 1) || 1)
    const genre   = typeof sp.genre    === 'string' ? sp.genre    : undefined
    const platform= typeof sp.platform === 'string' ? sp.platform : undefined
    const network = typeof sp.network  === 'string' ? sp.network  : undefined
    const type    = typeof sp.type     === 'string' ? sp.type     : undefined
    const year    = typeof sp.year     === 'string' ? Number(sp.year) || undefined : undefined

    const [relatedHubs, result, { items: blogPosts }, genres] = await Promise.all([
        getRelatedHubs(hub),
        getHubItems(hub, { page, genre, platform, network, type, year }),
        getPosts({ search: hub.keywords[0], perPage: 3, includeContent: false }),
        getProductionGenres(),
    ])
    const genreMap = Object.fromEntries(genres.map(g => [g.id, { name: g.name, slug: g.slug }]))
    const perPage = 48
    const totalPages = Math.ceil(result.total / perPage)

    return (
        <Suspense>
            <HubPageContent
                hub={hub}
                relatedHubs={relatedHubs}
                total={result.total}
                productions={result.kind === 'productions' ? result.items : undefined}
                artists={result.kind === 'artists' ? result.items : undefined}
                groups={result.kind === 'groups' ? result.items : undefined}
                blogPosts={blogPosts}
                genreMap={genreMap}
                siteUrl={SITE_URL}
                page={page}
                totalPages={totalPages}
                activeFilters={{ genre, platform, network, type, year: year?.toString() }}
            />
        </Suspense>
    )
}
