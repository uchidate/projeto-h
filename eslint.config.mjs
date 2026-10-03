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
        // Texto de interface não fica literal no JSX (D12/E em docs/I18N-V2.md): vai
        // para messages/<idioma>/ e entra por next-intl. Catraca: a lista só cresce —
        // pasta nova entra aqui quando seu texto for extraído, e nunca sai. Cobre só
        // JSXText; atributos (aria-label, placeholder) e constantes ficam para revisão.
        // Repete a regra do segue-header porque `no-restricted-syntax` não soma entre
        // blocos: o último que casa o arquivo vence.
        files: ['components/i18n/**/*.tsx', 'components/layout/**/*.tsx', 'components/auth/**/*.tsx', 'components/institucional/**/*.tsx', 'components/home/**/*.tsx'],
        ignores: ['components/ui/BarraAncorada.tsx', '**/*.test.tsx'],
        rules: {
            'no-restricted-syntax': ['error', {
                selector: "Literal[value=/\\bsegue-header\\b/]",
                message: 'Use <BarraAncorada> em vez da classe segue-header — ela encapsula o contrato de --site-header-h/--reading-bar-h.',
            }, {
                selector: "TemplateElement[value.raw=/\\bsegue-header\\b/]",
                message: 'Use <BarraAncorada> em vez da classe segue-header — ela encapsula o contrato de --site-header-h/--reading-bar-h.',
            }, {
                selector: "JSXText[value=/[A-Za-zÀ-ÿ]{2,}/]",
                message: 'Texto literal em JSX: mova para messages/<idioma>/ e use next-intl (ver CONVENCOES.md, "Textos de interface").',
            }],
        },
    },
    {
        // Fronteiras entre camadas (ver CONVENCOES.md). Dependência só desce:
        // app -> components -> lib. Uma regra por camada, para a mensagem dizer o porquê.
        files: ['components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
        ignores: ['**/*.test.{ts,tsx}'],
        rules: {
            'no-restricted-imports': ['error', {
                patterns: [{
                    group: ['@/app/*', '**/app/(site)/*', '**/app/(intl)/*'],
                    message: 'components/ e lib/ não importam de app/. Tipos e funções usados por páginas e componentes vão em lib/<dominio>/.',
                }],
            }],
        },
    },
    {
        files: ['components/ui/**/*.{ts,tsx}'],
        ignores: ['**/*.test.{ts,tsx}'],
        rules: {
            'no-restricted-imports': ['error', {
                patterns: [{
                    group: ['@/app/*', ...['features', 'artists', 'groups', 'productions', 'blog', 'home', 'agency', 'fandoms', 'quiz', 'food'].map(d => `@/components/${d}/*`)],
                    message: 'components/ui é o genérico: não pode depender de uma entidade. Se precisa de algo da entidade, receba por props.',
                }],
            }],
        },
    },
    {
        files: ['lib/**/*.{ts,tsx}'],
        ignores: ['**/*.test.{ts,tsx}'],
        rules: {
            'no-restricted-imports': ['error', {
                patterns: [{
                    group: ['@/app/*', '@/components/*'],
                    message: 'lib/ não importa de components/ nem de app/ (a dependência só desce: app -> components -> lib).',
                }],
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
