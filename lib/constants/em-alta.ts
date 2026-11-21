/**
 * Selo "Em alta" de artista e grupo: a ficha teve ao menos 5 matérias nos últimos 14 dias na coleta de
 * notícias. `noticias_14d` é gravado por scripts/update-em-alta.mjs (repositório de operação), no
 * workflow "Notas do acervo". Campo próprio: o selo não depende do `trending_score`, que segue
 * ordenando a busca e a página de agência.
 */
export const EM_ALTA_MINIMO = 5

export const estaEmAlta = (noticias14d: number | null | undefined) => (noticias14d ?? 0) >= EM_ALTA_MINIMO
