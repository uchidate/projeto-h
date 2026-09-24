/**
 * Eventos de produto, enviados a dois destinos.
 *
 * Por que dois: o Google Analytics depende de consentimento e de o visitante
 * nao bloquear o gtag — parte relevante do publico cai fora. O Umami e proprio,
 * sem cookies, servido de primeira parte e fora do banner de consentimento,
 * entao cobre justamente quem o GA nao ve. Um destino confirma o outro, e a
 * divergencia entre eles e informacao: mede quanto do publico o GA perde.
 *
 * Por que aqui e nao num modulo novo: em 2026-09-09 cheguei a criar um segundo
 * modulo de rastreamento sem notar que este ja existia. Dois sistemas para a
 * mesma coisa divergem, e quando divergem ninguem sabe em qual acreditar.
 * Instrumentacao mora num lugar so.
 */

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void
        dataLayer?: unknown[][]
        umami?: { track?: (nome?: string, dados?: Record<string, unknown>) => void }
    }
}

/** Texto longo vira rotulo permanente no relatorio; truncar limita o estrago. */
const LIMITE_TEXTO = 60

function gtag(...args: unknown[]) {
    if (typeof window === 'undefined') return
    if (typeof window.gtag === 'function') window.gtag(...args)
    else (window.dataLayer = window.dataLayer || []).push(args)
}

/**
 * Fila de eventos disparados antes do tracker existir.
 *
 * O script do Umami entra com `strategy` diferida, entao ha uma janela entre a
 * hidratacao e `window.umami` existir. Ate 2026-09-11 o evento disparado nessa
 * janela era DESCARTADO EM SILENCIO — e a medida ficava errada sem nenhum sinal.
 *
 * O tamanho do erro: em 12h, 74 `consent_banner_shown` contra 1 `css_suporte`.
 * Os dois disparam uma vez por visita, mas o do banner so acontece depois da
 * janela de 4s que o consentimento da ao CMP, quando o Umami ja carregou; o
 * outro dispara na montagem e caia no vazio. Nao era o detector que falhava: era
 * o transporte.
 */
/**
 * Fila de CHAMADAS (nao so eventos nomeados) disparadas antes do tracker
 * existir. Generica desde 2026-09-22 (era so `[nome, dados]`); o pageview
 * manual que a motivou saiu em 2026-09-24, mas a forma generica ficou.
 */
const filaUmami: Array<() => void> = []
let sondaUmami: number | null = null

/** Teto da espera. Depois disso o script nao vem mais — bloqueador, rede, erro. */
const TENTATIVAS_UMAMI = 40
const INTERVALO_UMAMI_MS = 250

function escoarFila() {
    // O intervalo pode sobreviver ao ambiente de navegador: nos testes, o jsdom
    // e desmontado ao fim do arquivo e o tique seguinte roda sem `window`
    // ("ReferenceError: window is not defined", CookieBanner.test.tsx, no runner
    // proprio de CI em 2026-09-16 — maquina mais lenta, corrida visivel).
    // Devolver true encerra a sonda.
    if (typeof window === 'undefined') return true
    if (typeof window.umami?.track !== 'function') return false
    while (filaUmami.length) {
        const chamada = filaUmami.shift()!
        try {
            chamada()
        } catch {
            // idem abaixo: medicao nunca derruba a pagina.
        }
    }
    return true
}

function agendarEscoamento() {
    if (sondaUmami !== null) return
    let tentativas = 0
    sondaUmami = window.setInterval(() => {
        tentativas += 1
        if (escoarFila() || tentativas >= TENTATIVAS_UMAMI) {
            globalThis.clearInterval(sondaUmami!)
            sondaUmami = null
            // Desistiu: descarta em vez de vazar memoria numa aba aberta o dia
            // todo. O evento perdido e informacao de apoio; o vazamento, nao.
            filaUmami.length = 0
        }
    }, INTERVALO_UMAMI_MS)
}

