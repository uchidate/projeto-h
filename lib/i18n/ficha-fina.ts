/**
 * Ficha traduzida com pouco texto próprio.
 *
 * A ficha em outro idioma só existe com tradução publicada e entra no índice.
 * Quando o texto traduzido é só uma frase solta (e o resto é a lista de
 * produções, igual em qualquer idioma), a página é conteúdo raso e vai para
 * `noindex`: segue acessível e com links seguidos, mas não compete no índice.
 */
const MINIMO_DE_CARACTERES = 200

export function fichaFina(html: string): boolean {
    const semSecao = html.replace(/<div class="hh-secao">[\s\S]*$/, '')
    const texto = semSecao.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim()
    return texto.length < MINIMO_DE_CARACTERES
}
