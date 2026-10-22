import { getCompanies } from './companies'
import { getFoods } from './foods'
import { stripHtml } from '@/lib/utils'

export type ProductLink = { type: 'company' | 'food'; slug: string; title: string }

/**
 * Índice reverso: productId (da loja) -> ficha de empresa/comida que o linkou
 * via `linked_products`. Fecha o loop que faltava — a ficha já linka pra loja,
 * mas a loja não linkava de volta pra ficha. Paginado porque companies/foods
 * já passam de 100 itens (fetch cacheado 1800s, mesmo custo de qualquer listagem).
 */
export async function getProductLinksMap(): Promise<Map<number, ProductLink>> {
    const map = new Map<number, ProductLink>()

    const [companiesPage1, foodsPage1] = await Promise.all([
        getCompanies({ perPage: 100 }),
        getFoods({ perPage: 100 }),
    ])

    const companyPages = [companiesPage1.items]
    for (let p = 2; p <= companiesPage1.totalPages; p++) {
        companyPages.push((await getCompanies({ perPage: 100, page: p })).items)
    }
    const foodPages = [foodsPage1.items]
    for (let p = 2; p <= foodsPage1.totalPages; p++) {
        foodPages.push((await getFoods({ perPage: 100, page: p })).items)
    }

    for (const c of companyPages.flat()) {
        for (const id of c.acf?.linked_products ?? []) {
            if (!map.has(id)) map.set(id, { type: 'company', slug: c.slug, title: stripHtml(c.title.rendered) })
        }
    }
    for (const f of foodPages.flat()) {
        for (const id of f.acf?.linked_products ?? []) {
            if (!map.has(id)) map.set(id, { type: 'food', slug: f.slug, title: stripHtml(f.title.rendered) })
        }
    }

    return map
}
