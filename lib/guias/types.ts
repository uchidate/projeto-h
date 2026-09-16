export type ArchiveHubKind = 'artists' | 'groups' | 'productions'

export type ArchiveHubFilter = {
    genre?: string       // WP genre slug (ex: 'romance', 'comedia')
    tag?: string         // WP production_tag slug (sub-gênero temático, ex: 'medico', 'escola')
    platform?: string    // nome da plataforma (ex: 'Netflix', 'Disney+')
    network?: string     // canal (ex: 'SBS', 'tvN', 'JTBC')
    type?: 'drama' | 'movie' | 'special' | 'variety'
    year?: number
    role?: string        // 'singer' | 'actor' | 'idol' | 'model' | 'girl_group' | 'boy_group'
    gender?: 'male' | 'female'
    groupSlug?: string
    agencyName?: string
    /** Ano de estreia (inclusive). Guias por geração/época; ver lib/constants/generations.ts. */
    debutYearMin?: number
    debutYearMax?: number
}

export type ArchiveHub = {
    slug: string
    kind: ArchiveHubKind
    title: string
    shortTitle: string
    description: string
    intro: string[]
    keywords: string[]
    faq: Array<{ question: string; answer: string }>
    filter: ArchiveHubFilter
    whatYouWillFind?: string
    relatedSearches?: Array<{ label: string; href: string }>
}

export const SINGER_ROLE_TERMS = ['cantor', 'cantora', 'singer', 'vocalist', 'rapper', 'idol']
export const ACTOR_ROLE_TERMS = ['ator', 'atriz', 'actor', 'actress']
