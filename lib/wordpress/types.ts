import type { EntityTranslation } from '@/lib/i18n/entity-translation'
/** Tipos base do WordPress REST API + Custom Post Types da site */

export type WPRendered = { rendered: string; protected?: boolean }

export type WPImage = {
    id: number
    source_url: string
    alt_text: string
    caption?: WPRendered
    media_details?: {
        width: number
        height: number
        sizes?: Record<string, { source_url: string; width: number; height: number }>
    }
}

// ─── Blog Post ────────────────────────────────────────────────────────────────

export type WPPost = {
    id: number
    slug: string
    status: 'publish' | 'draft' | 'private'
    date: string
    modified: string
    title: WPRendered
    content: WPRendered
    article_blocks?: import('@/lib/blog/articleModel').WPArticleBlock[] | null
    excerpt: WPRendered
    featured_media: number
    _embedded?: {
        'wp:featuredmedia'?: WPImage[]
        'wp:term'?: Array<WPTerm[]>
        author?: WPAuthor[]
    }
    featured_image_url?: string | null
    acf?: {
        reading_time?: number
        views?: number
        subtitle?: string
        quiz_embed_category?: string  // k-pop | k-drama | cultura | historia | '' → embed quiz inline
    }
    related_entities?: {
        artists: Array<{ id: number; name: string; slug: string; image: string | null; roles?: string[]; gender?: 'male' | 'female' | null; aliases?: string[]; color?: string | null }>
        productions: Array<{ id: number; title: string; slug: string; image: string | null }>
        groups: Array<{ id: number; name: string; slug: string; image: string | null; color?: string | null }>
        foods: Array<{ id: number; title: string; slug: string; image: string | null; name_korean?: string | null; category?: string | null; spicy_level?: number; is_vegetarian?: boolean }>
        companies: Array<{ id: number; title: string; slug: string; image: string | null; name_korean?: string | null; industry?: string | null; is_chaebol?: boolean }>
    }
    meta?: WPRankMathMeta
    // Categorias e tags retornadas como IDs; usar _embed para objetos
    categories: number[]
    tags: number[]
    yoast_head_json?: WPYoast
}

export type WPTerm = {
    id: number
    name: string
    slug: string
    taxonomy: 'category' | 'post_tag' | 'production_genre' | 'production_platform' | string
    count: number
}

export type WPAuthor = {
    id: number
    name: string
    slug: string
    avatar_urls?: Record<string, string>
}

// ─── Produção (drama / filme) ─────────────────────────────────────────────────

export type WPProduction = {
    id: number
    slug: string
    /** Traduções publicadas (só texto) — ver lib/i18n/entity-translation.ts. */
    translations?: Partial<Record<string, EntityTranslation>> | null
    status: 'publish' | 'draft'
    date: string
    modified: string
    title: WPRendered
    content: WPRendered
    excerpt: WPRendered
    featured_media: number
    featured_image_url?: string | null
    _embedded?: {
        'wp:featuredmedia'?: WPImage[]
        'wp:term'?: Array<WPTerm[]>
    }
    meta?: WPRankMathMeta
    acf?: {
        // Campos básicos
        original_title?: string
        subtitle?: string
        year?: number
        release_date?: string
        season_count?: number
        episodes?: number
        duration_minutes?: number
        type?: 'drama' | 'movie' | 'special' | 'variety'
        status_production?: 'airing' | 'completed' | 'upcoming'
        rating?: number              // 0-10
        age_rating?: string          // '14' | '16' | '18' | 'L'
        // Plataformas de streaming
        platforms?: string[]
        platform?: string   // plataforma primária normalizada (ex: 'Netflix')
        genre?: string      // gênero primário normalizado (ex: 'Romance', 'Thriller')
        // Elenco e equipe
        main_cast?: string
        director?: string
        writer?: string
        // Emissora / produtora
        network?: string
        // Mídias externas
        tmdb_id?: number
        trailer_url?: string
        backdrop_url?: string
        gallery_urls?: string[]
        curiosidades?: string[]
        // Contadores
        views?: number
        favorites_count?: number
        trending_score?: number
        adult_content?: boolean
    }
    production_genre?: number[]        // IDs dos termos — disponível sem _embed
    production_platform?: number[]     // IDs das plataformas — disponível sem _embed
    artist_slugs?: string[]
    production_cast?: Array<{ slug: string; role: string }>
    yoast_head_json?: WPYoast
}