/** Chama `fn` (um `track(...)` do Umami) agora se o script ja existe, senao enfileira. */
function chamarUmami(fn: () => void) {
    if (typeof window === 'undefined') return
    if (typeof window.umami?.track === 'function') {
        try {
            fn()
        } catch {
            // Analytics quebrado nunca interrompe o usuario: e informacao de
            // apoio, nao funcionalidade.
        }
        return
    }
    filaUmami.push(fn)
    agendarEscoamento()
}

function umami(nome: string, dados: Record<string, unknown>) {
    const limpo: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(dados)) {
        limpo[k] = typeof v === 'string' ? v.slice(0, LIMITE_TEXTO) : v
    }
    chamarUmami(() => window.umami!.track!(nome, limpo))
}

/**
 * Envia o evento aos dois destinos.
 *
 * O gtag ja e silencioso quando ausente; o umami tambem. Falha de um nao
 * impede o outro, entao um bloqueador que derrube so o Google nao leva a
 * medicao inteira junto.
 */
/**
 * Amostragem dos eventos de anuncio — POR SESSAO, nao por evento.
 *
 * ── Por que amostrar ────────────────────────────────────────────────────────
 *
 * Medido em 2026-09-12, numa janela de 7 dias: 3.131 dos 4.086 eventos eram
 * `ad_slot_*`. 77% do volume. Eles sao AUTOMATICOS — disparam sozinhos a cada
 * anuncio pedido e preenchido, sem ninguem fazer nada — e afogam os eventos que
 * dizem algo sobre pessoas: `scroll_depth` teve 90 e `blog_read` teve 15 na
 * mesma janela.
 *
 * ── Por que por SESSAO e nao por evento ─────────────────────────────────────
 *
 * Taxa de preenchimento e uma razao: `filled / request`. Sorteando evento a
 * evento, um `request` entra na amostra e o `status` correspondente pode ficar
 * de fora — a razao passa a medir o sorteio, nao os anuncios.
 *
 * Decidindo UMA VEZ por sessao, quem entra reporta tudo o que aconteceu ali. A
 * razao continua correta; so o volume cai.
 *
 * ── Por que 10% ─────────────────────────────────────────────────────────────
 *
 * Na proporcao atual sobra ~310 eventos de anuncio por semana contra ~950 dos
 * demais. Suficiente para acompanhar preenchimento e ainda deixar o painel
 * dominado por sinal humano, que e o que se quer olhar.
 *
 * Vale so para o UMAMI: ver `enviarComUmamiAmostrado`.
 */
const PROPORCAO_AMOSTRA_ANUNCIOS = 0.1
const CHAVE_AMOSTRA = 'hh-amostra-anuncios'

// Mesmo sorteio por sessao de `naAmostra` (abaixo, funcao hoisted) — so com
// chave/proporcao proprias. Ate 2026-09-22 este era um segundo corpo de
// try/sessionStorage identico; duas copias do mesmo sorteio divergem tao
// facil quanto duas copias do mesmo rastreamento (ver cabecalho do arquivo).
function naAmostraDeAnuncios(): boolean {
    return naAmostra(CHAVE_AMOSTRA, PROPORCAO_AMOSTRA_ANUNCIOS)
}

function enviar(nome: string, dados: Record<string, unknown>) {
    gtag('event', nome, dados)
    umami(nome, dados)
}

/**
 * Envia inteiro para o Google Analytics e AMOSTRADO para o Umami.
 *
 * A assimetria e proposital. O problema de volume e do Umami — la os eventos de
 * anuncio eram 77% de tudo e afogavam o sinal humano. No GA eles nao competem
 * com nada: sao a materia-prima do relatorio de monetizacao, que e exatamente
 * onde esses eventos valem alguma coisa.
 *
 * A primeira versao disto amostrava nos DOIS, e os testes do AdSlot pegaram:
 * eles afirmam a chamada ao gtag, e ela sumia em 90% das execucoes. O teste
 * estava certo e o projeto estava errado.
 */
function enviarComUmamiAmostrado(nome: string, dados: Record<string, unknown>) {
    gtag('event', nome, dados)
    if (naAmostraDeAnuncios()) umami(nome, dados)
}

// Quiz
export function trackQuizStart(params: { category: string; difficulty: string; total: number }) {
    enviar('quiz_start', {
        quiz_category: params.category,
        quiz_difficulty: params.difficulty,
        quiz_total: params.total,
    })
}

