/**
 * Produções que não voltam ao catálogo — devolvem 410 Gone, não 404.
 *
 * A diferença importa para busca: 404 diz "talvez volte" e o Google mantém a
 * URL indexada por meses, continuando a mandar gente para o vazio. 410 diz
 * "acabou", e a remoção do índice é bem mais rápida.
 *
 * Medido em 2026-09-01: 67% das sessões de /productions caíam em 404 — 1.167
 * de 1.753 em 90 dias. Parte é conteúdo que a versão anterior do site tinha e
 * que foi deliberadamente deixado de fora; parte é lixo de importação.
 */

/**
 * Slugs gerados por um defeito do importador: título só em coreano virava slug
 * vazio no slugify (que descarta tudo fora de a-z0-9) e o WordPress inventava
 * um. São 280 URLs indexadas que nunca corresponderam a nada navegável.
 * Corrigido na origem, mas as já indexadas seguem recebendo visita.
 */
const PADRAO_LIXO_DE_IMPORTACAO = /^producao-\d+$/

/**
 * Verificadas como impróprias para o site. Lista explícita de propósito: a
 * decisão é editorial e não deve ser inferida — o sinalizador `adult` do TMDB
 * devolve `false` até para filme erótico coreano reconhecido, então não serve
 * de critério automático.
 */
const IMPROPRIAS = new Set<string>([
    'between-the-navel-and-knees',
])

export function producaoFoiRemovida(slug: string): boolean {
    return IMPROPRIAS.has(slug) || PADRAO_LIXO_DE_IMPORTACAO.test(slug)
}
