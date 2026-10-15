const TMDB_BASE = 'https://api.themoviedb.org/3'
const IMG_BASE = 'https://image.tmdb.org/t/p/w780'

type RespostaImagens = {
    backdrops?: { file_path: string; iso_639_1: string | null; vote_average?: number; width?: number }[]
}

/**
 * Puro e testável: escolhe até `max` cenas. Prefere imagens sem texto (sem idioma),
 * pois legenda/título embutido em outro idioma polui a galeria; ordena por nota.
 */
export function escolherCenas(resposta: RespostaImagens, max = 6): string[] {
    const todas = (resposta.backdrops ?? []).filter(b => b.file_path)
    const semTexto = todas.filter(b => !b.iso_639_1)
    const base = semTexto.length >= 3 ? semTexto : todas
    return [...base]
        .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
        .slice(0, max)
        .map(b => `${IMG_BASE}${b.file_path}`)
}

/**
 * Cenas da produção no TMDB para a galeria quando o catálogo não tem fotos.
 * `[]` sem chave, em falha ou sem imagens. Cache de 24h (página é ISR).
 */
export async function getCenas(tmdbId: number | string | undefined, tipo: string | undefined): Promise<string[]> {
    const chave = process.env.TMDB_API_KEY
    if (!chave || !tmdbId) return []
    const caminho = tipo === 'movie' ? 'movie' : 'tv'
    try {
        const res = await fetch(`${TMDB_BASE}/${caminho}/${tmdbId}/images?api_key=${chave}&include_image_language=null`, { next: { revalidate: 86400 } })
        if (!res.ok) return []
        return escolherCenas((await res.json()) as RespostaImagens)
    } catch {
        return []
    }
}
