/**
 * Divisão de experimentos por página, sem cookie e sem risco de hidratação.
 *
 * A variante sai do `id` do conteúdo: estável entre visitas e entre servidor e
 * cliente, então a página ISR é a mesma para todo mundo e o cache do Cloudflare
 * continua valendo. O custo é que a unidade do teste é a PÁGINA, não o visitante:
 * o que difere de um conteúdo para outro (popularidade, tema) pode confundir a
 * comparação. Com centenas de páginas isso tende a se equilibrar; com poucas, não.
 *
 * Regra única e fixa (par = "b", a variante nova): mudar a regra no meio de um
 * teste embaralha as páginas entre os braços e invalida a comparação.
 */
export type Variante = 'a' | 'b'

/**
 * Teste encerrado em 2026-09-27: a variante B (nova) venceu e foi promovida
 * para 100% das páginas. Mantido como função (não inlined nos callers) para
 * não precisar tocar em cada ficha se um novo teste começar depois.
 */
export function variantePorId(_id: number): Variante {
    return 'b'
}
