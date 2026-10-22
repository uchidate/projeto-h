export type SearchResultType = 'post' | 'production' | 'artist' | 'group' | 'company' | 'food' | 'store_product'

export interface SearchResult {
    id: number
    title: string
    href: string
    type: SearchResultType
    thumbnail?: string
    /** Contexto extra, ex: "Membro de BLACKPINK" */
    subtitle?: string
    /** Grafia alternativa (hangul, romanizado) que casou quando o titulo nao casa. */
    alias?: string
    /** Só em store_product: marketplace do link (shopee, amazon…), para o clique registrar a mesma métrica da loja. */
    store?: string
}
