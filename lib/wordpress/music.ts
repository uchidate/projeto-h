import { WP_API_NAMESPACE } from '@/lib/constants/identidade.mjs'
import { WP_API_URL } from './config'
import { WP_CACHE_TAGS } from './cache'

export type MusicRelease = {
    id: number
    title: string
    slug: string
    release_type: 'album' | 'ep' | 'single' | 'compilation' | null
    release_date: string | null
    cover_url: string | null
    spotify_url: string | null
    spotify_id: string | null
    total_tracks: number
    artist_id: number
    group_id: number
}

/** Chave de agrupamento de edições: o Spotify cataloga "EYES CLOSED (with ZAYN)",
 *  "… (2x)" e "… [Bare/Unveiled]" como lançamentos distintos, e a discografia
 *  exibia a mesma capa três vezes seguidas. Remove qualificadores entre
 *  parênteses/colchetes para agrupar as edições do mesmo lançamento. */
function releaseKey(release: MusicRelease): string {
    const base = release.title
        .replace(/[([].*$/, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
    return `${release.release_type ?? ''}::${base || release.title.toLowerCase()}`
}

/** Mantém uma edição por lançamento — a de título mais curto, que é a original
 *  sem qualificador (remix, deluxe, edição estendida). */
export function dedupeReleaseEditions(releases: MusicRelease[]): MusicRelease[] {
    const canonical = new Map<string, MusicRelease>()
    for (const release of releases) {
        const key = releaseKey(release)
        const current = canonical.get(key)
        if (!current || release.title.length < current.title.length) canonical.set(key, release)
    }
    // Preserva a ordem em que a API devolveu (já vem ordenada por data).
    return releases.filter(release => canonical.get(releaseKey(release)) === release)
}

export async function getMusicReleases(params: {
    artistId?: number
    groupId?: number
    type?: string
    perPage?: number
}): Promise<MusicRelease[]> {
    const { artistId, groupId, type, perPage = 50 } = params
    if (!artistId && !groupId) return []

    const qs = new URLSearchParams({ per_page: String(perPage) })
    if (artistId) qs.set('artist_id', String(artistId))
    if (groupId) qs.set('group_id', String(groupId))
    if (type) qs.set('type', type)

    try {
        const res = await fetch(`${WP_API_URL}/${WP_API_NAMESPACE}/music-releases?${qs}`, {
            next: { revalidate: 3600, tags: [WP_CACHE_TAGS.musicReleases] },
        })
        if (!res.ok) return []
        return dedupeReleaseEditions(await res.json() as MusicRelease[])
    } catch {
        return []
    }
}

export function spotifyEmbedUrl(spotifyUrl: string): string {
    return spotifyUrl.replace('https://open.spotify.com/', 'https://open.spotify.com/embed/')
}
