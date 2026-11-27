/** A REST do WordPress recusa `per_page` acima de 100. */
const TAMANHO_DO_LOTE = 100

/**
 * Busca uma lista de ids em lotes que o WordPress aceita, sem repetir id e mantendo a ordem
 * pedida (cada consulta usa `orderby: include`). A falha de um lote rejeita a busca inteira.
 */
export async function buscarEmLotes<T>(ids: number[], buscar: (lote: number[]) => Promise<T[]>): Promise<T[]> {
    const unicos = [...new Set(ids)]
    const lotes: number[][] = []
    for (let i = 0; i < unicos.length; i += TAMANHO_DO_LOTE) lotes.push(unicos.slice(i, i + TAMANHO_DO_LOTE))
    return (await Promise.all(lotes.map(buscar))).flat()
}
