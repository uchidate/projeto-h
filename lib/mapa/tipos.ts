export interface NoMapa {
    href: string
    label: string
    img?: string | null
    tipo: 'grupo' | 'artista' | 'obra'
    /** Anel do nó. Padrão: obras fora, o resto dentro. */
    anel?: 'dentro' | 'fora'
}
