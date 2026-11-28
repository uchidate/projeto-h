import { WP_API_URL } from '@/lib/wordpress/config'
import { stripHtml } from '@/lib/utils'

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

// A ficha de produção se regenera a cada 6 h. O Next adota o menor prazo entre as
// consultas da página: um valor menor aqui multiplicaria a regeneração das fichas.
const PRAZO_CACHE = 21600
// Bloco acessório: serviço lento não pode segurar a renderização da ficha.
const TEMPO_LIMITE_MS = 4000

async function tmdbFetch<T>(path: string): Promise<T> {
    const sep = path.includes('?') ? '&' : '?'
    const res = await fetch(`${TMDB_BASE}${path}${sep}api_key=${TMDB_API_KEY}`, {
        next: { revalidate: PRAZO_CACHE },
        signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
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

// O top 10 so mostra titulo que tem ficha no site (link para /productions). Pede
// mais que 10 ao TMDB para ter de onde preencher quando algum nao tem.
const CANDIDATOS_POR_PLATAFORMA = 20
const TAMANHO_DO_TOP = 10

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
            language: 'pt-BR',
            // Animação e infantil lideram a popularidade e não são o que o leitor da ficha procura.
            without_genres: '16,10762',
        })
        const data = await tmdbFetch<{ results: TMDBShow[] }>(`/discover/tv?${params}`)
        return data.results
            .filter(s => s.original_language === 'ko')
            .slice(0, CANDIDATOS_POR_PLATAFORMA)
            .map((s, i) => toEntry(s, i + 1))
    } catch {
        return []
    }
}

async function resolveProductionSlugs(shows: StreamingEntry[]): Promise<Map<string, { slug: string; titulo: string }>> {
    const tmdbIds = [...new Set(shows.map(s => s.tmdbId))]
    if (!tmdbIds.length) return new Map()
    try {
        // Usa filtro oc_tmdb_ids para buscar exatamente as productions dos shows
        const url = new URL(`${WP_API_URL}/wp/v2/production`)
        url.searchParams.set('oc_tmdb_ids', tmdbIds.join(','))
        url.searchParams.set('per_page', String(tmdbIds.length))
        url.searchParams.set('status', 'publish')
        url.searchParams.set('_fields', 'slug,acf,title')
        const res = await fetch(url.toString(), { next: { revalidate: PRAZO_CACHE }, signal: AbortSignal.timeout(TEMPO_LIMITE_MS) })
        if (!res.ok) return new Map()
        const productions: Array<{ slug: string; title?: { rendered?: string }; acf: { tmdb_id?: number; type?: string } }> = await res.json()
        const map = new Map<string, { slug: string; titulo: string }>()
        for (const p of productions) {
            // No TMDB, filme e série numeram à parte: o mesmo número num filme é outra obra.
            if (p.acf?.tmdb_id && p.acf.type !== 'movie') map.set(String(p.acf.tmdb_id), { slug: p.slug, titulo: stripHtml(p.title?.rendered ?? '') })
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
    for (const [source, shows] of Object.entries(out)) {
        for (const show of shows) {
            const ficha = slugMap.get(show.tmdbId)
            show.productionSlug = ficha?.slug ?? null
            // O nome que vale é o da ficha, o mesmo que a pessoa vai ver ao clicar.
            if (ficha?.titulo) show.title = ficha.titulo
        }
        // Mapa vazio = consulta ao WP falhou (ou nada bate): mantem a lista como
        // veio em vez de esvaziar a home por causa de uma falha de rede.
        if (slugMap.size === 0) {
            out[source] = shows.slice(0, TAMANHO_DO_TOP)
            continue
        }
        const comFicha = shows.filter(show => show.productionSlug)
        if (comFicha.length === 0) {
            delete out[source]
            continue
        }
        out[source] = comFicha.slice(0, TAMANHO_DO_TOP).map((show, i) => ({ ...show, rank: i + 1 }))
    }
    return out
}

// Menos que isso não forma uma fileira que valha a aba.
const MINIMO_POR_PLATAFORMA = 3

/**
 * Recorte do ranking para a ficha de produção: só o que leva a outra ficha, sem a
 * própria obra nem o que a página já recomenda.
 */
export function emAltaPara(porPlataforma: ShowsByPlatform, jaNaPagina: readonly string[]): ShowsByPlatform {
    const fora = new Set(jaNaPagina)
    const out: ShowsByPlatform = {}
    for (const [plataforma, shows] of Object.entries(porPlataforma)) {
        const uteis = shows.filter(show => show.productionSlug && !fora.has(show.productionSlug))
        if (uteis.length >= MINIMO_POR_PLATAFORMA) out[plataforma] = uteis.slice(0, TAMANHO_DO_TOP)
    }
    return out
}
