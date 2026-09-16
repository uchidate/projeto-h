export type SearchResultType = 'post' | 'production' | 'artist' | 'group' | 'company' | 'food'

export interface SearchResult {
    id: number
    title: string
    href: string
    type: SearchResultType
    thumbnail?: string
    /** Contexto extra, ex: "Membro de BLACKPINK" */
    subtitle?: string
}
