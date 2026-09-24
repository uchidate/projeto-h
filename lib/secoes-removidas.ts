/**
 * Seções inteiras que saíram do site — devolvem 410 Gone, não 404.
 *
 * Mesma razão de `producoes-removidas.ts`: 404 diz "talvez volte" e o robô
 * continua tentando; 410 diz "acabou".
 *
 * `/news/<id>`: o CMS anterior publicava notícias com id no lugar do slug. A
 * seção foi excluída, mas os robôs seguiram rastreando as URLs. Medido em
 * 2026-09-23 no log do proxy (72h): o PetalBot recebeu 1.420 respostas 404 em
 * `/news/<id>`, quase todas de URLs distintas.
 *
 * `/admin/…`: painel do sistema anterior (`/admin/productions/<id>?returnTo=…`).
 * O site atual não tem rota `/admin` (a administração é o WordPress, em outro
 * host). Medido no mesmo log: 13 visitas do Googlebot, todas 404.
 *
 * O prefixo é exato de propósito: `/news` e `/admin`, ou o que vem abaixo, com
 * idioma opcional. Não pega `/newsletter`, `/administracao` nem
 * `sitemap-news.xml`.
 *
 * Diferença real de 410 para 404: pequena. O Google trata os dois de forma
 * parecida no longo prazo; o 410 costuma tirar a URL do índice um pouco antes.
 */
const SECOES_REMOVIDAS = /^(?:\/[a-z]{2})?\/(?:news|admin)(?:\/|$)/

/**
 * IDs do CMS anterior no lugar do slug: `/artists/cmm178193012a01ntl8dnug9e`.
 * São cuids (`cm` + 20 ou mais caracteres a-z0-9); slug de verdade é palavra com
 * hífen. Medido em 2026-09-23 no log do proxy (72h): 720 respostas 404 a robôs
 * nesse formato, em artistas, produções e grupos.
 *
 * Falso positivo é o risco (410 numa página viva a tira do índice), então o
 * padrão foi conferido contra todas as URLs dos sitemaps: 8.798 URLs, nenhuma
 * casa. Refaça essa conferência se o formato de slug mudar.
 */
const IDS_ANTIGOS = /^(?:\/[a-z]{2})?\/(?:artists|productions|groups|agencies|empresas|companies|comidas)\/cm[a-z0-9]{20,}\/?$/

export function secaoFoiRemovida(pathname: string): boolean {
    return SECOES_REMOVIDAS.test(pathname) || IDS_ANTIGOS.test(pathname)
}
