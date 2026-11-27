import { calcularDesconto, parsePrecoBR, quedaDePreco, type StoreProduct } from './store'
import { ordenarPrateleira } from './store-ranking'

/** Filtros da /loja, como chegam na query string. */
export type ParamsLoja = {
    categoria?: string
    loja?: string
    busca?: string
    ofertas?: string
    queda?: string
    ordem?: string
}

export type ChaveFiltroLoja = 'categoria' | 'loja' | 'ofertas' | 'queda' | 'ordem'

/** Quantos produtos têm desconto real e quantos baixaram de preço (os números dos botões "Ofertas" e "Baixou de preço"). */
export function contarOfertasEQuedas(produtos: StoreProduct[]): { totalOfertas: number; totalQuedas: number } {
    return {
        totalOfertas: produtos.filter(p => calcularDesconto(p.acf.price, p.acf.original_price) !== null).length,
        totalQuedas: produtos.filter(p => quedaDePreco(p.acf.price, p.acf.price_history) !== null).length,
    }
}

/**
 * Aplica categoria, loja e busca; depois escolhe a ordem: queda de preço vence ofertas, que vence a
 * relevância. `ordem=menor|maior` é escolha explícita de quem compra e vence tudo; produto sem preço
 * legível vai para o fim nas duas direções.
 */
export function filtrarLoja(produtos: StoreProduct[], params: ParamsLoja): StoreProduct[] {
    let filtrados = produtos
    if (params.categoria) filtrados = filtrados.filter(p => p.acf.category === params.categoria)
    if (params.loja) filtrados = filtrados.filter(p => p.acf.store === params.loja)
    if (params.busca) {
        const q = params.busca.toLowerCase()
        filtrados = filtrados.filter(p => p.title.rendered.toLowerCase().includes(q))
    }

    if (params.queda === '1') {
        const quedas = new Map(filtrados.map(p => [p.id, quedaDePreco(p.acf.price, p.acf.price_history)]))
        filtrados = filtrados
            .filter(p => quedas.get(p.id) != null)
            .sort((a, b) => (quedas.get(b.id)?.percentual ?? 0) - (quedas.get(a.id)?.percentual ?? 0))
    } else if (params.ofertas === '1') {
        const descontos = new Map(filtrados.map(p => [p.id, calcularDesconto(p.acf.price, p.acf.original_price)]))
        filtrados = filtrados
            .filter(p => (descontos.get(p.id) ?? null) !== null)
            .sort((a, b) => (descontos.get(b.id) ?? 0) - (descontos.get(a.id) ?? 0))
    } else {
        filtrados = ordenarPrateleira(filtrados, 'loja:filtro')
    }

    if (params.ordem === 'menor' || params.ordem === 'maior') {
        const sinal = params.ordem === 'menor' ? 1 : -1
        const valor = (p: StoreProduct) => {
            const n = parsePrecoBR(p.acf.price)
            return Number.isFinite(n) ? n * sinal : Infinity
        }
        filtrados = [...filtrados].sort((a, b) => valor(a) - valor(b))
    }
    return filtrados
}

/**
 * Link de um filtro da /loja: troca `chave` por `valor` (vazio remove) e preserva os outros filtros e a
 * busca. `ofertas` e `queda` só sobrevivem quando valem '1'.
 */
export function montarHref(params: ParamsLoja, chave: ChaveFiltroLoja, valor: string): string {
    const ps = new URLSearchParams()
    if (chave !== 'categoria' && params.categoria) ps.set('categoria', params.categoria)
    if (chave !== 'loja' && params.loja) ps.set('loja', params.loja)
    if (chave !== 'ofertas' && params.ofertas === '1') ps.set('ofertas', '1')
    if (chave !== 'queda' && params.queda === '1') ps.set('queda', '1')
    if (params.busca) ps.set('busca', params.busca)
    if (chave !== 'ordem' && params.ordem) ps.set('ordem', params.ordem)
    if (valor) ps.set(chave, valor)
    const qs = ps.toString()
    return qs ? `/loja?${qs}` : '/loja'
}
