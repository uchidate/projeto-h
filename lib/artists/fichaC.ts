import type { ProfileEntry } from '@/components/profiles/ProfileSection'
import { isInterstitial, CHAVE_DE_ANUNCIO } from '@/components/profiles/ProfileSection'

/** Grupo (aba) de cada bloco da ficha; a ordem dos grupos é a ordem da página. */
export type AbaC = 'visao' | 'carreira' | 'musica' | 'obras' | 'universo' | 'ler'
export const ORDEM_ABAS: readonly AbaC[] = ['visao', 'carreira', 'musica', 'obras', 'universo', 'ler']

const ABA_DO_BLOCO: Record<string, AbaC> = {
    biografia: 'visao', analise: 'visao', redes: 'visao',
    trajetoria: 'carreira', recordes: 'carreira', marcos: 'carreira', premios: 'carreira',
    guia: 'carreira', essencia: 'carreira', curiosidades: 'carreira',
    musica: 'musica',
    filmografia: 'obras',
    grupos: 'universo', relacionados: 'universo',
    artigos: 'ler', faq: 'ler',
}

export function abaDoBloco(id: string): AbaC | undefined {
    return ABA_DO_BLOCO[id]
}

/**
 * Reordena só os blocos (as seções), pelo grupo; os intervalos (anúncio, citação)
 * ficam onde estão. A ordem dentro de cada grupo é preservada.
 */
export function reordenarPorAba(entries: readonly ProfileEntry[]): ProfileEntry[] {
    const rank = (e: ProfileEntry) => {
        const aba = isInterstitial(e) ? undefined : ABA_DO_BLOCO[e.id]
        return aba ? ORDEM_ABAS.indexOf(aba) : ORDEM_ABAS.length
    }
    const blocos = entries.filter(e => !isInterstitial(e))
        .map((e, i) => ({ e, i }))
        .sort((a, b) => rank(a.e) - rank(b.e) || a.i - b.i)
        .map(x => x.e)
    let k = 0
    return entries.map(e => (isInterstitial(e) ? e : blocos[k++]))
}

/** Mantém no máximo `max` anúncios (os primeiros); o resto do conteúdo não muda. */
export function limitarAnuncios(entries: readonly ProfileEntry[], max = 3): ProfileEntry[] {
    let n = 0
    return entries.filter(e => {
        if (!(isInterstitial(e) && CHAVE_DE_ANUNCIO.test(e.key))) return true
        n += 1
        return n <= max
    })
}

/** Colapsa as âncoras da página nas abas: cada aba aponta para o primeiro bloco presente do grupo. */
export function abasDasAncoras(
    ids: readonly string[],
    rotulo: (aba: AbaC) => string,
): { href: string; label: string }[] {
    return ORDEM_ABAS.flatMap(aba => {
        const id = ids.find(i => ABA_DO_BLOCO[i] === aba)
        return id ? [{ href: `#${id}`, label: rotulo(aba) }] : []
    })
}
