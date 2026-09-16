/**
 * Rate limit em memória por chave, para rotas públicas sem autenticação.
 *
 * Vale para um único container e reseta em deploy/restart — é teto de abuso
 * casual, não defesa distribuída. Cada janela poda as chaves vencidas: sem isso
 * o Map guarda todo IP já visto até o processo morrer.
 */

export type RateLimiter = {
    /** Registra a tentativa e devolve true quando ela passou do teto. */
    check(key: string): boolean
    /** Chaves vivas. Observável para que a poda seja testável, não estimada. */
    size(): number
    reset(): void
}

export function createRateLimiter({ max, windowMs }: { max: number; windowMs: number }): RateLimiter {
    const hits = new Map<string, number[]>()

    function prune(now: number) {
        for (const [key, timestamps] of hits) {
            if (timestamps.every(t => now - t >= windowMs)) hits.delete(key)
        }
    }

    return {
        check(key: string): boolean {
            const now = Date.now()
            prune(now)
            const timestamps = (hits.get(key) ?? []).filter(t => now - t < windowMs)
            timestamps.push(now)
            hits.set(key, timestamps)
            return timestamps.length > max
        },
        size() {
            return hits.size
        },
        reset() {
            hits.clear()
        },
    }
}
