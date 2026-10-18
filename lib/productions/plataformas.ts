/**
 * Link de "onde assistir" para uma plataforma.
 *
 * Não existe URL direta do título dentro do serviço sem a API de parceiros do JustWatch,
 * então o link abre a BUSCA do serviço já com o título. Só entram os serviços cuja busca foi
 * conferida em 2026-10-18 (resposta 200 e a busca abre com o termo): Netflix, Globoplay,
 * Max, Paramount+, Apple TV e Kocowa. Prime, Disney+ e Crunchyroll bloquearam a checagem
 * ou mudaram de caminho, e os demais são nichos, então todos esses vão para a busca do
 * JustWatch, que já é a fonte creditada no cartão e lista onde assistir. Nada de adivinhar
 * URL de serviço: um link quebrado é pior que o intermediário.
 *
 * O slug é o do termo de `production_platform`.
 */
const BUSCA_DO_SERVICO: Record<string, (q: string) => string> = {
    netflix: q => `https://www.netflix.com/search?q=${q}`,
    globoplay: q => `https://globoplay.globo.com/busca/?q=${q}`,
    max: q => `https://play.max.com/search?q=${q}`,
    paramount: q => `https://www.paramountplus.com/br/search/?q=${q}`,
    'apple-tv': q => `https://tv.apple.com/br/search?term=${q}`,
    kocowa: q => `https://www.kocowa.com/en_us/search?keyword=${q}`,
}

export function linkDaPlataforma(slug: string, titulo: string): { href: string; direto: boolean } {
    const q = encodeURIComponent(titulo.trim())
    const busca = BUSCA_DO_SERVICO[slug]
    return busca
        ? { href: busca(q), direto: true }
        : { href: `https://www.justwatch.com/br/busca?q=${q}`, direto: false }
}
