import { describe, it, expect } from 'vitest'
import { clientIp, clientIpOrUnknown } from './clientIp'

describe('clientIp', () => {
    it('lê de Headers (NextRequest)', () => {
        const headers = new Headers({ 'x-forwarded-for': '203.0.113.7' })
        expect(clientIp(headers)).toBe('203.0.113.7')
    })

    it('lê do objeto simples do NextAuth', () => {
        expect(clientIp({ 'x-forwarded-for': '203.0.113.7' })).toBe('203.0.113.7')
    })

    // O motivo de o helper existir: a cadeia inteira como chave muda conforme a
    // rota da requisição e qualquer contagem baseada nela nunca fecha.
    it('devolve só o primeiro salto da cadeia', () => {
        const headers = new Headers({ 'x-forwarded-for': '203.0.113.7, 172.16.0.1, 10.0.0.1' })
        expect(clientIp(headers)).toBe('203.0.113.7')
    })

    it('aceita header repetido como array', () => {
        expect(clientIp({ 'x-forwarded-for': ['203.0.113.7, 10.0.0.1', '10.0.0.2'] })).toBe('203.0.113.7')
    })

    it('cai para x-real-ip quando não há forwarded', () => {
        expect(clientIp(new Headers({ 'x-real-ip': '198.51.100.4' }))).toBe('198.51.100.4')
    })

    it('devolve null sem cabeçalho — não inventa origem', () => {
        expect(clientIp(new Headers())).toBeNull()
        expect(clientIp(undefined)).toBeNull()
    })

    it('clientIpOrUnknown rotula a ausência em vez de devolver null', () => {
        expect(clientIpOrUnknown(new Headers())).toBe('unknown')
    })
})