export function trackQuizComplete(params: { score: number; total: number; points: number; category: string; difficulty: string }) {
    enviar('quiz_complete', {
        quiz_score: params.score,
        quiz_total: params.total,
        quiz_points: params.points,
        quiz_pct: Math.round((params.score / params.total) * 100),
        quiz_category: params.category,
        quiz_difficulty: params.difficulty,
    })
}

// Hub / Guias
export function trackHubView(params: { slug: string; kind: string; title: string }) {
    enviar('hub_view', {
        hub_slug: params.slug,
        hub_kind: params.kind,
        hub_title: params.title,
    })
}

// Search
export function trackSearch(query: string, resultCount: number) {
    enviar('search', {
        search_term: query,
        result_count: resultCount,
    })
    if (resultCount === 0 && query.trim()) trackBuscaSemResultado(query)
}

// Leitura de artigo
//
// A instrumentacao anterior destes dois eventos desapareceu do codigo em
// 2026-07-11 e ninguem notou por dois meses. Ficam aqui, junto com o resto,
// pelo mesmo motivo: instrumentacao espalhada some sem deixar rastro.

export function trackScrollDepth(params: { depth: 25 | 50 | 75 | 100; path: string }) {
    enviar('scroll_depth', {
        scroll_depth: params.depth,
        content_path: params.path,
    })
}

export function trackBlogRead(params: { slug: string; seconds: number }) {
    enviar('blog_read', {
        content_slug: params.slug,
        read_seconds: params.seconds,
    })
}

// Artigos / aquisição recorrente
export function trackPreferredSourceClick(postSlug: string) {
    enviar('preferred_source_click', {
        source_platform: 'google',
        content_type: 'article',
        content_slug: postSlug,
    })
}

// Monetização — mede disponibilidade por posição, nunca cliques ou dados pessoais.
export function trackAdRequest(params: { placement: string; format: string; queueDelayMs: number }) {
    enviarComUmamiAmostrado('ad_slot_request', {
        ad_placement: params.placement,
        ad_format: params.format,
        ad_queue_delay_ms: Math.max(0, Math.round(params.queueDelayMs)),
    })
}

export function trackAdStatus(params: { placement: string; format: string; status: 'filled' | 'unfilled' | 'timeout' }) {
    enviarComUmamiAmostrado('ad_slot_status', {
        ad_placement: params.placement,
        ad_format: params.format,
        ad_status: params.status,
    })
}

export function trackAdDismissed(placement: string) {
    enviar('ad_slot_dismissed', { ad_placement: placement })
}

/* -------------------------------------------------------------------------
 * Consentimento
 *
 * Existe para responder uma pergunta que hoje ninguem consegue responder: que
 * fracao dos visitantes aceita o banner.
 *
 * Ela importa porque desde 2026-08-25 o site usa Consent Mode v2 com
 * `analytics_storage` negado por padrao. O GA4 recebe os hits de quem NAO
 * aceita, mas nao os reporta diretamente — depende de modelagem, sujeita a
 * limiares diarios. Na pratica o GA4 mede so quem aceita, e sem saber essa
 * fracao nao da para decidir entre melhorar o banner, adotar o Umami como
 * fonte principal, ou as duas coisas.
 *
 * Sao DOIS eventos porque taxa precisa de numerador e denominador. Registrar
 * so as decisoes responderia "entre quem decidiu, quantos aceitaram" — e
 * esconderia o caso mais provavel, que e a maioria ignorar o banner.
 *
 * Ambos vao para o Umami, que e sem cookie e nao depende de consentimento.
 * Medir o consentimento com uma ferramenta que exige consentimento seria
 * circular.
 * ---------------------------------------------------------------------- */

/** Disparado uma vez por visita em que o banner aparece — o denominador. */
/** Momento em que o banner apareceu, para medir quanto a pessoa leva para decidir. */
let bannerExibidoEm: number | null = null

export function trackConsentBannerExibido() {
    bannerExibidoEm = Date.now()
    enviar('consent_banner_shown', {})
}