// ─── Artista ──────────────────────────────────────────────────────────────────

export type AgencyAffiliation = {
    agency_id: number
    relation_type: 'managed_by' | 'represented_by' | 'distributed_by' | 'joint_venture' | string
    status: 'current' | 'former' | 'disputed' | 'announced'
    from_year?: number | null
    to_year?: number | null
    is_primary?: boolean
}

export type OrganizationRelationship = {
    organization_id: number
    relation_type: 'subsidiary_of' | 'label_of' | 'joint_venture_with' | 'division_of' | 'distributed_by' | string
    status: 'current' | 'former' | 'disputed' | 'announced'
    from_year?: number | null
    to_year?: number | null
    is_primary?: boolean
}

export type WPArtist = {
    id: number
    slug: string
    /** Traduções publicadas (só texto) — ver lib/i18n/entity-translation.ts. */
    translations?: Partial<Record<string, EntityTranslation>> | null
    status: 'publish' | 'draft'
    date: string
    modified: string
    title: WPRendered
    content: WPRendered
    featured_media: number
    featured_image_url?: string | null
    _embedded?: {
        'wp:featuredmedia'?: WPImage[]
        'wp:term'?: Array<WPTerm[]>
    }
    meta?: WPRankMathMeta
    acf?: {
        name_hangul?: string
        name_romanized?: string
        birth_date?: string
        death_date?: string          // preenchido só para artistas falecidos; congela idade e tempo de carreira
        birth_place?: string
        roles?: string[]             // ['singer', 'actor', 'dancer', ...]
        agency?: number              // ID do post de agência
        agency_affiliations?: AgencyAffiliation[]
        groups?: number[]            // IDs dos grupos
        debut_date?: string
        mbti?: string
        height?: number
        weight?: number
        instagram?: string
        twitter?: string
        youtube?: string
        mv_url?: string
        videos?: Array<{ title: string; url: string }>
        tiktok?: string
        spotify?: string
        gender?: 'male' | 'female' | null
        trending_score?: number
        popularity_score?: number
        /** Acesso real ao site (sessões no Umami), 0–100. Distinto de
         *  popularity_score, que mede interesse global pela Wikipédia. */
        access_score?: number
        wikipedia_title?: string
        streaming_score?: number
        curiosidades?: string[]
        awards?: string[]      // "ANO|CATEGORIA|TÍTULO|EVENTO"
        milestones?: string[]  // "ANO|DESCRIÇÃO"
        essencia_virada?: string
        essencia_por_que_importa?: string
        essencia_gravadora?: string
        essencia_obra_chave?: string
        essencia_marca?: string
        essencia_porta_entrada?: string
        essencia_tags?: string[]
        color?: string
        career_statement?: string
        career_statement_sub?: string
        cinematic_image?: string
        editorial_analysis?: string
        bio_quote_text?: string
        bio_quote_author?: string
        bio_quote_context?: string
        story_chapters?: Array<{
            period: string
            title: string
            description: string
            source_url: string
            entity_slug?: string
            visual_url?: string
            visual_alt?: string
            visual_credit?: string
            visual_source_url?: string
            quote_text?: string
            quote_author?: string
            quote_context?: string
            quote_source_url?: string
        }>
        key_metrics?: Array<{
            value: string
            label: string
            context?: string
            as_of?: string
            source_url?: string
        }>
    }
    videos_rest?: Array<{ title: string; url: string }>
    blood_type?: string | null
    yoast_head_json?: WPYoast
}

