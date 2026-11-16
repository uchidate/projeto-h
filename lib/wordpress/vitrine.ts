import { getFeaturedStoreProducts, getStoreProducts, getStoreProductsByArtistId, getStoreProductsByIds, type StoreProduct, type TipoVitrine } from '@/lib/wordpress/store'
import { escolherPorTemaComAderencia, type Tema } from '@/lib/wordpress/store-contexto'
import { candidatosDescoberta, ordenarPrateleira } from '@/lib/wordpress/store-ranking'
import { variarPorPagina } from '@/lib/wordpress/store-rotacao'

/** Tamanho do pool de onde cada página sorteia a sua vitrine de reserva. */
const POOL_DE_RESERVA = 24

/**
 * Selo "disponível na loja" nos cards de listagem: um fetch de produtos
 * reaproveitado pra todos os cards da página (`buildVitrineMatcher`), em vez
 * de uma busca por card — o mesmo matching textual de `getVitrinePorTermos`,
 * só sem reordenar por ranking (a listagem só precisa saber "tem ou não tem").
 */
export async function buildVitrineMatcher(): Promise<(termos: (string | undefined)[]) => boolean> {
    const produtos = await getStoreProducts()
    const titulos = produtos
        .filter(p => !p.acf.is_hidden && p.acf.affiliate_url && p.acf.price)
        .map(p => p.title.rendered.toLowerCase())
    return (termos: (string | undefined)[]) => {
        const palavras = termos.filter((t): t is string => !!t && t.length >= 4).map(t => t.toLowerCase())
        return palavras.length > 0 && titulos.some(titulo => palavras.some(p => titulo.includes(p)))
    }
}

/**
 * Acrescenta ao fim da lista candidatos do slot de descoberta (marcados `descoberta: true`). Falha de rede
 * nunca derruba a vitrine: sem catálogo, devolve a lista como veio.
 */
export async function comDescobertas(lista: StoreProduct[], contexto: string): Promise<StoreProduct[]> {
    if (lista.length === 0) return lista
    try {
        return [...lista, ...candidatosDescoberta(lista, await getStoreProducts(), contexto)]
    } catch {
        return lista
    }
}

/** Vitrine geral em destaque, já ordenada por contexto. Base das faixas de loja em páginas sem produto próprio. */
export async function getVitrineGeral(contexto: string, limit = 6, tipo?: TipoVitrine): Promise<StoreProduct[]> {
    // Pool maior que a faixa: cada página sorteia a sua parte (variarPorPagina), em vez de todas cortarem o mesmo topo.
    const pool = ordenarPrateleira(await getFeaturedStoreProducts(POOL_DE_RESERVA, tipo), contexto)
    return comDescobertas(variarPorPagina(pool, limit, contexto), contexto)
}

/**
 * Vitrine pelo assunto da página (título, resumo, categorias): palavra do produto no texto e tema
 * (beleza, culinária, música, drama). Com menos de 3 casamentos cai na vitrine geral do tipo,
 * para a faixa não ficar vazia. Cada produto já passou por preço, imagem e link.
 */
export async function getVitrineTematica(texto: string, contexto: string, opcoes: { limit?: number; tipo?: TipoVitrine; temas?: Tema[] } = {}): Promise<StoreProduct[]> {
    const { limit = 6, tipo, temas } = opcoes
    const casados = escolherPorTemaComAderencia(await getStoreProducts(), { texto, temas, limite: POOL_DE_RESERVA, maxPorCategoria: 8 })
    if (casados.length < 3) return getVitrineGeral(contexto, limit, tipo)
    const aderencia = new Map(casados.map(x => [x.p.id, x.aderencia]))
    const ordenados = ordenarPrateleira(casados.map(x => x.p), contexto, aderencia)
    // Palavra do produto presente na página (aderência >= 3) fica fixa na frente; quem entrou só pelo tema
    // (categoria) é sorteado por página, senão toda ficha do mesmo tema mostra os mesmos produtos.
    const fixos = ordenados.filter(p => (aderencia.get(p.id) ?? 0) >= 3).slice(0, limit)
    const doTema = ordenados.filter(p => (aderencia.get(p.id) ?? 0) < 3)
    return comDescobertas([...fixos, ...variarPorPagina(doTema, limit - fixos.length, contexto)].slice(0, limit), contexto)
}

