# Convenções de código

Resumo de onde cada coisa vai. O que está marcado como **(lint)** é cobrado por
`eslint.config.mjs`; o resto é combinado e vale em revisão.

## Camadas

```
app/  ->  components/  ->  lib/
```

A dependência só desce. **(lint)**

- `app/` roteia, lê params, chama o carregamento de dados e compõe. Não guarda
  tipo nem função que outra camada precise.
- `components/` desenha. Recebe dados prontos por props.
- `lib/` é regra, acesso a dados e utilitário. Não importa de `components/` nem
  de `app/`.
- `components/ui/` é o genérico (botão, input, card base): não depende de nenhuma
  entidade. **(lint)**

## Onde mora cada coisa

| O que é | Onde |
|---|---|
| Peça reutilizável de uma entidade (card, filtro, seção) | `components/<entidade>/` |
| Página inteira montada para mais de uma rota | `components/features/` |
| Peça usada por **uma** rota só | `app/<rota>/components/` |
| Dados e regra de **uma** rota só | `app/<rota>/lib/` |
| Regra ou acesso a dados compartilhado | `lib/<dominio>/` |
| Genérico sem entidade | `components/ui/` |

Regra de decisão: comece pela pasta da rota. Só suba para `components/<entidade>/`
ou `lib/<dominio>/` quando uma segunda rota precisar.

## Padrão de página de detalhe

Modelo: `app/(site)/agencies/[slug]/`.

- `page.tsx`: `generateMetadata` e a composição das seções. Sem lógica de dados.
- `lib/carregar<Entidade>.ts`: busca e deriva tudo; devolve `null` quando não
  existe (a página chama `notFound()`).
- `lib/metadata.ts`: título, descrição e imagem social.
- `components/<Entidade><Secao>.tsx`: uma seção por arquivo; recebe `view`.

## Páginas de listagem

Use `lib/listagem` (paginação, URL canônica, robots). A página sem filtro é
**estática**; filtro, paginação e busca vão para `<lista>/filtrado` por rewrite em
`next.config.mjs` (as chaves ficam lá, em `chavesDasListagens`). Ler `searchParams`
na página principal a torna dinâmica e `no-store`.

Controles de filtro leem a query no evento (`queryAtual()`), nunca com
`useSearchParams()` no render: em página estática isso exige Suspense e o
conteúdo só chega no cliente.

## Nomes

- Componentes: `PascalCase.tsx`, um por arquivo, nome igual ao export.
- Módulos de `lib/`: arquivo novo em `camelCase.ts` ou, melhor, dentro de uma
  pasta de domínio; não crie arquivo solto na raiz de `lib/`.
- Testes ao lado do arquivo: `X.test.ts(x)`.
- Idioma: termos de domínio do negócio em português (`listagem`, `carregarAgencia`);
  termos técnicos em inglês (`view`, `props`). Não renomeie em massa.

## Refatoração

Um passo por PR, sem mudar comportamento. Em página renderizada, compare o HTML
antes e depois em páginas reais; para rotas estáticas, confira `cache-control`
após o deploy.
