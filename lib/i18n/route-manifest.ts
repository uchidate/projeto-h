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
    /** Existe em `app/(intl)/[locale]`, mas não é equivalente à versão em português; `falta` diz o quê. */
    | { estado: 'parcial'; falta: string }
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
    '/agencies/[slug]': { tipo: 'detalhe', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/empresas/[slug]': { tipo: 'detalhe', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/comidas/[slug]': { tipo: 'detalhe', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/fandoms/[slug]': { tipo: 'detalhe', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/positions/[position]': { tipo: 'detalhe', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/loja/artista/[slug]': { tipo: 'detalhe', estado: 'somentePt', motivo: 'catálogo de lojas brasileiras com preço em reais e link de afiliado; sem sentido para leitor de outro país (a ficha em EN já esconde a vitrine)' },
    '/loja/grupo/[slug]': { tipo: 'detalhe', estado: 'somentePt', motivo: 'catálogo de lojas brasileiras com preço em reais e link de afiliado; sem sentido para leitor de outro país (a ficha em EN já esconde a vitrine)' },
    '/quiz/[categoria]': { tipo: 'detalhe', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },

    // Editorial
    '/blog/[slug]': { tipo: 'editorial', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/guias/[slug]': { tipo: 'editorial', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },

    // Listagens e hubs
    '/artists': { tipo: 'listagem', ...pronta },
    '/groups': { tipo: 'listagem', ...pronta },
    '/productions': { tipo: 'listagem', ...pronta },
    '/artists/birthdays': { tipo: 'listagem', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/agencies': { tipo: 'listagem', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/empresas': { tipo: 'listagem', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/comidas': { tipo: 'listagem', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/fandoms': { tipo: 'listagem', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/positions': { tipo: 'listagem', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/loja': { tipo: 'listagem', estado: 'somentePt', motivo: 'catálogo de lojas brasileiras com preço em reais e link de afiliado; sem sentido para leitor de outro país (a ficha em EN já esconde a vitrine)' },
    '/blog': { tipo: 'listagem', estado: 'parcial', falta: 'só a listagem (artigos com selo PT abrindo no original); /en/blog/[slug] serve o original em português com aviso e noindex; tradução real exige estender translations ao blog no WP' },
    '/guias': { tipo: 'listagem', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/trending': { tipo: 'listagem', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/calendario': { tipo: 'listagem', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/conquistas': { tipo: 'listagem', estado: 'somentePt', motivo: 'página de quem está logado (redireciona para o login); sem conteúdo público para traduzir' },
    '/search': { tipo: 'listagem', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/quiz': { tipo: 'listagem', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },

    // Páginas estáticas e institucionais
    '/': { tipo: 'estatica', estado: 'parcial', falta: 'sem os blocos só-PT por decisão (loja, streaming BR, quiz) e sem guias/hubs, pendentes até haver guias traduzidos; artigos aparecem em português com selo PT' },
    '/about': { tipo: 'estatica', ...pronta },
    '/contato': { tipo: 'estatica', ...pronta },
    '/ethics': { tipo: 'estatica', ...pronta },
    '/editorial-standards': { tipo: 'estatica', ...pronta },
    '/corrections': { tipo: 'estatica', ...pronta },
    '/cultura-coreana-101': { tipo: 'estatica', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
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
