import type { WPProduction } from '@/lib/wordpress/types'

/**
 * Ficha magra de produção: texto curto E sem elenco, curiosidades, trailer e galeria.
 * Aí o anúncio seria a maior parte da página, padrão que o AdSense trata como
 * "conteúdo de baixo valor". A sinopse mora no corpo do post, então corpo curto sozinho
 * não basta: uma produção com pouco texto mas com elenco e trailer não é magra.
 *
 * Medido em 2026-09-26: 151 de 4.129 produções (3,7%), 0,8% das visualizações humanas.
 */
export function producaoMagra(production: WPProduction): boolean {
    const acf = production.acf ?? {}
    const corpo = (production.content?.rendered ?? '').length
    return corpo < 600
        && !(production.production_cast?.length)
        && !(acf.curiosidades && acf.curiosidades.length)
        && !acf.trailer_url
        && !(acf.gallery_urls && acf.gallery_urls.length)
}
