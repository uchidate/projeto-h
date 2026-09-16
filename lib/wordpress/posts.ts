import { wpBuscarOpcional, wpFetchWithTotal, buildParams, wpFetchPorSlug } from './client'
import { getWPItemTag, WP_CACHE_TAGS } from './cache'
import type { WPPost, WPTerm } from './types'

export type PostsQuery = {
    page?: number
    perPage?: number
    category?: string   // slug da categoria
    categoryId?: number // ID direto (sem lookup)
    tag?: string        // slug da tag
    search?: string
    orderby?: 'date' | 'modified' | 'title' | 'menu_order'
    order?: 'desc' | 'asc'
    slug?: string
    excludeId?: number
    includeIds?: number[]
    /** posts que citam uma entidade específica (link no conteúdo ou meta related_*_slugs) — mais preciso que `search` por nome */
    mentionsType?: 'artist' | 'group' | 'production'
    mentionsSlug?: string
    /** Listagens de cartões não precisam transferir o HTML integral do artigo. */
    includeContent?: boolean
}

export async function getPosts(query: PostsQuery = {}) {
    const { page = 1, perPage = 12, category, categoryId, tag, search, orderby = 'date', order = 'desc', slug, excludeId, includeIds, mentionsType, mentionsSlug, includeContent = true } = query
    const params: Record<string, string | number | boolean | undefined> = {
        page, per_page: perPage, orderby, order, status: 'publish',
        _fields: includeContent
            ? 'id,slug,title,date,excerpt,content,featured_image_url,acf,categories'
            : 'id,slug,title,date,excerpt,featured_image_url,acf,categories',
        slug: slug ?? undefined, search: search ?? undefined,
        exclude: excludeId ?? undefined,
        include: includeIds?.length ? includeIds.join(',') : undefined,
        oc_mentions_type: mentionsType ?? undefined,
        oc_mentions_slug: mentionsType ? mentionsSlug : undefined,
    }
    if (categoryId) {
        params.categories = categoryId
    } else if (category) {
        const cats = await wpBuscarOpcional<WPTerm[]>(`/wp/v2/categories${buildParams({ slug: category, per_page: 1 })}`, { revalidate: 3600 })
        if (cats[0]) params.categories = cats[0].id
    }
    if (tag) {
        const tags = await wpBuscarOpcional<WPTerm[]>(`/wp/v2/tags${buildParams({ slug: tag, per_page: 1 })}`, { revalidate: 3600 })
        if (tags[0]) params.tags = tags[0].id
    }
    return wpFetchWithTotal<WPPost>(`/wp/v2/posts${buildParams(params)}`, {
        revalidate: 300, tags: [WP_CACHE_TAGS.posts],
    })
}

export async function getPostBySlug(slug: string): Promise<WPPost | null> {
    // wpFetchPorSlug e nao wpFetch: `[]` de um wpFetch com falha e
    // indistinguivel de "nao existe", e o notFound() da pagina transformava
    // um soluço do WordPress em 404 permanente aos olhos do Google.
    return wpFetchPorSlug<WPPost>(
        `/wp/v2/posts${buildParams({ slug, status: 'publish', _embed: true })}`,
        { revalidate: 300, tags: [getWPItemTag('post', slug)] },
    )
}

export async function getCategories() {
    const categories = await wpBuscarOpcional<WPTerm[]>(`/wp/v2/categories${buildParams({
        per_page: 100, hide_empty: true, orderby: 'count', order: 'desc',
    })}`, { revalidate: 3600, tags: [WP_CACHE_TAGS.categories] })
    return categories.filter(c => c.slug !== 'uncategorized')
}

export async function getTags() {
    return wpBuscarOpcional<WPTerm[]>(
        `/wp/v2/tags${buildParams({ per_page: 100, hide_empty: true, orderby: 'count', order: 'desc' })}`,
        { revalidate: 3600, tags: [WP_CACHE_TAGS.tags] },
    )
}

const RELATED_FIELDS = 'id,slug,title,date,excerpt,featured_image_url,acf,categories,tags,related_entities'

export async function getRelatedPosts(post: WPPost, limit = 4): Promise<WPPost[]> {
    const tagIds = post.tags ?? []
    const catIds = post.categories ?? []

    const [tagResults, catResults] = await Promise.all([
        tagIds.length > 0
            ? wpFetchWithTotal<WPPost>(`/wp/v2/posts${buildParams({
                per_page: 20, status: 'publish', tags: tagIds.join(','),
                exclude: post.id, _fields: RELATED_FIELDS,
              })}`, { revalidate: 300, tags: [WP_CACHE_TAGS.posts] })
            : Promise.resolve({ items: [] as WPPost[], total: 0 }),
        catIds.length > 0
            ? wpFetchWithTotal<WPPost>(`/wp/v2/posts${buildParams({
                per_page: 20, status: 'publish', categories: catIds.join(','),
                exclude: post.id, _fields: RELATED_FIELDS,
              })}`, { revalidate: 300, tags: [WP_CACHE_TAGS.posts] })
            : Promise.resolve({ items: [] as WPPost[], total: 0 }),
    ])

    // Deduplicate
    const seen = new Set<number>()
    const candidates: WPPost[] = []
    for (const p of [...tagResults.items, ...catResults.items]) {
        if (!seen.has(p.id)) { seen.add(p.id); candidates.push(p) }
    }

    // Score: mesmo grupo protagonista pesa mais que tag/categoria — "mais sobre
    // esse grupo" é mais relevante pro leitor do que só compartilhar assunto.
    const tagSet = new Set(tagIds)
    const catSet = new Set(catIds)
    const groupSlugSet = new Set((post.related_entities?.groups ?? []).map(g => g.slug))
    return candidates
        .map(p => {
            const sharedTags = (p.tags ?? []).filter(t => tagSet.has(t)).length
            const sharedCats = (p.categories ?? []).filter(c => catSet.has(c)).length
            const sharedGroups = groupSlugSet.size > 0
                ? (p.related_entities?.groups ?? []).filter(g => groupSlugSet.has(g.slug)).length
                : 0
            return { p, score: sharedGroups * 6 + sharedTags * 3 + sharedCats }
        })
        .sort((a, b) => b.score - a.score || new Date(b.p.date).getTime() - new Date(a.p.date).getTime())
        .slice(0, limit)
        .map(s => s.p)
}

/**
 * Posts para a barra lateral do blog: os 5 imediatamente APÓS a página atual.
 *
 * Antes buscava sempre os mais recentes, o que deixava o bloco olhando para
 * trás: na página 2 ele listava exatamente os primeiros cards da página 1, por
 * onde o leitor acabara de passar. Ancorar no offset da página faz o bloco
 * apontar sempre para conteúdo ainda não visto — que é o que "continue no
 * arquivo" promete. Na última página o offset ultrapassa o total, a resposta
 * vem vazia e o bloco simplesmente não aparece.
 */
export async function getSidebarPosts(currentPage = 1, perPage = 13) {
    return wpBuscarOpcional<WPPost[]>(
        `/wp/v2/posts${buildParams({ per_page: 5, offset: currentPage * perPage, status: 'publish', orderby: 'date', order: 'desc', _fields: 'id,slug,title,date,acf,featured_image_url,categories' })}`,
        { revalidate: 300, tags: [WP_CACHE_TAGS.posts] },
    )
}
