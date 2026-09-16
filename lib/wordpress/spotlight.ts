import { wpBuscarOpcional, buildParams } from './client'
import { getArtistBySlug } from './artists'
import { WP_CACHE_TAGS } from './cache'
import type { WPArtist } from './types'

interface SpotlightPost {
    id: number
    title: { rendered: string }
    date: string
    meta: {
        spotlight_slug: string
        spotlight_type: 'artist' | 'group'
        spotlight_note: string
    }
}

export interface FeaturedSpotlight {
    artist: WPArtist | null
    note: string
    type: 'artist' | 'group'
    publishedAt: string
}

export async function getFeaturedSpotlight(): Promise<FeaturedSpotlight | null> {
    try {
        const posts = await wpBuscarOpcional<SpotlightPost[]>(
            `/wp/v2/featured_spotlight${buildParams({ per_page: 1, orderby: 'date', order: 'desc', status: 'publish', _fields: 'id,title,date,meta' })}`,
            { revalidate: 300, tags: [WP_CACHE_TAGS.siteSettings] },
        )
        const post = posts[0]
        if (!post?.meta?.spotlight_slug) return null

        const artist = await getArtistBySlug(post.meta.spotlight_slug)
        return {
            artist,
            note: post.meta.spotlight_note ?? '',
            type: post.meta.spotlight_type ?? 'artist',
            publishedAt: post.date,
        }
    } catch {
        return null
    }
}
