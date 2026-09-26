import type { WPProduction } from '@/lib/wordpress/types'

export type MarcoDaCarreira = { ano: number; produtos: WPProduction }

/** Ano da obra: campo `year`, senão a data de lançamento, senão a de publicação. */
export function anoDaObra(prod: WPProduction): number | null {
    if (prod.acf?.year) return prod.acf.year
    const d = prod.acf?.release_date ?? prod.date
    const y = d ? parseInt(d.slice(0, 4), 10) : NaN
    return y > 1900 ? y : null
}

/**
 * As obras de entrada: nota mais alta primeiro, ano mais recente como desempate.
 * Só entram obras com pôster, porque a faixa é visual; sem imagem vira buraco.
 */
export function obrasEmDestaque(productions: readonly WPProduction[], limite = 6): WPProduction[] {
    const comPoster = productions.filter(prod => !!prod.featured_image_url || !!prod._embedded?.['wp:featuredmedia']?.length)
    // Especiais (making of, entrevistas) ficam de fora da vitrine, salvo se sobrarem obras de menos.
    const principais = comPoster.filter(prod => prod.acf?.type !== 'special')
    return (principais.length >= 3 ? principais : comPoster)
        .sort((a, b) => (b.acf?.rating ?? 0) - (a.acf?.rating ?? 0) || (anoDaObra(b) ?? 0) - (anoDaObra(a) ?? 0))
        .slice(0, limite)
}

/**
 * Marcos da linha do tempo: a obra mais antiga e as de maior nota, em ordem cronológica.
 * Menos de 4 marcos não forma uma linha do tempo, então devolve vazio.
 */
export function marcosDaCarreira(productions: readonly WPProduction[], max = 6): MarcoDaCarreira[] {
    const principais = productions.filter(prod => prod.acf?.type !== 'special')
    const comAno = (principais.length >= 4 ? principais : productions)
        .map(produtos => ({ ano: anoDaObra(produtos), produtos }))
        .filter((m): m is MarcoDaCarreira => m.ano != null)
    if (comAno.length < 4) return []
    const primeira = [...comAno].sort((a, b) => a.ano - b.ano)[0]
    const melhores = [...comAno]
        .filter(m => m !== primeira)
        .sort((a, b) => (b.produtos.acf?.rating ?? 0) - (a.produtos.acf?.rating ?? 0) || b.ano - a.ano)
        .slice(0, max - 1)
    return [primeira, ...melhores].sort((a, b) => a.ano - b.ano)
}

/**
 * Ficha magra: sem texto editorial próprio, sem obras e sem capítulos. Nela o anúncio
 * sozinho é o conteúdo mais volumoso da página, que é o padrão que o AdSense trata
 * como "conteúdo de baixo valor". Os anúncios ficam onde há o que ler.
 */
export function fichaMagra(input: { hasStoryChapters: boolean; hasAnalysis: boolean; productions: number; bioChars: number }): boolean {
    return !input.hasStoryChapters && !input.hasAnalysis && input.productions === 0 && input.bioChars < 600
}
