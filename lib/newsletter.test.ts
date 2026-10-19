import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { emailValido, gerarToken, verificarToken, newsletterConfigurada } from './newsletter'

describe('newsletter', () => {
    beforeEach(() => { process.env.RESEND_API_KEY = 'chave-de-teste'; process.env.RESEND_AUDIENCE_ID = 'aud' })
    afterEach(() => { delete process.env.RESEND_API_KEY; delete process.env.RESEND_AUDIENCE_ID; delete process.env.NEWSLETTER_SECRET })

    it('valida e-mails', () => {
        expect(emailValido('fa@exemplo.com.br')).toBe(true)
        for (const ruim of ['', 'sem-arroba', 'a@b', 'a b@c.com', 123, null]) expect(emailValido(ruim)).toBe(false)
    })

    it('token faz ida e volta, em minúsculas', () => {
        const t = gerarToken('Fa@Exemplo.com')!
        expect(verificarToken(t)).toBe('fa@exemplo.com')
    })

    it('rejeita token adulterado, vencido ou de outro segredo', () => {
        const t = gerarToken('fa@exemplo.com', 1000)!
        expect(verificarToken(t, 1000 + 49 * 3600 * 1000)).toBeNull()
        const [carga, ass] = t.split('.')
        const outro = Buffer.from(JSON.stringify({ e: 'outro@exemplo.com', x: 9e15 })).toString('base64url')
        expect(verificarToken(`${outro}.${ass}`)).toBeNull()
        expect(verificarToken(`${carga}.${ass.slice(0, -2)}xx`)).toBeNull()
        const valido = gerarToken('fa@exemplo.com')!
        process.env.RESEND_API_KEY = 'outra'
        expect(verificarToken(valido)).toBeNull()
    })

    it('só liga com as duas variáveis', () => {
        expect(newsletterConfigurada()).toBe(true)
        delete process.env.RESEND_AUDIENCE_ID
        expect(newsletterConfigurada()).toBe(false)
    })
})
