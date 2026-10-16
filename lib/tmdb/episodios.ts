const TMDB_BASE = 'https://api.themoviedb.org/3'
const IMG_BASE = 'https://image.tmdb.org/t/p/w780'

export type Episodio = {
    n: number
    titulo: string
    data: string | null
    nota: number
    votos: number
    imagem: string | null
    sinopse: string
    minutos: number | null
}

type RespostaTemporada = {
    episodes?: {
        episode_number: number
        name?: string
        air_date?: string | null
        vote_average?: number
        vote_count?: number
        still_path?: string | null
        overview?: string
        runtime?: number | null
    }[]
}

/** Votos mínimos por episódio e fração de episódios que precisam atingi-lo para o painel aparecer. */
export const MIN_VOTOS = 5
export const FRACAO_MINIMA = 0.8
export const MIN_EPISODIOS = 4

export function normalizarEpisodios(resposta: RespostaTemporada): Episodio[] {
    return (resposta.episodes ?? [])
        .filter(e => Number.isFinite(e.episode_number))
        .map(e => ({
            n: e.episode_number,
            titulo: (e.name ?? '').trim(),
            data: e.air_date || null,
            nota: Math.round((e.vote_average ?? 0) * 10) / 10,
            votos: e.vote_count ?? 0,
            imagem: e.still_path ? `${IMG_BASE}${e.still_path}` : null,
            sinopse: (e.overview ?? '').trim(),
            minutos: e.runtime ?? null,
        }))
        .sort((a, b) => a.n - b.n)
}

/**
 * O painel só vale quando a nota por episódio tem amostra: com 1 voto, a barra é a opinião
 * de uma pessoa. Medido em 2026-10-15: Pousando no Amor 7–44 votos/episódio (passa),
 * Mr. Sunshine 1 voto/episódio (não passa).
 */
export function painelViavel(eps: Episodio[]): boolean {
    if (eps.length < MIN_EPISODIOS) return false
    const comAmostra = eps.filter(e => e.votos >= MIN_VOTOS && e.nota > 0).length
    return comAmostra / eps.length >= FRACAO_MINIMA
}

/**
 * Episódios da 1ª temporada (pt-BR) para o painel de notas da ficha de série.
 * `[]` sem chave, para filme, em falha ou quando a amostra de votos não sustenta o gráfico.
 * Cache de 24h (a página é ISR).
 */
export async function getEpisodios(tmdbId: number | string | undefined, tipo: string | undefined): Promise<Episodio[]> {
    const chave = process.env.TMDB_API_KEY
    if (!chave || !tmdbId || tipo === 'movie') return []
    try {
        const res = await fetch(`${TMDB_BASE}/tv/${tmdbId}/season/1?api_key=${chave}&language=pt-BR`, { next: { revalidate: 86400 } })
        if (!res.ok) return []
        const eps = normalizarEpisodios((await res.json()) as RespostaTemporada)
        return painelViavel(eps) ? eps : []
    } catch {
        return []
    }
}
