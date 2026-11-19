import { getFeaturedStoreProducts, getStoreProducts, getStoreProductsByArtistId, getStoreProductsByIds, type StoreProduct, type TipoVitrine } from '@/lib/wordpress/store'
import { escolherPorTemaComAderencia, type Tema } from '@/lib/wordpress/store-contexto'
import { candidatosDescoberta, ordenarPrateleira } from '@/lib/wordpress/store-ranking'
import { variarPorPagina } from '@/lib/wordpress/store-rotacao'
import { alternarFamilias, CATEGORIAS_MARATONA, citaAObra, montarPrateleiraDaObra, type PrateleiraDaObra } from '@/lib/wordpress/prateleira-obra'

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

/**
 * Vitrine geral em destaque, já ordenada por contexto. Base das faixas de loja em páginas sem produto próprio.
 * `semente` separa o sorteio do contexto: as fichas medem o clique como 'artista:fallback' (um contexto só,
 * para o ranking ter volume), mas cada ficha precisa da sua parte do pool.
 */
export async function getVitrineGeral(contexto: string, limit = 6, tipo?: TipoVitrine, semente = contexto): Promise<StoreProduct[]> {
    // Pool maior que a faixa: cada página sorteia a sua parte (variarPorPagina), em vez de todas cortarem o mesmo topo.
    const pool = ordenarPrateleira(await getFeaturedStoreProducts(POOL_DE_RESERVA, tipo), contexto)
    return comDescobertas(variarPorPagina(pool, limit, semente), contexto)
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
 * Comida e petisco para maratonar, sorteados por página entre os mais clicados e alternados por tipo
 * (lámen, doce, salgadinho, tempero). Reserva das páginas de dorama: comida tem o maior clique por produto.
 */
export async function getVitrineMaratona(contexto: string, limit = 6): Promise<StoreProduct[]> {
    const validos = (await getStoreProducts()).filter(p => !p.acf.is_hidden && p.acf.affiliate_url && p.acf.price && p.acf.image_url
        && (CATEGORIAS_MARATONA as readonly string[]).includes(p.acf.category ?? ''))
    return alternarFamilias(variarPorPagina(ordenarPrateleira(validos, contexto).slice(0, POOL_DE_RESERVA), limit * 2, contexto, limit * 2)).slice(0, limit)
}

/**
 * Prateleira da ficha de produção: o que aparece na obra (produto das comidas da ficha, produto com o
 * título da obra), depois o elenco e, para completar, comida e petisco para maratonar, sorteados por
 * página entre os mais clicados. Cada produto volta com o motivo, que vira o selo do cartão.
 */
export async function getPrateleiraDaObra(
    entrada: { tituloObra: string; artistIds: number[]; comidas: string[]; contexto: string; limit?: number },
): Promise<PrateleiraDaObra> {
    const { tituloObra, artistIds, comidas, contexto, limit = 6 } = entrada
    const [catalogo, porArtista, daComida] = await Promise.all([
        getStoreProducts(),
        Promise.all(artistIds.slice(0, 4).map(id => getStoreProductsByArtistId(id))),
        comidas.length > 0 ? getVitrinePorTermos(comidas, contexto, { limit: 3 }) : Promise.resolve([]),
    ])
    const validos = catalogo.filter(p => !p.acf.is_hidden && p.acf.affiliate_url && p.acf.price && p.acf.image_url)
    const comTitulo = ordenarPrateleira(validos.filter(p => citaAObra(p, tituloObra)), contexto)
    const elenco: StoreProduct[] = []
    for (let i = 0; porArtista.some(l => i < l.length); i++) {
        for (const lista of porArtista) if (i < lista.length) elenco.push(lista[i])
    }
    const petiscos = ordenarPrateleira(validos.filter(p => (CATEGORIAS_MARATONA as readonly string[]).includes(p.acf.category ?? '')), contexto)
    return montarPrateleiraDaObra({
        naObra: [...daComida, ...comTitulo],
        elenco: ordenarPrateleira(elenco, contexto),
        // Pool dos mais clicados, sorteado por ficha: senão toda série mostra os mesmos três lámens.
        // Depois alterna lámen, doce, salgadinho e tempero (as categorias da loja não separam).
        maratona: alternarFamilias(variarPorPagina(petiscos.slice(0, POOL_DE_RESERVA), limit * 2, contexto, limit * 2)),
    }, limit)
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
