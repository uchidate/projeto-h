/**
 * Identidade do site: nome, dominios e prefixos.
 *
 * Nada disto e versionado com o valor real. Os valores de producao entram no
 * build por variavel de ambiente (NEXT_PUBLIC_*, embutidas pelo `next build`);
 * em desenvolvimento e teste valem os padroes neutros abaixo.
 *
 * Em build de producao a falta de qualquer variavel obrigatoria DERRUBA o
 * build (checagem em next.config.mjs, via `identidadeFaltando`): publicar o
 * site com nome ou dominio de exemplo e pior que nao publicar.
 *
 * `.mjs` e nao `.ts`: next.config.mjs tambem precisa destes valores (redirects,
 * dominios de imagem) e le o arquivo direto, sem passar pelo TypeScript.
 */

const PADROES = {
    NEXT_PUBLIC_SITE_NAME: 'Portal',
    NEXT_PUBLIC_SITE_URL: 'https://www.example.com',
    NEXT_PUBLIC_WORDPRESS_ORIGIN: 'https://cms.example.com',
    NEXT_PUBLIC_WORDPRESS_ADMIN_ORIGIN: 'https://admin.cms.example.com',
    NEXT_PUBLIC_STAGING_URL: 'https://staging.example.com',
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: '',
    NEXT_PUBLIC_STORAGE_PREFIX: 'portal',
    NEXT_PUBLIC_LEGACY_STORAGE_PREFIX: 'portal_legado',
    NEXT_PUBLIC_BLOCK_CSS_PREFIX: 'bloco',
    NEXT_PUBLIC_BLOCK_ALT_PREFIX: 'bloco-alt',
    NEXT_PUBLIC_METRICS_PREFIX: 'portal',
    NEXT_PUBLIC_WP_API_NAMESPACE: 'portal/v1',
    NEXT_PUBLIC_UMAMI_ORIGIN: 'https://analytics.example.com',
    NEXT_PUBLIC_CONTACT_EMAIL: 'contato@example.com',
    NEXT_PUBLIC_ADMIN_EMAILS: '',
    NEXT_PUBLIC_ADSENSE_CLIENT: '',
}

// Leitura explicita, variavel por variavel: o Next so embute no bundle do
// navegador as NEXT_PUBLIC_* referenciadas literalmente (process.env.X).
const LIDOS = {
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_WORDPRESS_ORIGIN: process.env.NEXT_PUBLIC_WORDPRESS_ORIGIN,
    NEXT_PUBLIC_WORDPRESS_ADMIN_ORIGIN: process.env.NEXT_PUBLIC_WORDPRESS_ADMIN_ORIGIN,
    NEXT_PUBLIC_STAGING_URL: process.env.NEXT_PUBLIC_STAGING_URL,
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    NEXT_PUBLIC_STORAGE_PREFIX: process.env.NEXT_PUBLIC_STORAGE_PREFIX,
    NEXT_PUBLIC_LEGACY_STORAGE_PREFIX: process.env.NEXT_PUBLIC_LEGACY_STORAGE_PREFIX,
    NEXT_PUBLIC_BLOCK_CSS_PREFIX: process.env.NEXT_PUBLIC_BLOCK_CSS_PREFIX,
    NEXT_PUBLIC_BLOCK_ALT_PREFIX: process.env.NEXT_PUBLIC_BLOCK_ALT_PREFIX,
    NEXT_PUBLIC_METRICS_PREFIX: process.env.NEXT_PUBLIC_METRICS_PREFIX,
    NEXT_PUBLIC_WP_API_NAMESPACE: process.env.NEXT_PUBLIC_WP_API_NAMESPACE,
    NEXT_PUBLIC_UMAMI_ORIGIN: process.env.NEXT_PUBLIC_UMAMI_ORIGIN,
    NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
    NEXT_PUBLIC_ADMIN_EMAILS: process.env.NEXT_PUBLIC_ADMIN_EMAILS,
    NEXT_PUBLIC_ADSENSE_CLIENT: process.env.NEXT_PUBLIC_ADSENSE_CLIENT,
}

