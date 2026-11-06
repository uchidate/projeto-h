import type { StoreProduct } from '@/lib/wordpress/store'
import type { CompanyIndustry, WPCompany } from '@/lib/wordpress/types'
import { stripHtml } from '@/lib/utils'
import { temasComLoja } from '@/lib/temas'
import { intlLocale } from '@/lib/i18n/format'

/**
 * Categoria do blog que tem loja e marcas na listagem: liga o slug do blog à
 * categoria dos produtos (`acf.category`) e ao setor das empresas. Categoria
 * fora deste mapa continua só com a grade de artigos.
 */
export type CategoriaComLoja = {
    categoriasLoja: string[]
    industria?: CompanyIndustry
    rotulo: string
}

/** Derivado do cadastro de temas (lib/temas.ts): só entra tema com categoria, loja e marcas ligadas. */
export const CATEGORIAS_COM_LOJA: Record<string, CategoriaComLoja> = Object.fromEntries(
    temasComLoja().map(t => [t.categoriaBlog!, { categoriasLoja: t.categoriasLoja!, industria: t.industria, rotulo: t.rotulo }]),
)

export type MarcaDaCategoria = {
    slug: string
    nome: string
    logo: string | null
    produtos: number
}

/** Minúsculas, sem acento nem pontuação, para casar "rom&nd" com "ROM&ND" e "Dr.Althea" com "dr althea". */
function normalizar(texto: string): string {
    return ` ${texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `
}

/** Produto à venda: visível, com link e preço, numa das categorias da loja do tema. */
export function produtosDaCategoria(produtos: StoreProduct[], categoriasLoja: string[]): StoreProduct[] {
    return produtos.filter(p => !p.acf.is_hidden && p.acf.affiliate_url && p.acf.price && categoriasLoja.includes(p.acf.category ?? ''))
}

/**
 * Marcas (fichas de empresa) com pelo menos um produto da categoria. O casamento
 * é pelo nome da marca como palavra inteira no título do produto, o mesmo critério
 * da página de loja da marca; nome com menos de 4 letras não entra, para não casar
 * por acidente. Marca listada que tem ficha própria não conta para a empresa que a lista. Ordem: mais produtos primeiro, depois ordem alfabética.
 */
export function marcasComProdutos(empresas: WPCompany[], produtos: StoreProduct[]): MarcaDaCategoria[] {
    const titulos = produtos.map(p => normalizar(stripHtml(p.title.rendered)))
    const marcas: MarcaDaCategoria[] = []
    const nomes = new Set(empresas.map(e => normalizar(stripHtml(e.title.rendered))))
    for (const e of empresas) {
        const nome = stripHtml(e.title.rendered)
        // Marca listada que já tem ficha própria conta só na ficha dela (ex.: Medicube lista a APRILSKIN).
        const dosOutros = (e.acf?.global_brands ?? []).filter(b => !nomes.has(normalizar(b)))
        const termos = [nome, ...dosOutros]
            .map(normalizar)
            .filter(t => t.trim().length >= 4)
        if (termos.length === 0) continue
        const total = titulos.filter(t => termos.some(termo => t.includes(termo))).length
        if (total === 0) continue
        marcas.push({ slug: e.slug, nome, logo: e.featured_image_url ?? null, produtos: total })
    }
    return marcas.sort((a, b) => b.produtos - a.produtos || a.nome.localeCompare(b.nome, intlLocale()))
}
