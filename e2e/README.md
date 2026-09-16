# E2E — Arquitetura de Testes (TAA)

## Camadas implementadas

- **`fixtures/`** — Data-Driven Testing: entidades reais e estáveis (slugs) usadas
  pelos specs. Adicionar uma entidade aqui multiplica cobertura sem duplicar código
  de teste (ex: `KNOWN_ARTISTS` roda o mesmo spec para cada artista da lista).
- **`pages/`** — Page Object Model: uma classe por tipo de página (`ArtistPage`,
  `GroupPage`, `ProductionPage`, `ListingPage`), todas herdando de `BasePage`
  (camada de suporte: helpers de JSON-LD, canonical, navegação). Specs não tocam
  em seletores/DOM diretamente — só chamam métodos do Page Object.
- **`*.spec.ts`** — camada de teste/negócio: cenários, sem lógica de navegação
  misturada.

## Decisão consciente: Screenplay Pattern e Keyword-Driven/DSL — adiados

Avaliados em 2026-07-05 e **não implementados agora**:

- **Screenplay Pattern** (atores/tasks/abilities) resolve escala de equipe e
  jornadas complexas (múltiplos papéis de usuário, fluxos de várias etapas
  como checkout). Este site não tem login/carrinho como fluxo central hoje —
  POM já cobre bem o caso de uso (páginas de conteúdo, sem estado de usuário
  entre passos). Reavaliar se o projeto ganhar fluxos autenticados complexos.
- **Keyword-Driven/DSL** existe pra permitir que pessoas não-técnicas escrevam
  testes usando palavras-chave. Não há esse público aqui (mantenedor único +
  IA) — a camada extra de tradução (DSL → Playwright) só adicionaria
  indireção sem benefício real no momento.

## Rodando

```bash
npx playwright test                                    # contra dev local (sobe automaticamente)
E2E_BASE_URL=https://www.example.com npx playwright test   # contra produção
```

## CI

`e2e-smoke.yml` roda esse spec contra produção depois de todo deploy bem-sucedido
(não bloqueante) e diariamente via cron. `deploy.yml` roda só os unit tests
(`vitest`) como gate bloqueante antes do build Docker — E2E contra prod ao vivo
não deve travar deploy por instabilidade de rede.
