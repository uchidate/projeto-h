import { wpBuscarOpcional, wpFetchWithTotal, buildParams, wpFetchPorSlug } from './client'
import { getWPItemTag, WP_CACHE_TAGS } from './cache'
import type { WPCompany, CompanyIndustry } from './types'

export type CompaniesQuery = {
    page?: number
    perPage?: number
    search?: string
    orderby?: 'date' | 'title' | 'modified' | 'trending_score'
    order?: 'desc' | 'asc'
    slug?: string
    industry?: CompanyIndustry
    chaebol?: boolean
    letter?: string
}

export async function getCompanies(query: CompaniesQuery = {}) {
    const {
        page = 1, perPage = 24, search, orderby = 'date', order = 'desc',
        slug, industry, chaebol, letter,
    } = query

    const params: Record<string, string | number | boolean | undefined> = {
        page, per_page: perPage, orderby, order, status: 'publish',
        _fields: 'id,slug,title,excerpt,date,featured_image_url,acf',
        slug: slug ?? undefined,
        search: search ?? undefined,
        oc_industry: industry ?? undefined,
        oc_chaebol: chaebol ? 'true' : undefined,
        oc_letter: letter ?? undefined,
    }

    return wpFetchWithTotal<WPCompany>(`/wp/v2/company${buildParams(params)}`, {
        revalidate: 1800,
        tags: [WP_CACHE_TAGS.companies],
    })
}

export async function getCompanyBySlug(slug: string): Promise<WPCompany | null> {
    // wpFetchPorSlug e nao wpFetch: `[]` de um wpFetch com falha e
    // indistinguivel de "nao existe", e o notFound() da pagina transformava
    // um soluço do WordPress em 404 permanente aos olhos do Google.
    return wpFetchPorSlug<WPCompany>(
        `/wp/v2/company${buildParams({ slug, status: 'publish', _embed: true })}`,
        { revalidate: 1800, tags: [getWPItemTag('company', slug)] },
    )
}

export async function getCompaniesByIds(ids: number[]): Promise<WPCompany[]> {
    if (!ids.length) return []
    try {
        return await wpBuscarOpcional<WPCompany[]>(
            `/wp/v2/company${buildParams({
                include: ids.join(','),
                per_page: ids.length,
                status: 'publish',
                _fields: 'id,slug,title,featured_image_url,acf',
                orderby: 'include',
            })}`,
            { revalidate: 1800, tags: [WP_CACHE_TAGS.companies] },
        )
    } catch { return [] }
}

export async function getRelatedCompanies(excludeId: number, industry?: CompanyIndustry, perPage = 6): Promise<WPCompany[]> {
    try {
        const pool = await wpBuscarOpcional<WPCompany[]>(
            `/wp/v2/company${buildParams({
                per_page: 24, status: 'publish',
                _fields: 'id,slug,title,featured_image_url,acf',
                orderby: 'date', order: 'desc', exclude: excludeId,
                oc_industry: industry ?? undefined,
            })}`,
            { revalidate: 1800, tags: [WP_CACHE_TAGS.companies] },
        )
        const seed = excludeId % (pool.length || 1)
        return [...pool.slice(seed), ...pool.slice(0, seed)].slice(0, perPage)
    } catch { return [] }
}

export const COMPANY_INDUSTRY_LABELS: Record<string, string> = {
    tech:          'Tecnologia',
    semiconductor: 'Semicondutores',
    automotive:    'Automotivo',
    entertainment: 'Entretenimento',
    beauty:        'Beleza (K-Beauty)',
    finance:       'Finanças',
    retail:        'Varejo',
    food_beverage: 'Alimentos & Bebidas',
    gaming:        'Games',
    telecom:       'Telecomunicações',
    media:         'Mídia',
    pharma:        'Farmacêutico',
    construction:  'Construção',
    shipbuilding:  'Naval',
    chemical:      'Química',
    fashion:       'Moda',
    ecommerce:     'E-commerce',
}

export const COMPANY_INDUSTRY_EMOJI: Record<string, string> = {
    tech:          '💻',
    semiconductor: '🔬',
    automotive:    '🚗',
    entertainment: '🎤',
    beauty:        '💄',
    finance:       '🏦',
    retail:        '🛒',
    food_beverage: '🍜',
    gaming:        '🎮',
    telecom:       '📡',
    media:         '📺',
    pharma:        '💊',
    construction:  '🏗️',
    shipbuilding:  '🚢',
    chemical:      '⚗️',
    fashion:       '👗',
    ecommerce:     '📦',
}