// ─── Grupo ────────────────────────────────────────────────────────────────────

export type WPGroup = {
    id: number
    slug: string
    /** Traduções publicadas (só texto) — ver lib/i18n/entity-translation.ts. */
    translations?: Partial<Record<string, EntityTranslation>> | null
    status: 'publish' | 'draft'
    date: string
    modified: string
    title: WPRendered
    content: WPRendered
    featured_media: number
    featured_image_url?: string | null
    _embedded?: {
        'wp:featuredmedia'?: WPImage[]
    }
    meta?: WPRankMathMeta
    acf?: {
        name_hangul?: string
        debut_date?: string
        disbandment_date?: string
        agency?: number
        agency_affiliations?: AgencyAffiliation[]
        members?: number[]           // IDs de artistas
        type?: 'girl_group' | 'boy_group' | 'co_ed' | 'solo'
        active?: boolean
        fandom_name?: string
        color?: string
        lightstick?: string
        name_meaning?: string
        instagram?: string
        twitter?: string
        youtube?: string
        mv_url?: string
        videos?: Array<{ title: string; url: string }>
        tiktok?: string
        spotify?: string
        website?: string
        curiosidades?: string[]
        trending_score?: number
        story_chapters?: Array<{
            period: string
            title: string
            description: string
            source_url: string
            entity_slug?: string
            visual_url?: string
            visual_alt?: string
            visual_credit?: string
            visual_source_url?: string
            quote_text?: string
            quote_author?: string
            quote_context?: string
            quote_source_url?: string
        }>
        key_metrics?: Array<{
            value: string
            label: string
            context?: string
            as_of?: string
            source_url?: string
        }>
    }
    videos_rest?: Array<{ title: string; url: string }>
    stats?: Array<{ label: string; value: string; description?: string }>
    editorial_analysis?: string | null
    former_member_slugs?: string[]
    member_roles?: Record<string, string>
    /** slug do artista → posições canônicas dentro do grupo (leader, main_vocal, visual, maknae, center, ...) */
    member_positions?: Record<string, string[]>
    signature_track?: { title: string; url: string } | null
    views?: number
    yoast_head_json?: WPYoast
}

// ─── Agência ──────────────────────────────────────────────────────────────────

export type WPAgency = {
    id: number
    slug: string
    status: 'publish' | 'draft'
    date: string
    modified: string
    title: WPRendered
    content: WPRendered
    excerpt: WPRendered
    featured_media: number
    featured_image_url?: string | null
    _embedded?: {
        'wp:featuredmedia'?: WPImage[]
    }
    acf?: {
        name_hangul?: string
        founded_year?: number
        ceo?: string
        leadership_updated_at?: string
        chair?: string
        founder?: string
        headquarters?: string
        region?: string
        organization_kind?: 'conglomerate' | 'label' | 'agency' | 'joint_venture' | 'division' | string
        website?: string
        artists_count?: number
        current_name_since?: number
        story_intro?: string
        organization_relationships?: OrganizationRelationship[]
        business_pillars?: Array<{
            title: string
            description: string
            source_url?: string
            visual_url?: string
            visual_alt?: string
            visual_caption?: string
            visual_credit?: string
            visual_source_url?: string
            quote_text?: string
            quote_author?: string
            quote_context?: string
            quote_source_url?: string
        }>
        story_chapters?: Array<{
            period: string
            title: string
            description: string
            source_url: string
            entity_slug?: string
            visual_url?: string
            visual_alt?: string
            visual_credit?: string
            visual_source_url?: string
            quote_text?: string
            quote_author?: string
            quote_context?: string
            quote_source_url?: string
        }>
        key_metrics?: Array<{
            value: string
            label: string
            context?: string
            as_of?: string
            source_url?: string
        }>
        current_developments?: Array<{
            date: string
            title: string
            description: string
            source_url?: string
        }>
        featured_videos?: Array<{
            title: string
            url: string
            context?: string
            badge?: string
        }>
    }
    // extra meta fields exposed via register_rest_field
    agency_type?: 'major' | 'mid' | 'indie' | string | null
    accent_color?: string | null
    country?: string | null
    milestones?: string[]       // "ANO|DESCRIÇÃO"
    achievements?: string[]
    yoast_head_json?: WPYoast
}

