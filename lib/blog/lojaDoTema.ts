import { getStoreProducts } from '@/lib/wordpress/store'
import { getCompanies } from '@/lib/wordpress/companies'
import { ordenarPrateleira } from '@/lib/wordpress/store-ranking'
import { marcasComProdutos, produtosDaCategoria, type CategoriaComLoja } from '@/lib/blog/categoriaLoja'

/**
 * Marcas com produto e vitrine de um tema, para a listagem do blog e para o catálogo do tema (ex.: /comidas).
 * Falha da loja ou das marcas não derruba a página: sem dado, ela sai só com o conteúdo editorial.
 */
export async function carregarLojaDoTema(cfg: CategoriaComLoja, contexto: string) {
    try {
        const [todos, empresas] = await Promise.all([
            getStoreProducts(),
            getCompanies({ industry: cfg.industria, perPage: 100, orderby: 'title', order: 'asc' }),
        ])
        const produtos = produtosDaCategoria(todos, cfg.categoriasLoja)
        return {
            rotulo: cfg.rotulo,
            categoriaLoja: cfg.categoriasLoja[0],
            industria: cfg.industria,
            marcas: marcasComProdutos(empresas.items, produtos),
            produtos: ordenarPrateleira(produtos, contexto).slice(0, 10),
        }
    } catch {
        return undefined
    }
}
