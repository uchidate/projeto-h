/**
 * URLs do retrato de i18n: um exemplar de cada tipo de página, em cada idioma.
 *
 * Slugs são de conteúdo estável (fichas consolidadas e artigos publicados). Se um
 * deles sair do ar, a captura mostra o status e o par deve ser trocado aqui, não
 * ignorado. `pt` é o caminho público em português (sem prefixo); `en` é o mesmo
 * conteúdo em inglês. Rota que só existe num idioma deixa o outro lado fora.
 */
export const PARES = [
    // Home
    { pt: '/', en: '/en' },
    // Institucionais
    { pt: '/about', en: '/en/about' },
    { pt: '/contato', en: '/en/contact' },
    { pt: '/ethics', en: '/en/ethics' },
    { pt: '/editorial-standards', en: '/en/editorial-standards' },
    { pt: '/corrections', en: '/en/corrections' },
    { pt: '/cultura-coreana-101', en: '/en/korean-culture-101' },
    // Listagens
    { pt: '/artists', en: '/en/artists' },
    { pt: '/groups', en: '/en/groups' },
    { pt: '/productions', en: '/en/productions' },
    { pt: '/agencies', en: '/en/agencies' },
    { pt: '/empresas', en: '/en/companies' },
    { pt: '/comidas', en: '/en/foods' },
    { pt: '/fandoms', en: '/en/fandoms' },
    { pt: '/positions', en: '/en/positions' },
    { pt: '/guias', en: '/en/guides' },
    { pt: '/blog', en: '/en/blog' },
    { pt: '/trending', en: '/en/trending' },
    { pt: '/calendario', en: '/en/calendar' },
    { pt: '/artists/birthdays', en: '/en/artists/birthdays' },
    { pt: '/quiz', en: '/en/quiz' },
    { pt: '/search', en: '/en/search' },
    // Fichas
    { pt: '/artists/jisoo-kim', en: '/en/artists/jisoo-kim' },
    { pt: '/groups/bts', en: '/en/groups/bts' },
    { pt: '/productions/the-wonderfools', en: '/en/productions/the-wonderfools' },
    { pt: '/agencies/sm-entertainment', en: '/en/agencies/sm-entertainment' },
    { pt: '/empresas/illiyoon', en: '/en/companies/illiyoon' },
    { pt: '/comidas/gochujang', en: '/en/foods/gochujang' },
    { pt: '/fandoms/army', en: '/en/fandoms/army' },
    { pt: '/positions/leader', en: '/en/positions/leader' },
    { pt: '/guias/melhores-doramas-de-todos-os-tempos', en: '/en/guides/melhores-doramas-de-todos-os-tempos' },
    // Artigos: um sem tradução (a página em EN serve o original ou 404) e um com
    { pt: '/blog/bts-na-america-do-sul-datas-e-guia-dos-14-shows', en: '/en/blog/bts-na-america-do-sul-datas-e-guia-dos-14-shows' },
    { pt: '/blog/taemin-eternal-ep-faixa-a-faixa', en: '/en/blog/taemin-eternal-ep-faixa-a-faixa' },
    // Conta
    { pt: '/entrar', en: '/en/sign-in' },
    { pt: '/cadastro', en: '/en/sign-up' },
]

/**
 * Listagens com query: exercitam o desvio `<lista>/filtrado` (rewrite). Inclui o filtro que canonicaliza
 * para a página estática de tipo, a busca e a paginação, em PT e EN.
 */
export const COM_FILTRO = [
    '/groups?page=2', '/groups?type=girl_group', '/groups?search=bts', '/groups?generation=4&active=true',
    '/en/groups?page=2',
    '/artists?page=2', '/artists?search=iu', '/artists?role=singer', '/artists?letter=K', '/en/artists?page=2',
    '/productions?page=2', '/productions?search=love', '/productions?genre=romance', '/productions?type=series', '/en/productions?page=2',
    '/blog?page=2', '/blog?category=noticias', '/blog?search=bts', '/blog?tipo=guia', '/en/blog?page=2',
    '/comidas?search=kimchi', '/comidas?category=soup_stew', '/en/foods?search=kimchi', '/guias?kind=doramas', '/en/guides?kind=doramas',
]

/** Só em português (sem versão em outro idioma por decisão do manifesto) e casos de erro. */
export const SO_PT = ['/loja', '/privacidade', '/termos', '/merch']

/** Devem responder 404 hoje e continuar assim (D3: `/pt/...` não existe como URL pública). */
export const DEVEM_DAR_404 = ['/pt', '/pt/about', '/pt/groups/bts', '/en/pagina-que-nao-existe', '/xx/about']

export function todasAsUrls() {
    const urls = new Set(SO_PT)
    for (const par of PARES) { urls.add(par.pt); urls.add(par.en) }
    for (const u of COM_FILTRO) urls.add(u)
    for (const u of DEVEM_DAR_404) urls.add(u)
    return [...urls]
}
