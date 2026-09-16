/**
 * Data-Driven Testing: entidades reais e estáveis usadas pelos specs de e2e/.
 * Manter esta lista separada da lógica de teste — adicionar uma entidade aqui
 * automaticamente multiplica a cobertura dos specs parametrizados, sem duplicar
 * código de teste. Preferir slugs de longa data (baixa chance de serem removidos
 * ou renomeados) sobre itens recém-importados.
 */

export const KNOWN_ARTISTS = [
    { slug: 'jimin', label: 'Jimin (BTS)' },
    { slug: 'yuqi', label: 'Yuqi ((G)I-DLE)' },
] as const

export const KNOWN_GROUPS = [
    { slug: 'bts', label: 'BTS' },
    { slug: 'blackpink', label: 'BLACKPINK' },
] as const

export const KNOWN_PRODUCTIONS = [
    { slug: 'stars-falling-from-the-sky', label: 'Stars Falling From the Sky' },
] as const

export const KNOWN_AGENCIES = [
    { slug: 'sm-entertainment', label: 'SM Entertainment' },
] as const

export const KNOWN_FOODS = [
    { slug: 'kimchi', label: 'Kimchi' },
] as const

export const KNOWN_COMPANIES = [
    { slug: 'samsung-electronics', label: 'Samsung Electronics' },
] as const

export const KNOWN_BLOG_POSTS = [
    // Slug de um post real e estavel, passado por variavel (E2E_BLOG_POST_SLUG).
    { slug: process.env.E2E_BLOG_POST_SLUG ?? 'post-de-exemplo', label: 'Post conhecido' },
] as const

export const KNOWN_NONEXISTENT_SLUG = 'este-slug-nao-existe-nunca-vai-existir'

// Gêneros com guia editorial único e verificado (ver lib/guias/hub-lookup.ts) —
// usados para testar o canonical cruzado /productions?genre=X → /guias/*.
export const GENRE_WITH_UNIQUE_HUB = 'romance'

// Artistas duplicados mesclados em 2026-07-05 (ver next.config.mjs redirects) —
// slug antigo (post deletado) -> slug atual (post que sobreviveu à mesclagem).
// bona-2 tinha histórico real de busca (568 impressões/28d) descoberto via
// scripts/check-search-performance.py; sem redirect vira 404 e perde SEO.
export const MERGED_ARTIST_REDIRECTS = [
    { from: 'bona-2', to: 'bona' },
    { from: 'yves-loona-2', to: 'yves-loona' },
    { from: 'nana-2', to: 'nana' },
] as const
