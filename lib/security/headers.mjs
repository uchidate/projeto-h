import { buildCsp, buildReportingEndpoints } from './csp.mjs'

/**
 * Políticas globais conservadoras.
 *
 * A CSP entrou em 2026-09-11 e está em REPORT-ONLY: ela reporta violação e não
 * bloqueia nada. O site é monetizado por AdSense, que injeta domínios conforme
 * o anúncio servido — publicar uma política que bloqueia de verdade, sem dados,
 * derrubaria receita em silêncio. Ver lib/security/csp.mjs.
 */
export const SECURITY_HEADERS = Object.freeze([
    { key: 'Content-Security-Policy-Report-Only', value: buildCsp() },
    { key: 'Reporting-Endpoints', value: buildReportingEndpoints() },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
])
