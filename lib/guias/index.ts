import { getGuias as getWPGuias, getGuia as getWPGuia } from '@/lib/wordpress/guias'
import { productionsGenreHubs } from './productions-genre'
import { productionsPlatformHubs } from './productions-platform'
import { productionsNetworkHubs } from './productions-network'
import { productionsYearHubs } from './productions-year'
import { artistsCategoriesHubs } from './artists-categories'
import { artistsAgenciesHubs } from './artists-agencies'
import { artistsSoloHubs } from './artists-solo'
import { groupsCategoriesHubs } from './groups-categories'
import { groupsAgenciesHubs } from './groups-agencies'
import { groupsMembersHubs } from './groups-members'
import type { ArchiveHub } from './types'

export type { ArchiveHub, ArchiveHubKind, ArchiveHubFilter } from './types'

const STATIC_HUBS: ArchiveHub[] = [
    ...productionsGenreHubs,
    ...productionsPlatformHubs,
    ...productionsNetworkHubs,
    ...productionsYearHubs,
    ...artistsCategoriesHubs,
    ...artistsAgenciesHubs,
    ...artistsSoloHubs,
    ...groupsCategoriesHubs,
    ...groupsAgenciesHubs,
    ...groupsMembersHubs,
]

/** Retorna todos os guias — WP primeiro, fallback nos estáticos. */
export async function getAllHubs(): Promise<ArchiveHub[]> {
    try {
        const wpGuias = await getWPGuias()
        if (wpGuias.length > 0) return wpGuias
    } catch { /* silencioso — usa fallback */ }
    return STATIC_HUBS
}

/** Retorna um guia por slug — WP primeiro, fallback estático. */
export async function getHub(slug: string): Promise<ArchiveHub | undefined> {
    try {
        const wpGuia = await getWPGuia(slug)
        if (wpGuia) return wpGuia
    } catch { /* silencioso */ }
    return STATIC_HUBS.find(h => h.slug === slug)
}

export async function getRelatedHubs(hub: ArchiveHub, limit = 6): Promise<ArchiveHub[]> {
    const all = await getAllHubs()
    return all.filter(h => h.slug !== hub.slug && h.kind === hub.kind).slice(0, limit)
}

// Manter compat com código síncrono existente (será removido após migração completa)
export const ALL_HUBS = STATIC_HUBS
export const HUB_BY_SLUG = Object.fromEntries(STATIC_HUBS.map(h => [h.slug, h]))

export type GrupoDeGuias = { titulo: string; hubs: ArchiveHub[] }

/** Como a página /guias organiza os guias: por tipo (kind) e, dentro dele, pela lista de origem de cada guia. */
export const GRUPOS_DE_GUIAS: { kind: ArchiveHub['kind']; grupos: GrupoDeGuias[] }[] = [
    {
        kind: 'productions',
        grupos: [
            { titulo: 'Por gênero e tema', hubs: productionsGenreHubs },
            { titulo: 'Por plataforma', hubs: productionsPlatformHubs },
            { titulo: 'Por emissora', hubs: productionsNetworkHubs },
            { titulo: 'Por ano', hubs: productionsYearHubs },
        ],
    },
    {
        kind: 'artists',
        grupos: [
            { titulo: 'Por perfil', hubs: artistsCategoriesHubs },
            { titulo: 'Por agência', hubs: artistsAgenciesHubs },
            { titulo: 'Solistas', hubs: artistsSoloHubs },
            { titulo: 'Integrantes de grupos', hubs: groupsMembersHubs },
        ],
    },
    {
        kind: 'groups',
        grupos: [
            { titulo: 'Por tipo', hubs: groupsCategoriesHubs },
            { titulo: 'Por agência', hubs: groupsAgenciesHubs },
        ],
    },
]
