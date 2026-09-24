/**
 * Expurgo por URL do cache da Cloudflare.
 *
 * Por que existe: o HTML das páginas de conteúdo é guardado na borda por
 * `s-maxage` (300s nas fichas, do `revalidate` do Next). Nada expurgava a cópia
 * da borda quando o conteúdo mudava, então o TTL tinha de ser curto — e curto
 * demais para a cauda longa: em amostra de 40 páginas aleatórias (2026-09-24),
 * só 3 vieram do cache; o resto custou 0,8 a 2,2s contra 0,2s de um acerto.
 * Com expurgo na revalidação, o TTL pode crescer sem prender edição velha.
 *
 * Desligado sem `CLOUDFLARE_PURGE_TOKEN` e `CLOUDFLARE_ZONE_ID`: em dev, nos
 * testes e enquanto o token não existe, não faz nada. Nunca lança — roda fora
 * do ciclo da requisição, e uma rejeição solta viraria unhandled rejection.
 */

const LIMITE_POR_CHAMADA = 30 // limite da API da Cloudflare para `files`
const TIMEOUT_MS = 8000

export type DesfechoExpurgo =
    | { ok: true; purgadas: number }
    | { ok: false; reason: 'disabled' | 'no-urls' | 'http' | 'network'; detail?: string }

export async function purgarCloudflare(urls: string[]): Promise<DesfechoExpurgo> {
    const token = process.env.CLOUDFLARE_PURGE_TOKEN
    const zona = process.env.CLOUDFLARE_ZONE_ID
    if (!token || !zona) return { ok: false, reason: 'disabled' }

    const unicas = [...new Set(urls.filter((u) => /^https:\/\//.test(u)))]
    if (unicas.length === 0) return { ok: false, reason: 'no-urls' }

    let purgadas = 0
    for (let i = 0; i < unicas.length; i += LIMITE_POR_CHAMADA) {
        const lote = unicas.slice(i, i + LIMITE_POR_CHAMADA)
        try {
            const r = await fetch(`https://api.cloudflare.com/client/v4/zones/${zona}/purge_cache`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: lote }),
                signal: AbortSignal.timeout(TIMEOUT_MS),
            })
            if (!r.ok) return { ok: false, reason: 'http', detail: String(r.status) }
            purgadas += lote.length
        } catch (erro) {
            return { ok: false, reason: 'network', detail: erro instanceof Error ? erro.message : String(erro) }
        }
    }
    return { ok: true, purgadas }
}
