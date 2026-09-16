/**
 * Content Security Policy — em modo REPORT-ONLY.
 *
 * ── Por que report-only e não enforcing ─────────────────────────────────────
 *
 * O site é monetizado por AdSense, e o AdSense injeta domínios dinamicamente:
 * a lista muda conforme o anúncio servido, o país e o leilão. Publicar uma CSP
 * que bloqueia de verdade, sem dados, derruba receita em silêncio — o anúncio
 * simplesmente não aparece, ninguém vê erro, e a queda só é notada no extrato
 * do fim do mês.
 *
 * Report-only reporta a violação e não bloqueia nada. Depois de uma semana de
 * dados reais, as origens que faltarem entram na lista e a política vira
 * enforcing com confiança.
 *
 * ── De onde saiu esta lista ─────────────────────────────────────────────────
 *
 * Não foi copiada de tutorial: foi medida em 2026-09-11 com um navegador real,
 * viewport de celular e CONSENTIMENTO CONCEDIDO, em quatro tipos de página
 * (home, artigo, artista, listagem). Sem consentimento o AdSense personalizado
 * nem carrega, e a política sairia sem justamente as origens que mais importam.
 *
 * ── O que ainda incomoda ────────────────────────────────────────────────────
 *
 * `'unsafe-inline'` em script-src enfraquece bastante a proteção, e está aqui
 * porque o Next.js injeta scripts inline de hidratação e o gtag injeta o dele.
 * A saída correta é nonce por requisição, o que exige middleware e renderização
 * dinâmica — troca cara num site que vive de ISR. Fica registrado como o
 * próximo passo, não como esquecimento.
 */

const GOOGLE_ADS = [
    'https://pagead2.googlesyndication.com',
    'https://googleads.g.doubleclick.net',
    'https://tpc.googlesyndication.com',
    'https://ep1.adtrafficquality.google',
    'https://ep2.adtrafficquality.google',
    'https://fundingchoicesmessages.google.com',
]

const DIRETIVAS = {
    'default-src': ["'self'"],

    // 'unsafe-inline': hidratação do Next.js e o snippet do gtag. Ver acima.
    'script-src': [
        "'self'",
        "'unsafe-inline'",
        // O AdSense avalia código em runtime; sem isto o anúncio não renderiza.
        "'unsafe-eval'",
        'https://www.googletagmanager.com',
        'https://static.cloudflareinsights.com',
        ...GOOGLE_ADS,
    ],

    // Tailwind e componentes injetam estilo inline; nonce em estilo tem o mesmo
    // custo de renderização dinâmica que em script.
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],

    // data: e blob: cobrem as imagens OG geradas em runtime e os placeholders
    // desfocados do next/image.
    'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https://www.google.com',
        'https://www.google.com.br',
        'https://csi.gstatic.com',
        ...GOOGLE_ADS,
    ],

    'connect-src': [
        "'self'",
        'https://analytics.google.com',
        'https://www.google.com',
        'https://stats.g.doubleclick.net',
        'https://csi.gstatic.com',
        // Sentry: o erro do cliente precisa sair, senão a CSP cega justamente o
        // canal que avisaria que ela quebrou alguma coisa.
        'https://o4511617127743488.ingest.de.sentry.io',
        ...GOOGLE_ADS,
    ],

    // Iframes de anúncio e o desafio do reCAPTCHA.
    'frame-src': ['https://www.google.com', ...GOOGLE_ADS],

    // Ninguém pode nos colocar em iframe. Duplica o X-Frame-Options de
    // propósito: aquele é legado e não cobre navegador moderno com a mesma
    // precisão.
    'frame-ancestors': ["'none'"],

    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
}

/** Endpoint que recebe as violações. Ver app/api/csp-report/route.ts. */
const DESTINO_RELATORIO = '/api/csp-report'

export function buildCsp() {
    const partes = Object.entries(DIRETIVAS).map(
        ([diretiva, valores]) => `${diretiva} ${valores.join(' ')}`,
    )
    // report-uri é obsoleto e report-to é o substituto, mas o suporte a
    // report-to ainda é irregular entre navegadores. Os dois juntos garantem
    // que a violação chegue — e é o dado que decide o próximo passo.
    partes.push(`report-uri ${DESTINO_RELATORIO}`)
    partes.push("report-to csp")
    return partes.join('; ')
}

/** Cabeçalho `Reporting-Endpoints`, exigido pelo `report-to`. */
export function buildReportingEndpoints() {
    return `csp="${DESTINO_RELATORIO}"`
}