/** Disparado quando o visitante escolhe — o numerador. */
export function trackConsentDecidido(params: { decision: 'granted' | 'denied'; origem: 'banner' | 'preferencias' }) {
    // Segundos até decidir: mede o atrito do banner. Muito rápido com muito
    // aceite pode ser clique sem ler; muito lento, banner que atrapalha.
    const segundos = params.origem === 'banner' && bannerExibidoEm !== null
        ? Math.round((Date.now() - bannerExibidoEm) / 1000)
        : undefined
    enviar('consent_decision', {
        consent_decision: params.decision,
        consent_origem: params.origem,
        ...(segundos !== undefined ? { seconds_to_decide: segundos } : {}),
    })
}

/* -------------------------------------------------------------------------
 * Audiência — de onde vem, o que a mantém, o que a converte
 *
 * Adicionados em 2026-09-13. Antes deles o Umami media consumo (leitura,
 * busca, quiz) mas não respondia as perguntas que decidem crescimento: qual
 * conteúdo viraliza e em qual rede, se as mudanças de retenção funcionaram
 * (favoritar sem conta, login com Google, sessão de 30 dias) e quais blocos
 * mantêm a pessoa no site.
 *
 * Regra: nenhum dado pessoal. Nada de e-mail, nome ou id de usuário — só o
 * que a pessoa fez e onde.
 * ---------------------------------------------------------------------- */

export type RedeCompartilhamento = 'whatsapp' | 'facebook' | 'copiar_link' | 'nativo' | 'whatsapp_trecho'

/** Clique em compartilhar. O retorno do link é medido pelo UTM, não aqui. */
export function trackShare(params: { rede: RedeCompartilhamento; caminho: string }) {
    enviar('share_click', { share_network: params.rede, content_path: params.caminho })
}

/**
 * Favoritar, seguir, salvar, marcar como lido — e o inverso.
 *
 * `com_conta` separa o que só existe por causa do "favoritar sem conta": é essa
 * a parcela que diz se a mudança de 2026-09-12 trouxe engajamento novo.
 */
export function trackConteudoMarcado(params: {
    tipo: string
    estado: string
    acao: 'adicionar' | 'remover'
    comConta: boolean
}) {
    enviar('content_state', {
        object_type: params.tipo,
        content_state: params.estado,
        state_action: params.acao,
        with_account: params.comConta,
    })
}

export type MetodoAutenticacao = 'senha' | 'google'

/** Conta criada com sucesso. */
export function trackCadastro(metodo: MetodoAutenticacao) {
    enviar('sign_up', { method: metodo })
}

/** Login concluído. */
export function trackLogin(metodo: MetodoAutenticacao) {
    enviar('login', { method: metodo })
}

/**
 * Intenção de entrar com Google.
 *
 * O Google redireciona para fora e volta autenticado, e o cliente não sabe se a
 * conta é nova ou antiga. Medir o clique, com a tela de origem, é o que dá para
 * medir com honestidade aqui; a comparação útil é contra `login`/`sign_up` por
 * senha na mesma tela.
 */
export function trackAutenticacaoGoogleIniciada(origem: 'entrar' | 'cadastro') {
    enviar('google_auth_start', { auth_screen: origem })
}

/**
 * Clique em link interno dentro de um bloco de recirculação.
 *
 * `posicao` começa em 1. Sem ela não dá para saber se o bloco funciona ou só o
 * primeiro card funciona — e a resposta muda o que reordenar.
 */
export function trackRecirculacao(params: { bloco: string; posicao: number; destino: string; origem: string }) {
    enviar('recirculation_click', {
        block: params.bloco,
        position: params.posicao,
        target_path: params.destino,
        source_path: params.origem,
    })
}

/**
 * Busca sem nenhum resultado, em evento próprio.
 *
 * O `search` já carrega `result_count`, mas um evento separado vira meta direta
 * no painel e lista pronta de pautas que o público pediu e o site não cobre.
 */
export function trackBuscaSemResultado(termo: string) {
    enviar('search_no_results', { search_term: termo })
}

/**
 * Visita a página inexistente.
 *
 * `referrer_host` sozinho já separa link quebrado nosso (host próprio) de link
 * externo antigo (Google, rede social) — os dois pedem ações diferentes.
 */
