/**
 * Rotas já migradas para a árvore única (`app/(intl)/[locale]`): o português continua SEM prefixo na URL
 * pública e é servido internamente como `/pt/...` por um rewrite gerado desta lista (next.config.mjs).
 *
 * Fonte única da migração (plano de i18n em árvore única):
 * - `pt`: caminho público em português, como em `ROUTES` (lib/i18n/routes.ts);
 * - `interno`: caminho da pasta em `app/(intl)/[locale]`, que é o caminho em inglês de `ROUTES`.
 * - `filtrado` (listagens): chaves de query por idioma que desviam para `<interno>/filtrado`. Sem filtro a página é
 *   estática (ISR); ler `searchParams` na mesma página a tornaria dinâmica (`no-store`) nos dois idiomas.
 *
 * `rotas-migradas.test.ts` confere cada entrada contra `ROUTES`, contra os arquivos (a página existe em
 * `(intl)`, declara `servePt: true` e não sobrou cópia em `(site)`), e o proxy 404 em `/pt/...` segue valendo.
 * Mover uma rota = acrescentar uma linha aqui, `servePt: true` na página e apagar a página de `(site)`.
 *
 * É `.mjs` porque `next.config.mjs` lê o arquivo direto, sem passar pelo TypeScript.
 */
export const ROTAS_MIGRADAS = [
    { pt: '/about', interno: '/about' },
    { pt: '/contato', interno: '/contact' },
    { pt: '/entrar', interno: '/sign-in' },
    { pt: '/cadastro', interno: '/sign-up' },
    { pt: '/cultura-coreana-101', interno: '/korean-culture-101' },
    { pt: '/ethics', interno: '/ethics' },
    { pt: '/editorial-standards', interno: '/editorial-standards' },
    { pt: '/corrections', interno: '/corrections' },
    {
        pt: '/groups', interno: '/groups',
        filtrado: { pt: ['search', 'page', 'type', 'active', 'letter', 'generation', 'order'], en: ['page'] },
    },
    {
        pt: '/artists', interno: '/artists',
        filtrado: { pt: ['search', 'page', 'role', 'affiliation', 'letter', 'sortBy'], en: ['page'] },
    },
    {
        pt: '/productions', interno: '/productions',
        filtrado: { pt: ['genre', 'platform', 'type', 'order', 'page', 'search'], en: ['page'] },
    },
    {
        pt: '/blog', interno: '/blog',
        filtrado: { pt: ['category', 'tag', 'page', 'search', 'order', 'tipo'], en: ['page'] },
    },
    {
        pt: '/comidas', interno: '/foods',
        filtrado: { pt: ['search', 'page', 'category', 'vegetarian', 'occasion', 'season', 'maxSpicy', 'region'], en: ['search', 'page', 'category', 'vegetarian', 'occasion', 'season', 'maxSpicy', 'region'] },
    },
    {
        pt: '/guias', interno: '/guides',
        filtrado: { pt: ['kind'], en: [] },
    },
    { pt: '/positions', interno: '/positions' },
    { pt: '/trending', interno: '/trending' },
    { pt: '/agencies', interno: '/agencies' },
    { pt: '/empresas', interno: '/companies' },
    { pt: '/fandoms', interno: '/fandoms' },
    { pt: '/calendario', interno: '/calendar' },
    { pt: '/quiz', interno: '/quiz' },
    { pt: '/search', interno: '/search' },
    { pt: '/artists/birthdays', interno: '/artists/birthdays' },
    { pt: '/artists/:slug', interno: '/artists/:slug' },
    { pt: '/productions/:slug', interno: '/productions/:slug' },
    { pt: '/fandoms/:slug', interno: '/fandoms/:slug' },
    { pt: '/positions/:position', interno: '/positions/:position' },
    { pt: '/groups/:slug', interno: '/groups/:slug' },
    { pt: '/agencies/:slug', interno: '/agencies/:slug' },
    { pt: '/empresas/:slug', interno: '/companies/:slug' },
    { pt: '/comidas/:slug', interno: '/foods/:slug' },
    {
        pt: '/guias/:slug', interno: '/guides/:slug',
        filtrado: { pt: ['page', 'genre', 'platform', 'network', 'type', 'year'], en: [] },
    },
    { pt: '/blog/:slug', interno: '/blog/:slug' },
    { pt: '/quiz/:category', interno: '/quiz/:category' },
]

/**
 * Rewrites do Next, em `beforeFiles` (vencem qualquer página do sistema de arquivos).
 *
 * A ORDEM importa: o primeiro que casa vale. Por isso os desvios por query (`/groups?page=2` ->
 * `/pt/groups/filtrado`) vêm antes dos simples (`/groups` -> `/pt/groups`), que casariam com qualquer query.
 */
export function rewritesDasRotasMigradas() {
    const desvios = ROTAS_MIGRADAS.flatMap(({ pt, interno, filtrado }) => {
        if (!filtrado) return []
        const alvos = [
            { idioma: 'pt', origem: pt, prefixo: '/pt' },
            { idioma: 'en', origem: `/en${interno}`, prefixo: '/en' },
        ]
        return alvos.flatMap(({ idioma, origem, prefixo }) =>
            (filtrado[idioma] ?? []).map((key) => ({
                source: origem,
                has: [{ type: 'query', key }],
                destination: `${prefixo}${interno}/filtrado`,
            })),
        )
    })
    // O português sai sem prefixo; o inglês já vive em `/en/...` e não precisa de rewrite simples.
    // Rotas fixas antes das com parâmetro: `/artists/birthdays` tem de casar antes de `/artists/:slug`.
    const emOrdem = [...ROTAS_MIGRADAS].sort((a, b) => Number(a.pt.includes(':')) - Number(b.pt.includes(':')))
    const simples = emOrdem.map(({ pt, interno }) => ({ source: pt, destination: `/pt${interno}` }))
    return [...desvios, ...simples]
}
