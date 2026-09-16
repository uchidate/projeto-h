import { getProductions } from '@/lib/wordpress/productions'
import { getArtists, getArtistsByIds } from '@/lib/wordpress/artists'
import { getGroups } from '@/lib/wordpress/groups'
import { wpFetch, buildParams } from '@/lib/wordpress/client'
import type { WPProduction, WPArtist, WPGroup } from '@/lib/wordpress/types'
import type { ArchiveHub } from './types'
import {
    PRODUCTION_GENRE_MAP,
    PRODUCTION_PLATFORM_MAP,
    PRODUCTION_NETWORK_MAP,
    ARTIST_FILTER_MAP,
    GROUP_TYPE_MAP,
} from './hub-maps'

export type {
    ArtistFilter,
    GroupType,
} from './hub-maps'

export {
    PRODUCTION_GENRE_MAP,
    PRODUCTION_PLATFORM_MAP,
    PRODUCTION_NETWORK_MAP,
    ARTIST_FILTER_MAP,
    GROUP_TYPE_MAP,
}

export type HubItems =
    | { kind: 'productions'; items: WPProduction[]; total: number }
    | { kind: 'artists'; items: WPArtist[]; total: number }
    | { kind: 'groups'; items: WPGroup[]; total: number }

type WPAgency = { id: number; title: { rendered: string } }

async function findAgencyId(name: string): Promise<number | null> {
    try {
        const agencies = await wpFetch<WPAgency[]>(
            `/wp/v2/agency${buildParams({ search: name, per_page: 5 })}`,
            { revalidate: 3600 }
        )
        const match = agencies.find(a => a.title.rendered.toLowerCase() === name.toLowerCase())
        return match?.id ?? null
    } catch { return null }
}

async function getGroupMemberIds(groupSlug: string): Promise<number[]> {
    try {
        const groups = await wpFetch<WPGroup[]>(
            `/wp/v2/group${buildParams({ slug: groupSlug, per_page: 1 })}`,
            { revalidate: 3600 }
        )
        return (groups[0]?.acf?.members as number[] | undefined) ?? []
    } catch { return [] }
}

export type HubItemsOptions = {
    page?: number
    perPage?: number
    genre?: string
    tag?: string
    platform?: string
    network?: string
    type?: string
    year?: number
    status?: string
}

export async function getHubItems(hub: ArchiveHub, opts: HubItemsOptions = {}): Promise<HubItems> {
    const f = hub.filter
    const { page = 1, perPage = 48 } = opts

    // Active filters from URL override hub defaults
    const genre    = opts.genre    ?? f.genre
    const tag      = opts.tag      ?? f.tag
    const platform = opts.platform ?? f.platform
    const network  = opts.network  ?? f.network
    const type     = (opts.type    ?? f.type) as 'drama' | 'movie' | 'special' | 'variety' | undefined
    const year     = opts.year     ?? f.year

    try {
        if (hub.kind === 'productions') {
            const { items, total } = await getProductions({
                page, perPage,
                genre, tag, platform, network, type, year,
                orderby: 'trending_score',
                order: 'desc',
            })
            return { kind: 'productions', items, total }
        }

        if (hub.kind === 'artists') {
            if (f.groupSlug) {
                const memberIds = await getGroupMemberIds(f.groupSlug)
                if (!memberIds.length) return { kind: 'artists', items: [], total: 0 }
                const items = await getArtistsByIds(memberIds)
                return { kind: 'artists', items, total: items.length }
            }

            if (f.agencyName) {
                const agencyId = await findAgencyId(f.agencyName)
                if (!agencyId) return { kind: 'artists', items: [], total: 0 }
                const { items, total } = await getArtists({ page, agency: agencyId, perPage, orderby: 'title', order: 'asc' })
                return { kind: 'artists', items, total }
            }

            if (f.role) {
                const { items, total } = await getArtists({ page, role: f.role, gender: f.gender, perPage, orderby: 'title', order: 'asc' })
                return { kind: 'artists', items, total }
            }

            const { items, total } = await getArtists({ page, perPage, orderby: 'title', order: 'asc' })
            return { kind: 'artists', items, total }
        }

        if (hub.kind === 'groups') {
            // Guias por geração ou época listavam TODOS os grupos: "4ª geração"
            // mostrava BIGBANG, 2NE1 e Baby V.O.X. O filtro por estreia já existia
            // na API (oc_debut_min/max, o mesmo de /groups?generation=).
            if (f.debutYearMin || f.debutYearMax) {
                const { items, total } = await getGroups({
                    page, perPage, orderby: 'title', order: 'asc',
                    type: f.role as 'girl_group' | 'boy_group' | 'co_ed' | 'solo' | undefined,
                    debutMin: f.debutYearMin ? `${f.debutYearMin}0101` : undefined,
                    debutMax: f.debutYearMax ? `${f.debutYearMax}1231` : undefined,
                })
                return { kind: 'groups', items, total }
            }

            if (f.agencyName) {
                const agencyId = await findAgencyId(f.agencyName)
                if (!agencyId) return { kind: 'groups', items: [], total: 0 }
                const { items, total } = await getGroups({ page, agency: agencyId, perPage, orderby: 'title', order: 'asc' })
                return { kind: 'groups', items, total }
            }

            if (f.role) {
                const { items, total } = await getGroups({ page, type: f.role as 'girl_group' | 'boy_group' | 'co_ed' | 'solo', perPage, orderby: 'title', order: 'asc' })
                return { kind: 'groups', items, total }
            }

            const { items, total } = await getGroups({ page, perPage, orderby: 'title', order: 'asc' })
            return { kind: 'groups', items, total }
        }
    } catch { /* silencioso */ }

    // O fallback precisa devolver o MESMO kind do hub, não sempre 'productions'
    // — a página consumidora (app/(site)/guias/[slug]/page.tsx) decide qual
    // prop passar (productions/artists/groups) com base em result.kind, então
    // um kind errado aqui fazia hubs de artista/grupo caírem como se não
    // tivessem nenhum item passado pro componente certo (undefined em vez de []).
    return { kind: hub.kind, items: [], total: 0 } as HubItems
}
