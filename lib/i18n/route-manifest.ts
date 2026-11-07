/**
 * Inventário de TODA rota pública do site e do que cada uma tem em outro idioma
 * (docs/I18N-V2.md, D11). Complementa `routes.ts`: lá estão só as rotas que já
 * existem em inglês, com os caminhos por idioma; aqui está o mapa completo, para
 * que nenhuma página nasça sem uma decisão de internacionalização.
 *
 * `route-manifest.test.ts` compara este arquivo com `app/[locale]`:
 * página nova sem entrada aqui quebra a CI.
 */

export type TipoDeRota = 'detalhe' | 'listagem' | 'editorial' | 'estatica' | 'conta'

export type EstadoDaRota =
    /** Existe em `app/[locale]` (e em `ROUTES`). */
    | { estado: 'pronta' }
    /** Existe em `app/[locale]`, mas não é equivalente à versão em português; `falta` diz o quê. */
    | { estado: 'parcial'; falta: string }
    /** Vai existir; ainda não foi construída. Não bloqueia a CI. */
    | { estado: 'pendente' }
    /** Decisão de ficar só em português, com o motivo. */
    | { estado: 'somentePt'; motivo: string }

export type RotaDoManifesto = { tipo: TipoDeRota } & EstadoDaRota

const pronta: EstadoDaRota = { estado: 'pronta' }

/** Chave = caminho PT em português, com `[param]` para segmentos dinâmicos. */
export const MANIFESTO_DE_ROTAS: Record<string, RotaDoManifesto> = {
    // Fichas
    '/artists/[slug]': { tipo: 'detalhe', ...pronta },
    '/groups/[slug]': { tipo: 'detalhe', ...pronta },
    '/productions/[slug]': { tipo: 'detalhe', ...pronta },
    '/agencies/[slug]': { tipo: 'detalhe', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/empresas/[slug]': { tipo: 'detalhe', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/empresas/grupo/[slug]': { tipo: 'detalhe', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/comidas/[slug]': { tipo: 'detalhe', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/fandoms/[slug]': { tipo: 'detalhe', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/positions/[position]': { tipo: 'detalhe', ...pronta },
    '/loja/artista/[slug]': { tipo: 'detalhe', estado: 'somentePt', motivo: 'catálogo de lojas brasileiras com preço em reais e link de afiliado; sem sentido para leitor de outro país (a ficha em EN já esconde a vitrine)' },
    '/loja/grupo/[slug]': { tipo: 'detalhe', estado: 'somentePt', motivo: 'catálogo de lojas brasileiras com preço em reais e link de afiliado; sem sentido para leitor de outro país (a ficha em EN já esconde a vitrine)' },
    '/loja/empresa/[slug]': { tipo: 'detalhe', estado: 'somentePt', motivo: 'catálogo de lojas brasileiras com preço em reais e link de afiliado; sem sentido para leitor de outro país (a ficha em EN já esconde a vitrine)' },
    '/loja/comida/[slug]': { tipo: 'detalhe', estado: 'somentePt', motivo: 'catálogo de lojas brasileiras com preço em reais e link de afiliado; sem sentido para leitor de outro país (a ficha em EN já esconde a vitrine)' },
    '/quiz/[categoria]': { tipo: 'detalhe', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },

    // Editorial
    '/blog/[slug]': { tipo: 'editorial', estado: 'parcial', falta: 'artigo com tradução publicada (post próprio por idioma, D5-a) serve a versão traduzida, indexável; sem tradução, corpo em português com aviso e noindex; nenhum artigo traduzido ainda' },
    '/guias/[slug]': { tipo: 'editorial', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },

    // Listagens e hubs
    '/artists': { tipo: 'listagem', ...pronta },
    '/groups': { tipo: 'listagem', ...pronta },
    '/productions': { tipo: 'listagem', ...pronta },
    '/artists/birthdays': { tipo: 'listagem', ...pronta },
    '/agencies': { tipo: 'listagem', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/empresas': { tipo: 'listagem', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },
    '/comidas': { tipo: 'listagem', estado: 'parcial', falta: 'listagem traduzida (filtros, artigos, mapa por região e grade das fichas traduzidas); sem a vitrine, as marcas e as receitas, que são da loja brasileira' },
    '/fandoms': { tipo: 'listagem', ...pronta },
    '/positions': { tipo: 'listagem', ...pronta },
    '/loja': { tipo: 'listagem', estado: 'somentePt', motivo: 'catálogo de lojas brasileiras com preço em reais e link de afiliado; sem sentido para leitor de outro país (a ficha em EN já esconde a vitrine)' },
    '/merch': { tipo: 'listagem', estado: 'somentePt', motivo: 'guias de colecionismo e vitrine da loja brasileira com preço em reais e link de afiliado; sem sentido para leitor de outro país' },
    '/blog': { tipo: 'listagem', estado: 'parcial', falta: 'só a listagem (artigos com selo PT abrindo no original); /en/blog/[slug] serve o original em português com aviso e noindex; artigos com tradução publicada aparecem traduzidos' },
    '/guias': { tipo: 'listagem', ...pronta },
    '/trending': { tipo: 'listagem', ...pronta },
    '/calendario': { tipo: 'listagem', ...pronta },
    '/conquistas': { tipo: 'listagem', ...pronta },
    '/search': { tipo: 'listagem', ...pronta },
    '/quiz': { tipo: 'listagem', estado: 'parcial', falta: 'corpo em português com aviso de falta de tradução e noindex; textos da página e conteúdo ainda não traduzidos' },

    // Páginas estáticas e institucionais
    '/': { tipo: 'estatica', estado: 'parcial', falta: 'sem os blocos só-PT por decisão (loja, streaming BR, quiz) e sem guias/hubs, pendentes até haver guias traduzidos; artigos aparecem em português com selo PT' },
    '/about': { tipo: 'estatica', ...pronta },
    '/contato': { tipo: 'estatica', ...pronta },
    '/ethics': { tipo: 'estatica', ...pronta },
    '/editorial-standards': { tipo: 'estatica', ...pronta },
    '/corrections': { tipo: 'estatica', ...pronta },
    '/cultura-coreana-101': { tipo: 'estatica', ...pronta },
    // Textos legais exigem revisão humana por idioma (docs/I18N-V2.md, §7).
    '/privacidade': { tipo: 'estatica', estado: 'parcial', falta: 'texto legal em português com aviso e noindex até haver tradução revisada por humano' },
    '/termos': { tipo: 'estatica', estado: 'parcial', falta: 'texto legal em português com aviso e noindex até haver tradução revisada por humano' },

    // Conta
    '/entrar': { tipo: 'conta', ...pronta },
    '/cadastro': { tipo: 'conta', ...pronta },
    '/perfil': { tipo: 'conta', ...pronta },
    '/minhas-listas': { tipo: 'conta', ...pronta },
    '/dashboard': { tipo: 'conta', ...pronta },
}
