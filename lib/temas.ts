import type { CompanyIndustry } from '@/lib/wordpress/types'

/**
 * Cadastro de temas do site: onde cada pedaço de um assunto mora. Uma linha por
 * tema alimenta o item aceso do menu e a faixa de marcas e loja da listagem do
 * blog, em vez de cada página decidir por conta própria.
 */
export type TemaDoSite = {
    id: string
    rotulo: string
    /** Categoria do blog (slug) que reúne os artigos do tema. */
    categoriaBlog?: string
    /** Categorias dos produtos na loja (`acf.category`); a primeira é a da página "ver todos". */
    categoriasLoja?: string[]
    /** Setor das fichas de empresa que são as marcas do tema. */
    industria?: CompanyIndustry
}

export const TEMAS: TemaDoSite[] = [
    { id: 'k-beauty', rotulo: 'K-beauty', categoriaBlog: 'k-beauty', categoriasLoja: ['kbeauty'], industria: 'beauty' },
    // Comida: catálogo em /comidas, que é também o item "Gastronomia" do menu.
    // `alimenta` é um valor gravado por engano no lugar de `snacks` em produtos importados.
    { id: 'comida', rotulo: 'Comida', categoriaBlog: 'comida', categoriasLoja: ['snacks', 'alimenta'], industria: 'food_beverage' },
]

/** Tema que tem categoria própria no blog, loja e marcas ligadas. */
export function temasComLoja(): TemaDoSite[] {
    return TEMAS.filter(t => t.categoriaBlog && t.categoriasLoja?.length && t.industria)
}

/** A rota pertence ao item do menu: o próprio href ou o que vem depois dele. */
export function rotaPertenceAoItem(pathname: string | null | undefined, href: string): boolean {
    if (!pathname) return false
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
}
