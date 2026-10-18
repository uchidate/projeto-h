const TMDB_BASE = 'https://api.themoviedb.org/3'

export type Avaliacao = { nota: number; votos: number }

/**
 * Votos mínimos para a nota valer como opinião do público. Mesma lógica das notas por
 * episódio (MIN_VOTOS em episodios.ts): com 1 voto a "nota" é a opinião de uma pessoa.
 * Medido em 2026-10-18: Our Beautiful Summer tem 10,0 com 1 voto no TMDB; já High School
 * Return of a Gangster tem 8,5 com 116.
 */
export const MIN_VOTOS_NOTA = 10

export type ConfiancaDaNota = 'sem-votos' | 'poucos-votos' | 'confiavel'

export function confiancaDaNota(votos: number): ConfiancaDaNota {
    if (votos <= 0) return 'sem-votos'
    return votos < MIN_VOTOS_NOTA ? 'poucos-votos' : 'confiavel'
}

/** Puro e testável: resposta crua do TMDB → nota e votos, ou null sem nota alguma. */
export function interpretarAvaliacao(resposta: { vote_average?: number; vote_count?: number }): Avaliacao | null {
    const votos = Math.max(0, Math.trunc(resposta.vote_count ?? 0))
    const nota = resposta.vote_average ?? 0
    if (!Number.isFinite(nota) || nota <= 0 || votos <= 0) return null
    return { nota: Math.round(nota * 10) / 10, votos }
}

/**
 * Nota e número de votos do TMDB. O catálogo guarda só a nota (ACF `rating`), sem votos,
 * e sem eles não dá para distinguir 8,5 com 116 votos de 10,0 com 1.
 * `null` sem chave, em falha ou sem votos: a página cai para a nota guardada.
 * Cache de 24h (a página é ISR).
 */
export async function getAvaliacao(tmdbId: number | string | undefined, tipo: string | undefined): Promise<Avaliacao | null> {
    const chave = process.env.TMDB_API_KEY
    if (!chave || !tmdbId) return null
    const caminho = tipo === 'movie' ? 'movie' : 'tv'
    try {
        const res = await fetch(`${TMDB_BASE}/${caminho}/${tmdbId}?api_key=${chave}`, { next: { revalidate: 86400 } })
        if (!res.ok) return null
        return interpretarAvaliacao((await res.json()) as { vote_average?: number; vote_count?: number })
    } catch {
        return null
    }
}
