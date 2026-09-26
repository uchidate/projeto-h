/**
 * Ficha magra: sem texto editorial próprio, sem obras e sem capítulos. Nela o anúncio
 * sozinho é o conteúdo mais volumoso da página, que é o padrão que o AdSense trata
 * como "conteúdo de baixo valor". Os anúncios ficam onde há o que ler.
 */
export function fichaMagra(input: { hasStoryChapters: boolean; hasAnalysis: boolean; productions: number; bioChars: number }): boolean {
    return !input.hasStoryChapters && !input.hasAnalysis && input.productions === 0 && input.bioChars < 600
}
