import { createHmac, timingSafeEqual } from 'node:crypto'

const VALIDADE_MS = 48 * 60 * 60 * 1000
const EMAIL = /^[^\s@]{1,64}@[^\s@.]+(\.[^\s@.]+)+$/

export function emailValido(valor: unknown): valor is string {
    return typeof valor === 'string' && valor.length <= 254 && EMAIL.test(valor.trim())
}

/** Segredo de assinatura: dedicado quando existir, senão a própria chave do Resend. */
function segredo(): string | null {
    return process.env.NEWSLETTER_SECRET || process.env.RESEND_API_KEY || null
}

/** A newsletter só liga quando as duas variáveis do Resend estão no servidor. */
export function newsletterConfigurada(): boolean {
    return !!process.env.RESEND_API_KEY && !!process.env.RESEND_AUDIENCE_ID
}

const assinar = (carga: string, chave: string) => createHmac('sha256', chave).update(carga).digest('base64url')

/** Token do link de confirmação: e-mail + validade, assinado. Não precisa de banco. */
export function gerarToken(email: string, agora = Date.now()): string | null {
    const chave = segredo()
    if (!chave) return null
    const carga = Buffer.from(JSON.stringify({ e: email.trim().toLowerCase(), x: agora + VALIDADE_MS })).toString('base64url')
    return `${carga}.${assinar(carga, chave)}`
}

/** Devolve o e-mail se o token é autêntico e está no prazo; senão null. */
export function verificarToken(token: string, agora = Date.now()): string | null {
    const chave = segredo()
    const [carga, assinatura] = token.split('.')
    if (!chave || !carga || !assinatura) return null
    const esperado = assinar(carga, chave)
    const a = Buffer.from(assinatura)
    const b = Buffer.from(esperado)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    try {
        const { e, x } = JSON.parse(Buffer.from(carga, 'base64url').toString('utf-8')) as { e?: string; x?: number }
        return typeof e === 'string' && typeof x === 'number' && x > agora && emailValido(e) ? e : null
    } catch {
        return null
    }
}
