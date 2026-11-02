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
    /** Item do menu que representa o tema (`href` da navegação). */
    menuHref?: string
    /** Prefixos de rota que pertencem ao tema e acendem o `menuHref`, além do próprio href. */
    rotas?: string[]
}

export const TEMAS: TemaDoSite[] = [
    { id: 'k-beauty', rotulo: 'K-beauty', categoriaBlog: 'k-beauty', categoriasLoja: ['kbeauty'], industria: 'beauty' },
    // Comida: catálogo em /comidas e marcas em /empresas moram sob "Cultura e Gastronomia".
    // `alimenta` é um valor gravado por engano no lugar de `snacks` em produtos importados.
    { id: 'comida', rotulo: 'Comida', categoriaBlog: 'comida', categoriasLoja: ['snacks', 'alimenta'], industria: 'food_beverage', menuHref: '/cultura-coreana-101', rotas: ['/comidas', '/empresas'] },
]

/** Tema que tem categoria própria no blog, loja e marcas ligadas. */
export function temasComLoja(): TemaDoSite[] {
    return TEMAS.filter(t => t.categoriaBlog && t.categoriasLoja?.length && t.industria)
}

/** A rota pertence ao item do menu: o próprio href ou uma rota que um tema atribuiu a ele. */
export function rotaPertenceAoItem(pathname: string | null | undefined, href: string): boolean {
    if (!pathname) return false
    if (href === '/') return pathname === '/'
    const dentro = (base: string) => pathname === base || pathname.startsWith(`${base}/`)
    if (dentro(href)) return true
    return TEMAS.some(t => t.menuHref === href && (t.rotas ?? []).some(dentro))
}
