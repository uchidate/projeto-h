/**
 * Tipo da página a partir do caminho.
 *
 * Métrica por URL exata espalha o sinal em milhares de linhas (cada artigo,
 * cada ficha) e nenhuma tem volume para conclusão. Agrupar por TIPO responde o
 * que decide: "fichas de artista estão lentas", "listagem do blog segura menos".
 */
const TIPOS: Array<[RegExp, string]> = [
    [/^\/$/, 'home'],
    [/^\/blog\/[^/]+/, 'artigo'],
    [/^\/blog\/?$/, 'listagem-blog'],
    [/^\/productions\/[^/]+/, 'ficha-producao'],
    [/^\/productions\/?$/, 'listagem-producoes'],
    [/^\/artists\/[^/]+/, 'ficha-artista'],
    [/^\/artists\/?$/, 'listagem-artistas'],
    [/^\/groups\/[^/]+/, 'ficha-grupo'],
    [/^\/groups\/?$/, 'listagem-grupos'],
    [/^\/guias(\/|$)/, 'guia'],
    [/^\/search(\/|$)/, 'busca'],
    [/^\/quiz(\/|$)/, 'quiz'],
    [/^\/(entrar|cadastro)(\/|$)/, 'conta'],
    [/^\/(dashboard|perfil|minhas-listas|conquistas)(\/|$)/, 'area-logada'],
]

export function tipoDePagina(caminho: string): string {
    for (const [padrao, tipo] of TIPOS) if (padrao.test(caminho)) return tipo
    return 'outra'
}
