/**
 * Fronteiras entre camadas do app. `npm run quality:boundaries` falha o CI se alguém quebrar uma.
 *
 * O que traz de novo em relação ao ESLint (`no-restricted-imports`, ver CONVENCOES.md):
 *  - `sem-ciclos`: o ESLint não enxerga ciclo entre módulos.
 *  - as regras de camada olham o caminho RESOLVIDO, então um import relativo (`../../app/x`)
 *    não escapa do padrão `@/app/*` do ESLint. Mesma intenção, segunda trava.
 *
 * Medição de 2026-11-02: 917 módulos, zero ciclos, zero violações; as regras protegem o que já vale.
 * Para afrouxar uma regra, justifique no PR; para uma fronteira nova, acrescente a regra aqui e rode o comando.
 */
const DE_PRODUCAO = { pathNot: '\\.test\\.(ts|tsx)$' }

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
    forbidden: [
        {
            name: 'sem-ciclos',
            comment: 'Ciclo entre módulos esconde acoplamento e quebra a ordem de carga.',
            severity: 'error',
            from: {},
            to: { circular: true },
        },
        {
            name: 'lib-nao-importa-components',
            comment: 'lib/ é a base (dados, regras, utilidades); não pode depender da camada de UI.',
            severity: 'error',
            from: { path: '^lib/', ...DE_PRODUCAO },
            to: { path: '^components/' },
        },
        {
            name: 'lib-nao-importa-app',
            comment: 'lib/ não conhece rotas.',
            severity: 'error',
            from: { path: '^lib/', ...DE_PRODUCAO },
            to: { path: '^app/' },
        },
        {
            name: 'components-nao-importa-app',
            comment: 'Componente reutilizável não pode depender de uma rota; passe por props ou lib/.',
            severity: 'error',
            from: { path: '^components/', ...DE_PRODUCAO },
            to: { path: '^app/' },
        },
    ],
    options: {
        doNotFollow: { path: 'node_modules' },
        tsConfig: { fileName: 'tsconfig.json' },
        exclude: { path: '(^|/)(node_modules|\\.next|e2e|\\.operacao|graphify-out)(/|$)' },
    },
}
