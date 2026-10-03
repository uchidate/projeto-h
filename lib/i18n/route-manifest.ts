/**
 * Inventário de TODA rota pública do site e do que cada uma tem em outro idioma
 * (docs/I18N-V2.md, D11). Complementa `routes.ts`: lá estão só as rotas que já
 * existem em inglês, com os caminhos por idioma; aqui está o mapa completo, para
 * que nenhuma página nasça sem uma decisão de internacionalização.
 *
 * `route-manifest.test.ts` compara este arquivo com `app/(site)` e `app/(intl)`:
 * página nova sem entrada aqui quebra a CI.
 */

export type TipoDeRota = 'detalhe' | 'listagem' | 'editorial' | 'estatica' | 'conta'

export type EstadoDaRota =
    /** Existe em `app/(intl)/[locale]` (e em `ROUTES`). */
    | { estado: 'pronta' }
    /** Vai existir; ainda não foi construída. Não bloqueia a CI. */
    | { estado: 'pendente' }
    /** Decisão de ficar só em português, com o motivo. */
    | { estado: 'somentePt'; motivo: string }

export type RotaDoManifesto = { tipo: TipoDeRota } & EstadoDaRota

const pronta: EstadoDaRota = { estado: 'pronta' }
const pendente: EstadoDaRota = { estado: 'pendente' }

/** Chave = caminho PT como em `app/(site)`, com `[param]` para segmentos dinâmicos. */
export const MANIFESTO_DE_ROTAS: Record<string, RotaDoManifesto> = {
    // Fichas
    '/artists/[slug]': { tipo: 'detalhe', ...pronta },
    '/groups/[slug]': { tipo: 'detalhe', ...pronta },
    '/productions/[slug]': { tipo: 'detalhe', ...pronta },
    '/agencies/[slug]': { tipo: 'detalhe', ...pendente },
    '/empresas/[slug]': { tipo: 'detalhe', ...pendente },
    '/comidas/[slug]': { tipo: 'detalhe', ...pendente },
    '/fandoms/[slug]': { tipo: 'detalhe', ...pendente },
    '/positions/[position]': { tipo: 'detalhe', ...pendente },
    '/loja/artista/[slug]': { tipo: 'detalhe', ...pendente },
    '/loja/grupo/[slug]': { tipo: 'detalhe', ...pendente },
    '/quiz/[categoria]': { tipo: 'detalhe', ...pendente },

    // Editorial
    '/blog/[slug]': { tipo: 'editorial', ...pendente },
    '/guias/[slug]': { tipo: 'editorial', ...pendente },

    // Listagens e hubs
    '/artists': { tipo: 'listagem', ...pronta },
    '/groups': { tipo: 'listagem', ...pronta },
    '/productions': { tipo: 'listagem', ...pronta },
    '/artists/birthdays': { tipo: 'listagem', ...pendente },
    '/agencies': { tipo: 'listagem', ...pendente },
    '/empresas': { tipo: 'listagem', ...pendente },
    '/comidas': { tipo: 'listagem', ...pendente },
    '/fandoms': { tipo: 'listagem', ...pendente },
    '/positions': { tipo: 'listagem', ...pendente },
    '/loja': { tipo: 'listagem', ...pendente },
    '/blog': { tipo: 'listagem', ...pendente },
    '/guias': { tipo: 'listagem', ...pendente },
    '/trending': { tipo: 'listagem', ...pendente },
    '/calendario': { tipo: 'listagem', ...pendente },
    '/conquistas': { tipo: 'listagem', ...pendente },
    '/search': { tipo: 'listagem', ...pendente },
    '/quiz': { tipo: 'listagem', ...pendente },

    // Páginas estáticas e institucionais
    '/': { tipo: 'estatica', ...pronta },
    '/about': { tipo: 'estatica', ...pronta },
    '/contato': { tipo: 'estatica', ...pronta },
    '/ethics': { tipo: 'estatica', ...pronta },
    '/editorial-standards': { tipo: 'estatica', ...pronta },
    '/corrections': { tipo: 'estatica', ...pronta },
    '/cultura-coreana-101': { tipo: 'estatica', ...pendente },
    // Textos legais exigem revisão humana por idioma (docs/I18N-V2.md, §7).
    '/privacidade': { tipo: 'estatica', ...pendente },
    '/termos': { tipo: 'estatica', ...pendente },

    // Conta
    '/entrar': { tipo: 'conta', ...pronta },
    '/cadastro': { tipo: 'conta', ...pronta },
    '/perfil': { tipo: 'conta', ...pendente },
    '/minhas-listas': { tipo: 'conta', ...pendente },
    '/dashboard': { tipo: 'conta', estado: 'somentePt', motivo: 'painel interno da operação, sem público externo' },
}
