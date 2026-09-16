import { WP_API_URL } from '@/lib/wordpress/config'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMG  = 'https://image.tmdb.org/t/p/w342'

// `hex` é a cor de marca original — usada em fundos sólidos (badge de rank com texto branco), onde já
// atinge 4.5:1. `textHex` é uma variante clareada, usada só quando a cor vira texto sobre fundo escuro
// translúcido (botão de filtro ativo) — nesse caso a original não atinge 4.5:1 contra #210b0f (WCAG AA).
export const STREAMING_PLATFORMS: Record<string, { label: string; hex: string; textHex: string; providerId?: number }> = {
    netflix_br: { label: 'Netflix',     hex: '#e50914', textHex: '#ec474f', providerId: 8   },
    disney_br:  { label: 'Disney+',     hex: '#1133a0', textHex: '#7085c6', providerId: 337 },
    prime_br:   { label: 'Prime Video', hex: '#007ea9', textHex: '#00a8e1', providerId: 119 },
    apple_br:   { label: 'Apple TV+',   hex: '#555555', textHex: '#808080', providerId: 350 },
}

export const PLATFORM_ORDER = ['netflix_br', 'disney_br', 'prime_br', 'apple_br'] as const

export interface StreamingEntry {
    rank: number
    tmdbId: string
    title: string
    posterUrl: string | null
    year: number | null
    rating: number | null
    isKorean: boolean
    productionSlug?: string | null
}

export type ShowsByPlatform = Record<string, StreamingEntry[]>

interface TMDBShow {
    id: number
    name: string
    poster_path: string | null
    first_air_date?: string
    vote_average?: number
    original_language?: string
}

async function tmdbFetch<T>(path: string): Promise<T> {
    const sep = path.includes('?') ? '&' : '?'
    const res = await fetch(`${TMDB_BASE}${path}${sep}api_key=${TMDB_API_KEY}`, {
        next: { revalidate: 7200 },
    })
    if (!res.ok) throw new Error(`TMDB ${path} → ${res.status}`)
    return res.json() as Promise<T>
}

function toEntry(show: TMDBShow, rank: number): StreamingEntry {
    const year = show.first_air_date ? new Date(show.first_air_date).getFullYear() : null
    return {
        rank,
        tmdbId: String(show.id),
        title: show.name,
        posterUrl: show.poster_path ? `${TMDB_IMG}${show.poster_path}` : null,
        year: isNaN(year as number) ? null : year,
        rating: show.vote_average ?? null,
        isKorean: show.original_language === 'ko',
    }
}

async function fetchPlatform(source: string): Promise<StreamingEntry[]> {
    const cfg = STREAMING_PLATFORMS[source]
    if (!cfg?.providerId) return []
    try {
        const params = new URLSearchParams({
            with_original_language: 'ko',
            sort_by: 'popularity.desc',
            include_adult: 'false',
            with_watch_providers: String(cfg.providerId),
            watch_region: 'BR',
        })
        const data = await tmdbFetch<{ results: TMDBShow[] }>(`/discover/tv?${params}`)
        return data.results
            .filter(s => s.original_language === 'ko')
            .slice(0, 10)
            .map((s, i) => toEntry(s, i + 1))
    } catch {
        return []
    }
}

async function resolveProductionSlugs(shows: StreamingEntry[]): Promise<Map<string, string>> {
    const tmdbIds = [...new Set(shows.map(s => s.tmdbId))]
    if (!tmdbIds.length) return new Map()
    try {
        // Usa filtro oc_tmdb_ids para buscar exatamente as productions dos shows
        const url = new URL(`${WP_API_URL}/wp/v2/production`)
        url.searchParams.set('oc_tmdb_ids', tmdbIds.join(','))
        url.searchParams.set('per_page', String(tmdbIds.length))
        url.searchParams.set('status', 'publish')
        url.searchParams.set('_fields', 'slug,acf')
        const res = await fetch(url.toString(), { next: { revalidate: 600 } })
        if (!res.ok) return new Map()
        const productions: Array<{ slug: string; acf: { tmdb_id?: number } }> = await res.json()
        const map = new Map<string, string>()
        for (const p of productions) {
            if (p.acf?.tmdb_id) map.set(String(p.acf.tmdb_id), p.slug)
        }
        return map
    } catch {
        return new Map()
    }
}

export async function getStreamingTopShows(): Promise<ShowsByPlatform> {
    if (!TMDB_API_KEY) return {}
    const results = await Promise.allSettled(
        PLATFORM_ORDER.map(source => fetchPlatform(source).then(shows => ({ source, shows })))
    )
    const out: ShowsByPlatform = {}
    const allShows: StreamingEntry[] = []
    for (const r of results) {
        if (r.status === 'fulfilled' && r.value.shows.length > 0) {
            out[r.value.source] = r.value.shows
            allShows.push(...r.value.shows)
        }
    }
    // Enriquecer com slugs do WP
    const slugMap = await resolveProductionSlugs(allShows)
    for (const shows of Object.values(out)) {
        for (const show of shows) {
            show.productionSlug = slugMap.get(show.tmdbId) ?? null
        }
    }
    return out
}
