import type { WPPost } from '@/lib/wordpress/types'
import { getWPTerms } from '@/lib/utils'

/**
 * Por que este artigo é sugerido depois daquele.
 *
 * Só diz o que é verdade nos dados: uma entidade (grupo, artista, produção) que
 * os dois artigos citam, ou a categoria em comum. Sem isso o rótulo vira
 * "Sugerido para você", que não explica nada e o leitor aprende a ignorar.
 * Se nada for compartilhado, devolve null e o cartão fica sem motivo em vez de
 * inventar um.
 */
export type Motivo = { texto: string; imagem: string | null }

function emComum<T extends { slug: string }>(daqui: T[] | undefined, dali: T[] | undefined): T | undefined {
    const slugs = new Set(dali?.map(e => e.slug))
    return daqui?.find(e => slugs.has(e.slug))
}

export function motivoDaSugestao(atual: WPPost, candidato: WPPost, opcoes: { categoria?: boolean } = {}): Motivo | null {
    const { categoria = true } = opcoes
    const a = atual.related_entities
    const c = candidato.related_entities
    if (a && c) {
        // Ordem de preferência: pessoa/grupo pesa mais que obra na decisão de clicar.
        const grupo = emComum(a.groups, c.groups)
        if (grupo) return { texto: `Também fala de ${grupo.name}`, imagem: grupo.image }
        const artista = emComum(a.artists, c.artists)
        if (artista) return { texto: `Também fala de ${artista.name}`, imagem: artista.image }
        const producao = emComum(a.productions, c.productions)
        if (producao) return { texto: `Também fala de ${producao.title}`, imagem: producao.image }
    }

    // Quase todo artigo do blog divide a categoria; repetida em todos os cartões ela não
    // diferencia nada. Quem chama pode restringir o motivo a entidades.
    if (!categoria) return null

    // Os relacionados vêm da API só com os ids das categorias (sem `_embedded`); os
    // nomes existem no artigo atual, que é carregado por inteiro.
    const nomes = new Map(getWPTerms(atual._embedded, 'category').map(t => [t.id, t.name]))
    const idComum = candidato.categories?.find(id => atual.categories?.includes(id) && nomes.has(id))
    return idComum !== undefined ? { texto: `Mais em ${nomes.get(idComum)}`, imagem: null } : null
}
