import { ALL_HUBS } from './index'
import {
    PRODUCTION_GENRE_MAP,
    PRODUCTION_PLATFORM_MAP,
    PRODUCTION_NETWORK_MAP,
    ARTIST_FILTER_MAP,
    GROUP_TYPE_MAP,
} from './hub-items'
import type { ArchiveHub } from './types'
import type { WPProduction, WPArtist, WPGroup } from '@/lib/wordpress/types'

const HUB_BY_SLUG = Object.fromEntries(ALL_HUBS.map(h => [h.slug, h]))

// Reverse maps: value → hub slugs (built from hub.filter now)
const GENRE_TO_HUB: Record<string, string[]> = {}
const PLATFORM_TO_HUB: Record<string, string[]> = {}
const NETWORK_TO_HUB: Record<string, string[]> = {}
const GROUP_TYPE_TO_HUB: Record<string, string[]> = {}

for (const hub of ALL_HUBS) {
    const f = hub.filter
    if (f.genre) {
        GENRE_TO_HUB[f.genre] ??= []
        GENRE_TO_HUB[f.genre].push(hub.slug)
    }
    if (f.platform) {
        PLATFORM_TO_HUB[f.platform] ??= []
        PLATFORM_TO_HUB[f.platform].push(hub.slug)
    }
    if (f.network) {
        NETWORK_TO_HUB[f.network] ??= []
        NETWORK_TO_HUB[f.network].push(hub.slug)
    }
    if (hub.kind === 'groups' && f.role) {
        GROUP_TYPE_TO_HUB[f.role] ??= []
        GROUP_TYPE_TO_HUB[f.role].push(hub.slug)
    }
}

// Retorna o slug do guia equivalente a um filtro de gênero puro (sem outras
// dimensões combinadas), só quando há exatamente 1 hub candidato — evita
// canonicalizar para um guia errado quando o gênero é ambíguo entre hubs.
export function getSingleGenreHubSlug(genre: string): string | undefined {
    const candidates = ALL_HUBS.filter(h => h.kind === 'productions' && h.filter.genre === genre && Object.keys(h.filter).length === 1)
    return candidates.length === 1 ? candidates[0].slug : undefined
}

// Keep map exports for any legacy consumers
export {
    PRODUCTION_GENRE_MAP,
    PRODUCTION_PLATFORM_MAP,
    PRODUCTION_NETWORK_MAP,
    ARTIST_FILTER_MAP,
    GROUP_TYPE_MAP,
}

function getBySlug(slugs: string[]): ArchiveHub[] {
    return [...new Set(slugs)].map(s => HUB_BY_SLUG[s]).filter(Boolean)
}

export function getHubsForProduction(production: WPProduction): ArchiveHub[] {
    const acf = production.acf ?? {}
    const genre = acf.genre as string | undefined
    const platform = acf.platform as string | undefined
    const network = acf.network as string | undefined
    const year = acf.year as number | undefined

    const hubSlugs: string[] = []
    if (genre)    hubSlugs.push(...(GENRE_TO_HUB[genre] ?? []))
    if (platform) hubSlugs.push(...(PLATFORM_TO_HUB[platform] ?? []))
    if (network)  hubSlugs.push(...(NETWORK_TO_HUB[network] ?? []))
    if (year) {
        const yearHub = ALL_HUBS.find(h => h.kind === 'productions' && h.filter.year === year)
        if (yearHub) hubSlugs.push(yearHub.slug)
    }

    return getBySlug(hubSlugs).slice(0, 6)
}

export function getHubsForArtist(artist: WPArtist): ArchiveHub[] {
    const roles = (artist.acf?.roles ?? []) as string[]
    const gender = artist.acf?.gender as string | undefined

    const hubSlugs: string[] = []
    for (const [hubSlug, filter] of Object.entries(ARTIST_FILTER_MAP)) {
        if (filter.role && !roles.includes(filter.role)) continue
        if (filter.gender && filter.gender !== gender) continue
        hubSlugs.push(hubSlug)
    }

    return getBySlug(hubSlugs).slice(0, 6)
}

export function getHubsForGroup(group: WPGroup): ArchiveHub[] {
    const type = group.acf?.type as string | undefined
    const hubSlugs: string[] = []

    if (type) hubSlugs.push(...(GROUP_TYPE_TO_HUB[type] ?? []))

    const memberHubs = ALL_HUBS.filter(h => h.filter.groupSlug === group.slug)
    for (const h of memberHubs) hubSlugs.push(h.slug)

    return getBySlug(hubSlugs).slice(0, 6)
}