/**
 * Produtos do elenco (até 4 artistas), intercalados para não encher a faixa com um só nome;
 * completa com a vitrine geral quando o elenco não tem produto. Nunca devolve vazio se a loja tem destaque.
 */
export async function getVitrineDoElenco(artistIds: number[], contexto: string, limit = 6, tipo: TipoVitrine = 'drama', texto = '', comidas: string[] = []): Promise<StoreProduct[]> {
    const porArtista = await Promise.all(artistIds.slice(0, 4).map(id => getStoreProductsByArtistId(id)))
    const intercalados: StoreProduct[] = []
    for (let i = 0; intercalados.length < limit && porArtista.some(l => i < l.length); i++) {
        for (const lista of porArtista) if (i < lista.length) intercalados.push(lista[i])
    }
    // Comida que aparece na obra (bloco "Comidas de …"): o produto dela entra logo depois do elenco.
    // Comida é a categoria mais clicada do site (Umami, 60 dias até 2026-11-16), inclusive em produção.
    const daObra = comidas.length > 0 ? await getVitrinePorTermos(comidas, contexto, { limit: 3 }) : []
    const unicos = [...new Map([...intercalados, ...daObra].map(p => [p.id, p])).values()]
    if (unicos.length >= 3) return comDescobertas(ordenarPrateleira(unicos, contexto).slice(0, limit), contexto)
    // Sem produto do elenco: tenta casar pelo assunto da obra antes da vitrine geral.
    const geral = texto ? await getVitrineTematica(texto, contexto, { limit, tipo, temas: [tipo === 'drama' ? 'drama' : 'musica'] }) : await getVitrineGeral(contexto, limit, tipo)
    const completo = [...new Map([...unicos, ...geral.filter(p => !p.descoberta)].map(p => [p.id, p])).values()].slice(0, limit)
    return comDescobertas(completo, contexto)
}

/**
 * Produtos que casam com o nome da ficha (comida, marca): palavra do título do produto no texto.
 * `temas` soma uma categoria inteira (ex.: culinária numa ficha de comida). Sem casamento devolve [] —
 * a ficha de uma empresa sem produto na loja não ganha prateleira alheia.
 */
export async function getVitrinePorTermos(termos: string[], contexto: string, opcoes: { limit?: number; temas?: Tema[] } = {}): Promise<StoreProduct[]> {
    const { limit = 3, temas } = opcoes
    const casados = escolherPorTemaComAderencia(await getStoreProducts(), { texto: termos.filter(Boolean).join(' '), temas, limite: limit })
    return ordenarPrateleira(casados.map(x => x.p), contexto, new Map(casados.map(x => [x.p.id, x.aderencia]))).slice(0, limit)
}

/**
 * Vitrine de ficha (comida/empresa): prioriza `linked_products` (vínculo explícito, curado à mão)
 * e só cai no matching textual (`getVitrinePorTermos`) quando a ficha não tem nenhum produto vinculado.
 */
export async function getVitrineVinculada(
    linkedProductIds: number[] | undefined,
    termos: string[],
    contexto: string,
    opcoes: { limit?: number; temas?: Tema[] } = {},
): Promise<StoreProduct[]> {
    const vinculados = await getStoreProductsByIds(linkedProductIds ?? [])
    if (vinculados.length > 0) return ordenarPrateleira(vinculados, contexto).slice(0, opcoes.limit ?? 3)
    return getVitrinePorTermos(termos, contexto, opcoes)
}
