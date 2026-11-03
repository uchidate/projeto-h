import type { WPTerm } from '@/lib/wordpress/types'

/**
 * Guias de produto (K-beauty, merch, comida) são "Cultura" + uma destas subcategorias. Notícia
 * e artigo editorial nunca as levam. Por isso a listagem padrão do blog as deixa de fora e elas
 * ganham aba própria: misturadas, 8 dos 12 cards mais recentes eram guias de compra e a página
 * deixava de parecer um portal de notícias.
 */
export const SLUGS_GUIA_DE_COMPRA = ['k-beauty', 'merch', 'comida'] as const

export function idsGuiaDeCompra(categorias: Pick<WPTerm, 'id' | 'slug'>[]): number[] {
    return categorias.filter(c => (SLUGS_GUIA_DE_COMPRA as readonly string[]).includes(c.slug)).map(c => c.id)
}
