import { getFeaturedStoreProducts, getStoreProducts, getStoreProductsByArtistId, type StoreProduct, type TipoVitrine } from '@/lib/wordpress/store'
import { escolherPorTema, type Tema } from '@/lib/wordpress/store-contexto'
import { ordenarPrateleira } from '@/lib/wordpress/store-ranking'

/** Vitrine geral em destaque, já ordenada por contexto. Base das faixas de loja em páginas sem produto próprio. */
export async function getVitrineGeral(contexto: string, limit = 6, tipo?: TipoVitrine): Promise<StoreProduct[]> {
    return ordenarPrateleira(await getFeaturedStoreProducts(limit, tipo), contexto)
}

/**
 * Vitrine pelo assunto da página (título, resumo, categorias): palavra do produto no texto e tema
 * (beleza, culinária, música, drama). Com menos de 3 casamentos cai na vitrine geral do tipo,
 * para a faixa não ficar vazia. Cada produto já passou por preço, imagem e link.
 */
export async function getVitrineTematica(texto: string, contexto: string, opcoes: { limit?: number; tipo?: TipoVitrine; temas?: Tema[] } = {}): Promise<StoreProduct[]> {
    const { limit = 6, tipo, temas } = opcoes
    const casados = escolherPorTema(await getStoreProducts(), { texto, temas, limite: limit })
    if (casados.length >= 3) return ordenarPrateleira(casados, contexto)
    return getVitrineGeral(contexto, limit, tipo)
}

/**
 * Produtos do elenco (até 4 artistas), intercalados para não encher a faixa com um só nome;
 * completa com a vitrine geral quando o elenco não tem produto. Nunca devolve vazio se a loja tem destaque.
 */
export async function getVitrineDoElenco(artistIds: number[], contexto: string, limit = 6, tipo: TipoVitrine = 'drama', texto = ''): Promise<StoreProduct[]> {
    const porArtista = await Promise.all(artistIds.slice(0, 4).map(id => getStoreProductsByArtistId(id)))
    const intercalados: StoreProduct[] = []
    for (let i = 0; intercalados.length < limit && porArtista.some(l => i < l.length); i++) {
        for (const lista of porArtista) if (i < lista.length) intercalados.push(lista[i])
    }
    const unicos = [...new Map(intercalados.map(p => [p.id, p])).values()]
    if (unicos.length >= 3) return ordenarPrateleira(unicos, contexto).slice(0, limit)
    // Sem produto do elenco: tenta casar pelo assunto da obra antes da vitrine geral.
    const geral = texto ? await getVitrineTematica(texto, contexto, { limit, tipo, temas: [tipo === 'drama' ? 'drama' : 'musica'] }) : await getVitrineGeral(contexto, limit, tipo)
    return [...new Map([...unicos, ...geral].map(p => [p.id, p])).values()].slice(0, limit)
}
