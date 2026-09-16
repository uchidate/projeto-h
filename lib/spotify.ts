/** Spotify Client Credentials API helper */
import { unstable_cache } from 'next/cache'

async function fetchToken(): Promise<string> {
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    if (!clientId || !clientSecret) throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set')
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials',
    })
    if (!res.ok) throw new Error(`Spotify token error: ${res.status}`)
    const d = await res.json() as { access_token: string }
    return d.access_token
}

// Token cached for 50 min (expires_in is 3600s)
const getToken = unstable_cache(fetchToken, ['spotify-token'], { revalidate: 3000 })

async function spotifyGet<T>(path: string): Promise<T> {
    const token = await getToken()
    const res = await fetch(`https://api.spotify.com/v1${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 86400 }, // 24h cache per endpoint
    })
    if (res.status === 401) {
        // Token may have expired mid-request; let Next.js revalidate on next call
        throw new Error(`Spotify 401 on ${path}`)
    }
    if (!res.ok) throw new Error(`Spotify API error ${res.status}: ${path}`)
    return res.json() as Promise<T>
}

export interface SpotifyAlbum {
    id: string
    name: string
    album_type: 'album' | 'single' | 'compilation'
    release_date: string
    total_tracks: number
    images: { url: string; width: number; height: number }[]
    external_urls: { spotify: string }
}

export interface SpotifyTrack {
    id: string
    name: string
    track_number: number
    duration_ms: number
    external_urls: { spotify: string }
    preview_url: string | null
}

export async function getArtistAlbums(spotifyArtistId: string): Promise<SpotifyAlbum[]> {
    const all: SpotifyAlbum[] = []
    let path: string | null = `/artists/${spotifyArtistId}/albums?limit=50&include_groups=album,single,compilation&market=BR`
    while (path) {
        const page: { items: SpotifyAlbum[]; next: string | null } = await spotifyGet(path)
        all.push(...page.items)
        path = page.next ? page.next.replace('https://api.spotify.com/v1', '') : null
    }
    // Deduplicate by normalized name (keeps first occurrence, which is most recent)
    const seen = new Set<string>()
    return all.filter(a => {
        const key = a.name.toLowerCase().replace(/\s*\(.*?\)/g, '').trim()
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

export async function getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
    const page = await spotifyGet<{ items: SpotifyTrack[] }>(`/albums/${albumId}/tracks?limit=50&market=BR`)
    return page.items
}

export function extractSpotifyArtistId(url: string): string | null {
    try {
        const u = new URL(url)
        if (u.hostname !== 'open.spotify.com') return null
        const m = u.pathname.match(/\/artist\/([A-Za-z0-9]+)/)
        return m ? m[1] : null
    } catch { return null }
}