// ─── Company / Empresa sul-coreana ────────────────────────────────────────────

export type CompanyIndustry =
    | 'tech' | 'semiconductor' | 'automotive' | 'entertainment' | 'beauty'
    | 'finance' | 'retail' | 'food_beverage' | 'gaming' | 'telecom' | 'media'
    | 'pharma' | 'construction' | 'shipbuilding' | 'chemical' | 'fashion' | 'ecommerce'

export type WPCompany = {
    id: number
    slug: string
    status: 'publish' | 'draft'
    date: string
    modified: string
    title: WPRendered
    content: WPRendered
    excerpt: WPRendered
    featured_media: number
    featured_image_url?: string | null
    _embedded?: { 'wp:featuredmedia'?: WPImage[] }
    meta?: WPRankMathMeta
    acf?: {
        name_korean?: string       // 한국어 (ex: 삼성전자)
        name_romanized?: string    // nome global oficial
        industry?: CompanyIndustry
        headquarters?: string      // ex: "Seoul, Seocho-gu"
        founded_year?: number
        founder?: string
        ceo?: string
        employees?: number
        revenue?: string           // ex: "USD 200 bilhões (2023)"
        stock_ticker?: string      // ex: "KRX: 005930"
        website?: string
        instagram?: string
        is_chaebol?: boolean
        chaebol_group?: string     // Samsung Group | LG Group | etc.
        status?: 'active' | 'acquired' | 'bankrupt' | 'merged'
        trending_score?: number
        global_brands?: string[]
        famous_products?: string[]
        curiosidades?: string[]
    }
}

// ─── Food / Comida coreana ────────────────────────────────────────────────────

export type FoodCategory =
    | 'rice' | 'noodles' | 'soup_stew' | 'bbq' | 'pancake'
    | 'street_food' | 'banchan' | 'dessert' | 'drink' | 'snack'

export type WPFood = {
    id: number
    slug: string
    status: 'publish' | 'draft'
    date: string
    modified: string
    title: WPRendered
    content: WPRendered
    excerpt: WPRendered
    featured_media: number
    featured_image_url?: string | null
    _embedded?: {
        'wp:featuredmedia'?: WPImage[]
    }
    meta?: WPRankMathMeta
    acf?: {
        name_korean?: string       // 한국어 (ex: 비빔밥)
        name_romanized?: string    // romanização (ex: Bibimbap)
        category?: FoodCategory
        region?: string            // Seoul | Busan | Jeju | Nacional | etc.
        where_to_find?: string
        price_range?: string       // $ | $$ | $$$
        spicy_level?: number       // 0–5
        trending_score?: number
        is_vegetarian?: boolean
        is_vegan?: boolean
        main_ingredients?: string[]
        allergens?: string[]
        occasion?: string[]        // everyday | celebration | street | comfort | hangover | party
        season?: string[]          // spring | summer | fall | winter | year_round
        curiosidades?: string[]
        featured_in_dramas?: number[]  // IDs de produções
    }
}

// ─── SEO (Yoast / RankMath) ───────────────────────────────────────────────────

export type WPYoast = {
    title?: string
    description?: string
    og_title?: string
    og_description?: string
    og_image?: Array<{ url: string; width: number; height: number }>
    canonical?: string
    robots?: Record<string, string>
}

export type WPRankMathMeta = {
    rank_math_focus_keyword?: string
    rank_math_title?: string
    rank_math_description?: string
    rank_math_analyzer_score?: string
    rank_math_readability_score?: string
}
