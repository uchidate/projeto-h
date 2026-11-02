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
    /** Setor das fichas de empresa que são as marcas do tema; sem ele o tema não tem faixa de marcas. */
    industria?: CompanyIndustry
}

export const TEMAS: TemaDoSite[] = [
    { id: 'k-beauty', rotulo: 'K-beauty', categoriaBlog: 'k-beauty', categoriasLoja: ['kbeauty'], industria: 'beauty' },
    // Comida: catálogo em /comidas, que é também o item "Gastronomia" do menu.
    // `alimenta` é um valor gravado por engano no lugar de `snacks` em produtos importados.
    { id: 'comida', rotulo: 'Comida', categoriaBlog: 'comida', categoriasLoja: ['snacks', 'alimenta'], industria: 'food_beverage' },
    // Merch de K-pop: sem marcas (o fã compra do grupo, não de fabricante), só artigos e prateleira.
    { id: 'merch', rotulo: 'Merch', categoriaBlog: 'merch', categoriasLoja: ['lightstick', 'photocard', 'kpop_album'] },
]

/** Tema que tem categoria própria no blog e produtos da loja ligados. */
export function temasComLoja(): TemaDoSite[] {
    return TEMAS.filter(t => t.categoriaBlog && t.categoriasLoja?.length)
}

/** A rota pertence ao item do menu: o próprio href ou o que vem depois dele. */
export function rotaPertenceAoItem(
    pathname: string | null | undefined,
    href: string,
    categoriaBlog?: string | null,
): boolean {
    if (!pathname) return false
    if (href === '/') return pathname === '/'
    // /blog?category=comida é a vitrine do tema, não "Notícias": o pathname não traz a query.
    if (href === '/blog' && categoriaBlog && TEMAS.some(t => t.categoriaBlog === categoriaBlog)) return false
    return pathname === href || pathname.startsWith(`${href}/`)
}
