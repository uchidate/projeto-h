import { wpBuscarOpcional, wpFetchWithTotal, buildParams, wpFetchPorSlug } from './client'
import { getWPItemTag, WP_CACHE_TAGS } from './cache'
import { stripHtml } from '@/lib/utils'
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

/**
 * `chaebol_group` é texto livre (ex: "Samsung Group"), não uma relação ACF —
 * busca por título pra achar se o grupo também tem ficha própria no acervo.
 * Falha silenciosa: sem ficha do grupo, o nome só aparece sem link.
 */
export async function findCompanyByName(name: string): Promise<{ slug: string; name: string } | null> {
    try {
        const { items } = await getCompanies({ search: name, perPage: 5 })
        const match = items.find(c => stripHtml(c.title.rendered).toLowerCase() === name.toLowerCase())
        return match ? { slug: match.slug, name: stripHtml(match.title.rendered) } : null
    } catch { return null }
}

/**
 * Mesmo grupo primeiro (ex: na ficha da Samsung Electronics, mostrar Samsung
 * C&T antes de uma empresa de tech qualquer) — `chaebol_group` não tem filtro
 * na REST API, então busca um pool maior sem filtro de setor e compara no
 * cliente. Completa com o pool por setor quando o grupo não dá os `perPage`.
 */
export async function getRelatedCompanies(excludeId: number, industry?: CompanyIndustry, perPage = 6, chaebolGroup?: string | null): Promise<WPCompany[]> {
    try {
        const [pool, groupPool] = await Promise.all([
            wpBuscarOpcional<WPCompany[]>(
                `/wp/v2/company${buildParams({
                    per_page: 24, status: 'publish',
                    _fields: 'id,slug,title,featured_image_url,acf',
                    orderby: 'date', order: 'desc', exclude: excludeId,
                    oc_industry: industry ?? undefined,
                })}`,
                { revalidate: 1800, tags: [WP_CACHE_TAGS.companies] },
            ),
            chaebolGroup
                ? wpBuscarOpcional<WPCompany[]>(
                    `/wp/v2/company${buildParams({
                        per_page: 50, status: 'publish',
                        _fields: 'id,slug,title,featured_image_url,acf',
                        orderby: 'date', order: 'desc', exclude: excludeId,
                    })}`,
                    { revalidate: 1800, tags: [WP_CACHE_TAGS.companies] },
                )
                : Promise.resolve([]),
        ])
        const sameGroup = chaebolGroup
            ? groupPool.filter(c => c.acf?.chaebol_group?.trim().toLowerCase() === chaebolGroup.trim().toLowerCase())
            : []
        const seed = excludeId % (pool.length || 1)
        const resto = [...pool.slice(seed), ...pool.slice(0, seed)].filter(c => !sameGroup.some(g => g.id === c.id))
        return [...sameGroup, ...resto].slice(0, perPage)
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

/**
 * Setores que o WordPress grava com outro nome do que o código conhece.
 *
 * Medido em 2026-09-23: 3 das 67 empresas (Supernal e Boston Dynamics com
 * `technology`, Netflix Korea com `streaming`) saíam no título da página como
 * "Boston Dynamics — undefined | HallyuHub": o mapa de rótulos é
 * `Record<string, string>`, então o TypeScript não acusa chave faltando, e a
 * interpolação transformou o `undefined` em texto que o Google exibe.
 *
 * Sinônimo, e não chave nova em COMPANY_INDUSTRY_LABELS: as chaves dele viram
 * abas de filtro na listagem, e uma aba para uma empresa só não é o objetivo.
 */
const SETOR_SINONIMO: Record<string, string> = {
    technology: 'tech',
    streaming: 'media',
}

function setorNormalizado(industry?: string | null): string | null {
    if (!industry) return null
    return SETOR_SINONIMO[industry] ?? industry
}

/** Rótulo do setor, ou null se desconhecido — quem chama decide o fallback. */
export function rotuloDoSetor(industry?: string | null): string | null {
    const setor = setorNormalizado(industry)
    return setor ? (COMPANY_INDUSTRY_LABELS[setor] ?? null) : null
}

export function emojiDoSetor(industry?: string | null): string {
    const setor = setorNormalizado(industry)
    return (setor && COMPANY_INDUSTRY_EMOJI[setor]) || '🏢'
}
