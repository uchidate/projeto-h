const TMDB_BASE = 'https://api.themoviedb.org/3'

/** Regiões que vale mostrar, em ordem de prioridade: onde o fã brasileiro de fato consegue chegar. */
const REGIOES_RELEVANTES = ['US', 'KR', 'JP', 'GB', 'CA', 'AU'] as const

export interface DisponibilidadeForaDoBrasil {
    regiao: string
    provedores: string[]
}

export interface Disponibilidade {
    /** Provedores no Brasil (assinatura, grátis ou com anúncio). Vazio = não há. */
    brasil: string[]
    /** Onde existe fora do Brasil, já limitado e ordenado. */
    fora: DisponibilidadeForaDoBrasil[]
}

type RespostaTmdb = {
    results?: Record<string, { flatrate?: { provider_name: string }[]; free?: { provider_name: string }[]; ads?: { provider_name: string }[] }>
}

/**
 * Variantes do mesmo serviço que o TMDB lista à parte: "Amazon Prime Video with Ads" ao lado
 * de "Amazon Prime Video", e "Channel K Amazon Channel" (assinatura avulsa dentro da Amazon).
 * Para o leitor são o mesmo lugar ou ruído.
 */
const VARIANTE = /(\bwith ads$|\bamazon channel$|\bapple tv channel$)/i

function nomes(r: NonNullable<RespostaTmdb['results']>[string] | undefined): string[] {
    if (!r) return []
    const todos = [...(r.flatrate ?? []), ...(r.free ?? []), ...(r.ads ?? [])].map(p => p.provider_name)
    const principais = todos.filter(n => !VARIANTE.test(n))
    return [...new Set(principais.length > 0 ? principais : todos)]
}

/** Puro e testável: transforma a resposta crua do TMDB em disponibilidade. Sem nenhuma região = sem informação (null). */
export function interpretarProvedores(resposta: RespostaTmdb): Disponibilidade | null {
    const regioes = resposta.results ?? {}
    if (Object.keys(regioes).length === 0) return null
    const fora: DisponibilidadeForaDoBrasil[] = []
    for (const regiao of REGIOES_RELEVANTES) {
        const provedores = nomes(regioes[regiao]).slice(0, 4)
        if (provedores.length > 0) fora.push({ regiao, provedores })
    }
    return { brasil: nomes(regioes.BR), fora: fora.slice(0, 3) }
}

/**
 * Onde assistir segundo o TMDB (dados do JustWatch: exibir com a atribuição).
 *
 * `null` quando não há chave, a chamada falha ou o TMDB não conhece nenhuma
 * região: sem informação não vira "indisponível no Brasil". Cache de 24h, pois
 * o catálogo dos streamings muda devagar e a página é ISR.
 */
export async function getDisponibilidade(tmdbId: number | string | undefined, tipo: string | undefined): Promise<Disponibilidade | null> {
    const chave = process.env.TMDB_API_KEY
    if (!chave || !tmdbId) return null
    const caminho = tipo === 'movie' ? 'movie' : 'tv'
    try {
        const res = await fetch(`${TMDB_BASE}/${caminho}/${tmdbId}/watch/providers?api_key=${chave}`, { next: { revalidate: 86400 } })
        if (!res.ok) return null
        return interpretarProvedores((await res.json()) as RespostaTmdb)
    } catch {
        return null
    }
}