const OPCIONAIS = new Set(['NEXT_PUBLIC_UMAMI_WEBSITE_ID', 'NEXT_PUBLIC_STAGING_URL', 'NEXT_PUBLIC_UMAMI_ORIGIN', 'NEXT_PUBLIC_ADMIN_EMAILS', 'NEXT_PUBLIC_ADSENSE_CLIENT'])

function ler(nome) {
    return LIDOS[nome] || PADROES[nome]
}

/** Variaveis obrigatorias sem valor — o build de producao aborta se houver. */
export function identidadeFaltando() {
    return Object.keys(LIDOS).filter((nome) => !OPCIONAIS.has(nome) && !LIDOS[nome])
}

const semBarraFinal = (url) => url.replace(/\/+$/, '')

export const SITE_NAME = ler('NEXT_PUBLIC_SITE_NAME')
export const SITE_URL = semBarraFinal(ler('NEXT_PUBLIC_SITE_URL'))
/** Host canonico, com `www` quando houver: `www.exemplo.com`. */
export const SITE_HOST = new URL(SITE_URL).host
/** Dominio sem `www`: `exemplo.com`. */
export const SITE_DOMAIN = SITE_HOST.replace(/^www\./, '')
export const STAGING_URL = semBarraFinal(ler('NEXT_PUBLIC_STAGING_URL'))
export const WORDPRESS_ORIGIN = semBarraFinal(ler('NEXT_PUBLIC_WORDPRESS_ORIGIN'))
export const WORDPRESS_HOST = new URL(WORDPRESS_ORIGIN).host
export const WORDPRESS_ADMIN_ORIGIN = semBarraFinal(ler('NEXT_PUBLIC_WORDPRESS_ADMIN_ORIGIN'))
export const UMAMI_WEBSITE_ID = ler('NEXT_PUBLIC_UMAMI_WEBSITE_ID')
/** Prefixo de chaves de localStorage/cookies. Em producao, o valor historico:
 *  mudar faria todo visitante perder tema, consentimento e preferencias. */
export const STORAGE_PREFIX = ler('NEXT_PUBLIC_STORAGE_PREFIX')
export const LEGACY_STORAGE_PREFIX = ler('NEXT_PUBLIC_LEGACY_STORAGE_PREFIX')
/** Prefixo das classes CSS que o plugin de blocos grava no HTML dos posts. */
export const BLOCK_CSS_PREFIX = ler('NEXT_PUBLIC_BLOCK_CSS_PREFIX')
/** Segundo namespace de blocos, usado por alguns blocos mais antigos. */
export const BLOCK_ALT_PREFIX = ler('NEXT_PUBLIC_BLOCK_ALT_PREFIX')
/** Prefixo das metricas Prometheus expostas em /api/metrics. */
export const METRICS_PREFIX = ler('NEXT_PUBLIC_METRICS_PREFIX')

/** Chave de armazenamento no navegador: `${prefixo}_${nome}`. */
export const storageKey = (nome) => `${STORAGE_PREFIX}_${nome}`
export const legacyStorageKey = (nome) => `${LEGACY_STORAGE_PREFIX}_${nome}`
/** Namespace das rotas REST proprias do plugin: `<namespace>/redirects` etc. */
export const WP_API_NAMESPACE = ler('NEXT_PUBLIC_WP_API_NAMESPACE')
/** Origem do Umami, servido em primeira parte via rewrite (next.config.mjs). */
export const UMAMI_ORIGIN = semBarraFinal(ler('NEXT_PUBLIC_UMAMI_ORIGIN'))
/** E-mail publico de contato. */
export const CONTACT_EMAIL = ler('NEXT_PUBLIC_CONTACT_EMAIL')
/** Quem ve a barra de edicao do WordPress no site (lista separada por virgula). */
export const ADMIN_EMAILS = ler('NEXT_PUBLIC_ADMIN_EMAILS').split(',').map((e) => e.trim()).filter(Boolean)
/** Publisher do AdSense (`ca-pub-...`); vazio omite a verificacao por meta tag. */
export const ADSENSE_CLIENT = ler('NEXT_PUBLIC_ADSENSE_CLIENT')
