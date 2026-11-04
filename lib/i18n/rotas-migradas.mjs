/**
 * Rotas já migradas para a árvore única (`app/(intl)/[locale]`): o português continua SEM prefixo na URL
 * pública e é servido internamente como `/pt/...` por um rewrite gerado desta lista (next.config.mjs).
 *
 * Fonte única da migração (plano de i18n em árvore única):
 * - `pt`: caminho público em português, como em `ROUTES` (lib/i18n/routes.ts);
 * - `interno`: caminho da pasta em `app/(intl)/[locale]`, que é o caminho em inglês de `ROUTES`.
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
    { pt: '/ethics', interno: '/ethics' },
    { pt: '/editorial-standards', interno: '/editorial-standards' },
    { pt: '/corrections', interno: '/corrections' },
]

/** Rewrites do Next: `/contato` -> `/pt/contact`. Vão em `beforeFiles` para vencer qualquer página do sistema de arquivos. */
export function rewritesDasRotasMigradas() {
    return ROTAS_MIGRADAS.map(({ pt, interno }) => ({ source: pt, destination: `/pt${interno}` }))
}
