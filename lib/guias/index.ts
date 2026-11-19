import { getGuias as getWPGuias, type GuiaTextoWP } from '@/lib/wordpress/guias'
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

const CAMPOS_TEXTO = ['title', 'shortTitle', 'description', 'whatYouWillFind', 'seoTitle', 'seoDescription'] as const
const CAMPOS_LISTA = ['intro', 'keywords', 'faq', 'relatedSearches'] as const

/**
 * O guia do código com o texto do WordPress por cima, campo a campo. Slug, tipo e filtro são sempre os do código;
 * campo vazio ou com formato inesperado no WordPress mantém o do código (importação parcial não apaga nada).
 */
export function mesclarTexto(hub: ArchiveHub, wp?: GuiaTextoWP): ArchiveHub {
    if (!wp) return hub
    const out: ArchiveHub = { ...hub }
    for (const k of CAMPOS_TEXTO) {
        const v = wp[k]
        if (typeof v === 'string' && v.trim()) out[k] = v.trim()
    }
    for (const k of CAMPOS_LISTA) {
        const v = wp[k]
        if (Array.isArray(v) && v.length) (out as Record<string, unknown>)[k] = v
    }
    return out
}

async function textosDoWP(): Promise<Record<string, GuiaTextoWP>> {
    try {
        return Object.fromEntries((await getWPGuias()).map(g => [g.slug, g]))
    } catch {
        return {}
    }
}

/** Todos os guias do código, com o texto editorial do WordPress quando houver. */
export async function getAllHubs(): Promise<ArchiveHub[]> {
    const textos = await textosDoWP()
    return STATIC_HUBS.map(h => mesclarTexto(h, textos[h.slug]))
}

/** Um guia por slug (só os que existem no código), com o texto do WordPress quando houver. */
export async function getHub(slug: string): Promise<ArchiveHub | undefined> {
    const hub = STATIC_HUBS.find(h => h.slug === slug)
    if (!hub) return undefined
    return mesclarTexto(hub, (await textosDoWP())[slug])
}

/** GRUPOS_DE_GUIAS com o texto do WordPress, para o índice /guias. */
export async function getGruposDeGuias(): Promise<typeof GRUPOS_DE_GUIAS> {
    const textos = await textosDoWP()
    return GRUPOS_DE_GUIAS.map(({ kind, grupos }) => ({
        kind,
        grupos: grupos.map(g => ({ ...g, hubs: g.hubs.map(h => mesclarTexto(h, textos[h.slug])) })),
    }))
}

export async function getRelatedHubs(hub: ArchiveHub, limit = 6): Promise<ArchiveHub[]> {
    const all = await getAllHubs()
    const mesmoTipo = all.filter(h => h.slug !== hub.slug && h.kind === hub.kind)
    // Primeiro os irmãos da mesma lista (outras agências para um guia de agência, outros anos para um de ano); só depois o resto do tipo.
    const irmaos = new Set(GRUPOS_DE_GUIAS.flatMap(g => g.grupos).find(g => g.hubs.some(h => h.slug === hub.slug))?.hubs.map(h => h.slug) ?? [])
    return [...mesmoTipo.filter(h => irmaos.has(h.slug)), ...mesmoTipo.filter(h => !irmaos.has(h.slug))].slice(0, limit)
}

// Estrutura (slug, tipo, filtro) para código síncrono, como o hub-lookup. Texto exibido vem de getAllHubs/getHub.
export const ALL_HUBS = STATIC_HUBS
export const HUB_BY_SLUG = Object.fromEntries(STATIC_HUBS.map(h => [h.slug, h]))

export type GrupoDeGuias = { id: string; titulo: string; hubs: ArchiveHub[] }

/** Como a página /guias organiza os guias: por tipo (kind) e, dentro dele, pela lista de origem de cada guia. */
export const GRUPOS_DE_GUIAS: { kind: ArchiveHub['kind']; grupos: GrupoDeGuias[] }[] = [
    {
        kind: 'productions',
        grupos: [
            { id: 'genre', titulo: 'Por gênero e tema', hubs: productionsGenreHubs },
            { id: 'platform', titulo: 'Por plataforma', hubs: productionsPlatformHubs },
            { id: 'network', titulo: 'Por emissora', hubs: productionsNetworkHubs },
            { id: 'year', titulo: 'Por ano', hubs: productionsYearHubs },
        ],
    },
    {
        kind: 'artists',
        grupos: [
            { id: 'profile', titulo: 'Por perfil', hubs: artistsCategoriesHubs },
            { id: 'artistAgency', titulo: 'Por agência', hubs: artistsAgenciesHubs },
            { id: 'solo', titulo: 'Solistas', hubs: artistsSoloHubs },
            { id: 'members', titulo: 'Integrantes de grupos', hubs: groupsMembersHubs },
        ],
    },
    {
        kind: 'groups',
        grupos: [
            { id: 'type', titulo: 'Por tipo', hubs: groupsCategoriesHubs },
            { id: 'groupAgency', titulo: 'Por agência', hubs: groupsAgenciesHubs },
        ],
    },
]

const NOME_DO_TIPO: Record<ArchiveHub['kind'], string> = { productions: 'Produções', artists: 'Artistas', groups: 'Grupos' }

/** Rótulo curto de onde o guia mora em /guias (ex.: "Artistas · Integrantes de grupos"), para situar quem chega por busca. */
export function rotuloDoGuia(slug: string): string | undefined {
    for (const { kind, grupos } of GRUPOS_DE_GUIAS) {
        const g = grupos.find(x => x.hubs.some(h => h.slug === slug))
        if (g) return `${NOME_DO_TIPO[kind]} · ${g.titulo}`
    }
}
