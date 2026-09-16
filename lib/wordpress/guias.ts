import { WP_API_NAMESPACE } from '@/lib/constants/identidade.mjs'
import { wpBuscarOpcional } from './client'
import { WP_CACHE_TAGS } from './cache'
import type { ArchiveHub } from '@/lib/guias/types'

export async function getGuias(): Promise<ArchiveHub[]> {
    try {
        const guias = await wpBuscarOpcional<ArchiveHub[]>(`/${WP_API_NAMESPACE}/guias`, {
            revalidate: 3600,
            tags: [WP_CACHE_TAGS.guias],
        })
        return Array.isArray(guias) ? guias : []
    } catch {
        return []
    }
}

export async function getGuia(slug: string): Promise<ArchiveHub | null> {
    const guias = await getGuias()
    return guias.find(g => g.slug === slug) ?? null
}
