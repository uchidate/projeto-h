/**
 * Título (H1) da listagem do blog, que dependia só do rótulo dos filtros e não
 * tinha nenhum: medido em 2026-09-23, `/blog` saía sem `<h1>`, e a página
 * inteira ficava sem o título que o leitor de tela e o robô usam para saber do
 * que ela trata. O texto varia com o filtro porque `/blog?tag=x` e
 * `/blog?category=y` são páginas diferentes.
 *
 * Prioridade busca > tag > categoria: é a ordem em que o filtro mais estreita.
 */
export function tituloDoBlog({ categoria, tag, busca }: { categoria?: string; tag?: string; busca?: string }): string {
    if (busca) return `Busca por “${busca}” no blog`
    if (tag) return `Artigos com a tag ${tag}`
    if (categoria) return `Artigos sobre ${categoria}`
    return 'Blog de K-Drama, K-Pop e cultura coreana'
}
