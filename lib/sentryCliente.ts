/**
 * Sentry do navegador, carregado sob demanda.
 *
 * O SDK custava ~157KB brutos / 52KB gzip no caminho da primeira pintura de
 * TODAS as páginas (medido em 2026-09-13: build com e sem o cliente do Sentry,
 * 434KB -> 382KB gzip de JS de cliente). No Lighthouse mobile, 80-85% do LCP
 * era "render delay" com a thread principal ocupada — e o chunk que carregava
 * o Sentry era o maior script próprio da página.
 *
 * Por que não tree-shaking: as flags do SDK (`__SENTRY_DEBUG__` etc.) só são
 * injetadas pelo plugin de WEBPACK do Sentry, e o build é Turbopack desde o
 * Next 16. Aplicá-las por `compiler.define` foi testado e rendeu ~1KB: o peso é
 * o núcleo do SDK, não o código de debug. E `__SENTRY_TRACING__=false` por ali
 * valeria também para o servidor, onde o tracing está ativo.
 *
 * O contrato que NÃO pode quebrar: erro capturado antes do carregamento não se
 * perde. `capturarErro` dispara o carregamento na hora e envia quando o SDK
 * chega.
 */
import { ambienteDoHost } from './sentryAmbiente'
import type * as SentryNucleo from './sentryNucleo'

type Sentry = typeof SentryNucleo
type ContextoDeErro = Parameters<Sentry['captureException']>[1]

export const OPCOES_SENTRY_CLIENTE: Parameters<Sentry['init']>[0] = {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    // O bundle é o mesmo em staging e produção: o ambiente sai do host (ver sentryAmbiente.ts).
    environment: typeof window === 'undefined' ? process.env.NODE_ENV : ambienteDoHost(window.location.hostname),
    // Um projeto só recebe navegador, servidor Next e WordPress: a tag separa.
    initialScope: { tags: { runtime: 'nextjs-navegador' } },
    // Mesmo identificador do servidor e de <prefixo>_build_info: erro de
    // cliente, erro de servidor e metrica passam a apontar para o mesmo commit.
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    // Cliente enxuto de propósito: só captura de ERROS. O replayIntegration e o
    // tracing de cliente saíram em 2026-07-12 (score 30, TBT de 4,6s na época).
    // Tracing e replay seguem ativos no servidor/edge, que não custam bundle.
    tracesSampleRate: 0,
    integrations: [],
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

    /**
     * Ruido de terceiros que nao e bug nosso e nao tem acao possivel.
     *
     * Cada entrada precisa de justificativa: filtro amplo demais esconde erro
     * real, e a unica coisa pior que alerta ruidoso e alerta silencioso.
     */
    ignoreErrors: [
        // Navegador embutido do Outlook. A infraestrutura de previa de links da
        // Microsoft injeta script na pagina e ele falha sozinho, sempre com esta
        // forma exata. Nao ha nada no nosso codigo com MethodName/ParamCount.
        /Object Not Found Matching Id:\d+, MethodName:\w+, ParamCount:\d+/,
        // Laco benigno do ResizeObserver: a especificacao manda o navegador
        // avisar quando o callback nao converge num quadro, e o proprio browser
        // reprocessa no quadro seguinte. Nao ha efeito visivel nem correcao.
        'ResizeObserver loop completed with undelivered notifications',
        'ResizeObserver loop limit exceeded',
        // Rede do visitante caindo no meio de um fetch. Aparece como erro nosso
        // e e conexao dele; erro real de API chega como status HTTP.
        'Failed to fetch',
        'NetworkError when attempting to fetch resource',
        'Load failed',
        // Bloqueadores de anuncio derrubando os scripts do Google. NAO cobre
        // "adsbygoogle.push() error": esse e erro do NOSSO push (slot oculto,
        // desmontado ou ja preenchido) e ficou escondido por este filtro de
        // 2026-09-10 a 2026-09-14 (PHP-G, PHP-F; ver estadoDoSlot em adQueue.ts).
        /adsbygoogle(?!\.push\(\) error)/,
    ],

    /**
     * Erro originado em codigo que nao e nosso.
     *
     * Extensao de navegador roda no contexto da pagina e o erro dela chega ao
     * Sentry como se fosse do site. Nao da para corrigir o que nao se controla.
     */
    denyUrls: [
        /^chrome-extension:\/\//,
        /^moz-extension:\/\//,
        /^safari(-web)?-extension:\/\//,
        // Reescrita de link da Microsoft. Ancorado no host: sem as âncoras,
        // `https://atacante.com/safelinks.protection.outlook.com` também casaria
        // e silenciaria erros que deveríamos ver (js/regex/missing-regexp-anchor).
        /^https?:\/\/([\w-]+\.)*safelinks\.protection\.outlook\.com(\/|$)/,
    ],

    // Nossas próprias sondas (fumaça, vigia da analítica) rodam em Chrome
    // headless e esbarram em erro interno do AdSense (`Error: int64`, rum.js —
    // PHP-2G, 2026-09-14). Não é visitante nem bug do site.
    beforeSend: (evento) => (ehNavegadorAutomatizado() ? null : evento),
}

export function ehNavegadorAutomatizado(ua: string = typeof navigator === 'undefined' ? '' : navigator.userAgent): boolean {
    return /HeadlessChrome/i.test(ua)
}

let carregamento: Promise<Sentry> | null = null
let carregado: Sentry | null = null

/** Carrega e inicializa o SDK uma única vez; chamadas seguintes reusam a promessa. */
export function carregarSentry(): Promise<Sentry> {
    carregamento ??= import('./sentryNucleo').then(sentry => {
        sentry.init(OPCOES_SENTRY_CLIENTE)
        carregado = sentry
        return sentry
    })
    return carregamento
}

/** O SDK já está pronto? Síncrono, para quem não pode esperar (transição de rota). */
export function sentryCarregado(): Sentry | null {
    return carregado
}

/**
 * Envia um erro ao Sentry, carregando o SDK se preciso.
 *
 * Nunca lança: é chamado de dentro de fronteiras de erro, e uma falha ao
 * reportar não pode virar um segundo erro na tela de erro.
 */
export function capturarErro(error: unknown, contexto?: ContextoDeErro): void {
    carregarSentry()
        .then(sentry => { sentry.captureException(error, contexto) })
        .catch(() => { /* sem Sentry não há a quem reportar */ })
}

/** Só para testes: volta ao estado de antes do primeiro carregamento. */
export function __reiniciarParaTeste(): void {
    carregamento = null
    carregado = null
}
