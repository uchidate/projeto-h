/**
 * Marca um link compartilhado com a origem.
 *
 * Sem isto, quem chega por um link repassado no WhatsApp aparece como tráfego
 * DIRETO: o app não envia referrer. O conteúdo que mais viraliza é justamente o
 * que o relatório não enxerga.
 *
 * Preserva parâmetros existentes e não sobrescreve UTM que já esteja no link —
 * um link que já veio de campanha mantém a campanha original.
 */
export function comUtm(url: string, utm: { source: string; medium: string; campaign: string }): string {
    let alvo: URL
    try {
        alvo = new URL(url)
    } catch {
        return url
    }
    const entradas: Array<[string, string]> = [
        ['utm_source', utm.source],
        ['utm_medium', utm.medium],
        ['utm_campaign', utm.campaign],
    ]
    for (const [chave, valor] of entradas) {
        if (!alvo.searchParams.has(chave) && valor) alvo.searchParams.set(chave, valor)
    }
    return alvo.toString()
}

/** Campanha a partir do caminho: o último segmento, que é o slug do conteúdo. */
export function campanhaDoCaminho(url: string): string {
    try {
        const segmentos = new URL(url).pathname.split('/').filter(Boolean)
        return segmentos.length ? segmentos[segmentos.length - 1] : 'home'
    } catch {
        return 'desconhecido'
    }
}
