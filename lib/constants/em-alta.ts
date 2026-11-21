/**
 * Selo "Em alta" de artista e grupo: a ficha teve ao menos 5 matérias nos últimos 14 dias na coleta de
 * notícias. `noticias_14d` é gravado por scripts/update-em-alta.mjs (repositório de operação), no
 * workflow "Notas do acervo". Campo próprio: o selo não depende do `trending_score`, que segue
 * ordenando a busca e a página de agência.
 */
export const EM_ALTA_MINIMO = 5

export const estaEmAlta = (noticias14d: number | null | undefined) => (noticias14d ?? 0) >= EM_ALTA_MINIMO

/** As fichas com mais notícias recentes, só as que passam do mínimo do selo; mesma ordem estável da entrada nos empates. */
export function maisNoticiadas<T extends { acf?: { noticias_14d?: number | null } | unknown[] }>(itens: T[], limite: number): T[] {
    const n = (x: T) => (Array.isArray(x.acf) ? 0 : (x.acf?.noticias_14d ?? 0))
    return itens.filter(x => estaEmAlta(n(x))).sort((a, b) => n(b) - n(a)).slice(0, limite)
}
