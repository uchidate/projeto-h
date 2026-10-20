import { WP_API_URL } from './config'
import { WP_CACHE_TAGS } from './cache'

/**
 * Ranking de cliques publicado pelo servidor (ops/loja/ranking-cliques.mjs) em
 * /wp-content/uploads/hh-click-ranking.json, atualizado todo dia junto com os preços.
 * Sem este arquivo (ou com ele inválido) o site cai em data/click-ranking.json, o retrato
 * que vai na imagem do deploy: o ranking nunca deixa de existir, só fica mais velho.
 *
 * Sem `node:fs` de propósito: este módulo é alcançado a partir de store.ts, que componentes
 * de cliente importam (ver o cabeçalho de store-ranking.ts).
 */
export type RankingCliques = {
    /** Score de quem ainda não tem leitura (produto novo): neutro, para não ficar atrás de quem já provou ser ignorado. */
    neutro: number
    global: Record<string, number>
    porContexto: Record<string, Record<string, number>>
}

const URL_RANKING = new URL('/wp-content/uploads/hh-click-ranking.json', WP_API_URL).toString()
const VALIDADE_MS = 10 * 60 * 1000
const NOVA_TENTATIVA_MS = 60 * 1000

let atual: RankingCliques | null = null
let proximaLeitura = 0
let emAndamento: Promise<void> | null = null

export function parseRanking(json: unknown): RankingCliques | null {
    if (!json || typeof json !== 'object') return null
    const { neutro, global, porContexto } = json as Record<string, unknown>
    if (!global || typeof global !== 'object' || Array.isArray(global)) return null
    return {
        neutro: typeof neutro === 'number' && Number.isFinite(neutro) ? neutro : 0,
        global: global as Record<string, number>,
        porContexto: porContexto && typeof porContexto === 'object' && !Array.isArray(porContexto)
            ? porContexto as Record<string, Record<string, number>>
            : {},
    }
}

/** Ranking remoto já carregado em memória, ou null (use o arquivo de reserva). */
export function rankingRemoto(): RankingCliques | null {
    return atual
}

/** Garante que o ranking remoto foi lido nos últimos 10 min. Nunca lança: falha mantém o que já havia. */
export function garantirRankingRemoto(): Promise<void> {
    if (Date.now() < proximaLeitura) return Promise.resolve()
    emAndamento ??= (async () => {
        try {
            const res = await fetch(URL_RANKING, {
                next: { revalidate: 3600, tags: [WP_CACHE_TAGS.storeProducts] },
                signal: AbortSignal.timeout(5000),
            })
            const lido = res.ok ? parseRanking(await res.json()) : null
            if (lido) {
                atual = lido
                proximaLeitura = Date.now() + VALIDADE_MS
            } else {
                proximaLeitura = Date.now() + NOVA_TENTATIVA_MS
            }
        } catch {
            proximaLeitura = Date.now() + NOVA_TENTATIVA_MS
        } finally {
            emAndamento = null
        }
    })()
    return emAndamento
}

/** Só para testes. */
export function __reiniciarRankingRemoto() {
    atual = null
    proximaLeitura = 0
    emAndamento = null
}
