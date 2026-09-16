import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

export default defineConfig([
    ...nextVitals,
    ...nextTypeScript,
    {
        rules: {
            // Desligada ao criar app/(intl)/[locale] (docs/I18N-ARQUITETURA.md, D2).
            // A regra monta um regex por rota trocando colchetes de forma gulosa:
            // `/[locale]/artists/[slug]` vira um padrão que casa com qualquer
            // caminho e acusa todo <a href="/..."> do site. E ela já não protegia
            // antes: 12 <a> internos passavam sem aviso.
            '@next/next/no-html-link-for-pages': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            }],
        },
    },
    {
        // A classe `segue-header` é o contrato de ancoramento das barras fixas.
        // Escrevê-la à mão exige lembrar de `--site-header-h`, `--reading-bar-h`
        // e de nunca animar `top` — e em 2026-09-11 dois componentes esqueceram:
        // a barra de tags ficou pairando no meio da capa e o card sugerido usou
        // um `92` fixo que ficou errado. `BarraAncorada` existe para que isso
        // não dependa de memória; esta regra impede o caminho de volta.
        files: ['components/**/*.tsx', 'app/**/*.tsx'],
        ignores: ['components/ui/BarraAncorada.tsx', '**/*.test.tsx'],
        rules: {
            'no-restricted-syntax': ['error', {
                selector: "Literal[value=/\\bsegue-header\\b/]",
                message: 'Use <BarraAncorada> em vez da classe segue-header — ela encapsula o contrato de --site-header-h/--reading-bar-h.',
            }, {
                selector: "TemplateElement[value.raw=/\\bsegue-header\\b/]",
                message: 'Use <BarraAncorada> em vez da classe segue-header — ela encapsula o contrato de --site-header-h/--reading-bar-h.',
            }],
        },
    },
    {
        files: ['**/*.{js,cjs}'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    {
        files: ['scripts/**/*.{js,cjs,mjs,ts}'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
    {
        files: ['tailwind.config.ts'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    globalIgnores([
        '**/.next/**',
        '**/node_modules/**',
        '.claude/**',
        '.agents/**',
        '.codex/**',
        '.obsidian/**',
        '**/out/**',
        '**/build/**',
        '**/coverage/**',
        '**/next-env.d.ts',
        // Operacao montada pelo CI a partir do repositorio privado: nao e app.
        '.operacao/**',
        'scripts/**',
        'wordpress/**',
        'wp-plugins/**',
        'ops/**',
        'skills/**',
        'docs/**',
        'infra/**',
        'config/**',
    ]),
])
