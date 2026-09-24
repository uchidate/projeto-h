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

export function secaoFoiRemovida(pathname: string): boolean {
    return SECOES_REMOVIDAS.test(pathname)
}
