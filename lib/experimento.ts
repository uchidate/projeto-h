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

export function variantePorId(id: number): Variante {
    return id % 2 === 0 ? 'b' : 'a'
}
