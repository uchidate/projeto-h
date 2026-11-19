import { WP_API_NAMESPACE } from '@/lib/constants/identidade.mjs'
import { wpBuscarOpcional } from './client'
import { WP_CACHE_TAGS } from './cache'
import type { ArchiveHub } from '@/lib/guias/types'

/** Texto editorial de um guia no CPT `guia` (endpoint hallyuhub/v1/guias): só os campos preenchidos. */
export type GuiaTextoWP = { slug: string } & Partial<Pick<ArchiveHub,
    'title' | 'shortTitle' | 'description' | 'intro' | 'keywords' | 'faq' | 'whatYouWillFind' | 'relatedSearches' | 'seoTitle' | 'seoDescription'>>

export async function getGuias(): Promise<GuiaTextoWP[]> {
    try {
        const guias = await wpBuscarOpcional<GuiaTextoWP[]>(`/${WP_API_NAMESPACE}/guias`, {
            revalidate: 3600,
            tags: [WP_CACHE_TAGS.guias],
        })
        return Array.isArray(guias) ? guias.filter((g) => typeof g?.slug === 'string') : []
    } catch {
        return []
    }
}
