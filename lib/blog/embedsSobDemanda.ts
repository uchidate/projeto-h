/**
 * Adia o carregamento dos players do Spotify: o `src` vira `data-src` e o componente
 * `EmbedsSobDemanda` o devolve quando o player chega perto da tela. Sem isso, o navegador
 * puxa os players de ~1.250 px abaixo da dobra (mediu-se 67 requisições a Spotify/YouTube antes da
 * primeira rolagem no artigo do AMORTAGE) e cada player traz scripts e imagens próprios.
 */
export function adiarEmbedsSpotify(html: string): string {
    return html.replace(/(<iframe\b[^>]*?)\ssrc="(https:\/\/open\.spotify\.com\/embed\/[^"]+)"/gi, '$1 data-src="$2"')
}