export function trackPaginaNaoEncontrada(params: { caminho: string; referrerHost: string }) {
    enviar('page_not_found', { missing_path: params.caminho, referrer_host: params.referrerHost || 'direto' })
}

/* -------------------------------------------------------------------------
 * Experiência real e comportamento fino — segunda rodada (2026-09-13)
 * ---------------------------------------------------------------------- */

/**
 * Amostragem por sessão, genérica.
 *
 * Mesma lógica de `naAmostraDeAnuncios` (sorteio uma vez por sessão, guardado
 * em sessionStorage; sem storage, fica de fora), mas com chave própria por
 * métrica — sortear todas com a mesma chave amarraria as amostras, e a sessão
 * que entra numa entraria em todas.
 */
function naAmostra(chave: string, proporcao: number): boolean {
    if (typeof window === 'undefined') return false
    try {
        const guardado = window.sessionStorage.getItem(chave)
        if (guardado !== null) return guardado === '1'
        const sorteado = Math.random() < proporcao ? '1' : '0'
        window.sessionStorage.setItem(chave, sorteado)
        return sorteado === '1'
    } catch {
        return false
    }
}

/**
 * Web Vitals de usuários REAIS, por tipo de página.
 *
 * Até aqui toda decisão de performance saía de Lighthouse — simulação, com
 * variação de 61 a 87 de score entre duas rodadas iguais em produção. Este
 * evento mede o que o público de fato sente, e é o que diz se o Sentry sob
 * demanda, o CSS embutido e o content-visibility valeram.
 *
 * Amostrado em 10% das sessões: são até cinco métricas por página vista, e sem
 * amostragem virariam o maior volume do Umami — o mesmo afogamento que os
 * eventos de anúncio causaram.
 */
export function trackWebVital(params: { nome: string; valor: number; avaliacao: string; tipoPagina: string }) {
    if (!naAmostra('hh-amostra-vitals', 0.1)) return
    umami('web_vital', {
        metric: params.nome,
        // CLS é fração (0.05); o resto é milissegundo. Arredondar CLS a inteiro
        // apagaria a métrica inteira.
        value: params.nome === 'CLS' ? Math.round(params.valor * 1000) / 1000 : Math.round(params.valor),
        rating: params.avaliacao,
        page_type: params.tipoPagina,
    })
}

/**
 * Tempo de atenção por página: só conta com a aba visível.
 *
 * Um evento por página vista, no momento em que a pessoa sai. 25% das sessões:
 * volume de uma visualização por evento dobraria o Umami.
 */
export function trackTempoEngajado(params: { segundos: number; tipoPagina: string }) {
    if (!naAmostra('hh-amostra-engajamento', 0.25)) return
    umami('engaged_time', { seconds: Math.round(params.segundos), page_type: params.tipoPagina })
}

/** Clique que leva para fora do site — Spotify, YouTube, streaming, redes. */
export function trackCliqueExterno(params: { host: string; tipoPagina: string }) {
    enviar('outbound_click', { outbound_host: params.host, page_type: params.tipoPagina })
}

/** Play em vídeo embutido. `posicao` começa em 1 dentro da lista de MVs. */
export function trackVideoPlay(params: { plataforma: 'youtube'; contexto: string; posicao: number }) {
    enviar('video_play', { video_platform: params.plataforma, video_context: params.contexto, position: params.posicao })
}

/** Troca de tema. Diz se vale manter o modo claro, ou se todo mundo fica no escuro. */
export function trackTema(tema: 'dark' | 'light') {
    enviar('theme_change', { theme: tema })
}

/**
 * Filtro ativo numa listagem.
 *
 * `origem` separa quem CHEGOU filtrado (Google, link compartilhado) de quem
 * filtrou DENTRO do site. As duas respostas pedem ações diferentes: a primeira
 * diz quais combinações merecem página própria; a segunda, quais filtros o
 * público de fato usa.
 */
export function trackFiltroListagem(params: { listagem: string; filtros: string; origem: 'entrada' | 'interacao' }) {
    enviar('listing_filter', { listing: params.listagem, filters: params.filtros, filter_origin: params.origem })
}
