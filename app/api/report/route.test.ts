import { WP_API_NAMESPACE } from '@/lib/constants/identidade.mjs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

function makeRequest(body: unknown, ip = '1.2.3.4') {
    return new NextRequest('http://localhost/api/report', {
        method: 'POST',
        headers: { 'x-forwarded-for': ip, 'content-type': 'application/json' },
        body: JSON.stringify(body),
    })
}

describe('POST /api/report', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 })))
    })

    it('aceita um report válido e repassa pro WP', async () => {
        const res = await POST(makeRequest({ target_type: 'artist', target_id: 123, category: 'foto_errada' }, '10.0.0.1'))
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/${WP_API_NAMESPACE}/report`),
            expect.objectContaining({ method: 'POST' }),
        )
    })

    it('rejeita target_type fora da allowlist', async () => {
        const res = await POST(makeRequest({ target_type: 'agency', target_id: 1, category: 'outro' }, '10.0.0.2'))
        expect(res.status).toBe(400)
    })

    it('rejeita category fora da allowlist', async () => {
        const res = await POST(makeRequest({ target_type: 'artist', target_id: 1, category: 'spam' }, '10.0.0.3'))
        expect(res.status).toBe(400)
    })

    it('rejeita target_id não-numérico ou <= 0', async () => {
        const res1 = await POST(makeRequest({ target_type: 'artist', target_id: 'abc', category: 'outro' }, '10.0.0.4'))
        expect(res1.status).toBe(400)
        const res2 = await POST(makeRequest({ target_type: 'artist', target_id: 0, category: 'outro' }, '10.0.0.5'))
        expect(res2.status).toBe(400)
    })

    it('rejeita body que não é JSON válido', async () => {
        const req = new NextRequest('http://localhost/api/report', {
            method: 'POST',
            headers: { 'x-forwarded-for': '10.0.0.6' },
            body: '{ invalido',
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it('trunca message em 1000 caracteres antes de enviar pro WP', async () => {
        const longMessage = 'x'.repeat(2000)
        await POST(makeRequest({ target_type: 'artist', target_id: 1, category: 'outro', message: longMessage }, '10.0.0.7'))
        const call = vi.mocked(fetch).mock.calls[0]
        const sentBody = JSON.parse((call[1] as RequestInit).body as string)
        expect(sentBody.message).toHaveLength(1000)
    })

    it('propaga erro do WP com o status correto', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ message: 'Erro no WP' }), { status: 500 })))
        const res = await POST(makeRequest({ target_type: 'artist', target_id: 1, category: 'outro' }, '10.0.0.8'))
        expect(res.status).toBe(500)
    })

    it('retorna 502 se o WP estiver inacessível', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network error') }))
        const res = await POST(makeRequest({ target_type: 'artist', target_id: 1, category: 'outro' }, '10.0.0.9'))
        expect(res.status).toBe(502)
    })

    // Regressão indireta: /api/report é público e sem auth por design — o rate
    // limit é a única proteção contra flood. Testa que ele existe de verdade.
    it('aplica rate limit por IP após RATE_LIMIT_MAX requisições', async () => {
        const ip = '10.0.1.1' // IP dedicado só pra este teste, não usado em outros
        const body = { target_type: 'artist' as const, target_id: 1, category: 'outro' as const }
        for (let i = 0; i < 5; i++) {
            const res = await POST(makeRequest(body, ip))
            expect(res.status).not.toBe(429)
        }
        const limited = await POST(makeRequest(body, ip))
        expect(limited.status).toBe(429)
    })

    it('conta pelo primeiro salto do x-forwarded-for, não pela cadeia inteira', async () => {
        const body = { target_type: 'artist' as const, target_id: 1, category: 'outro' as const }
        for (let i = 0; i < 5; i++) {
            const res = await POST(makeRequest(body, `10.0.2.1, 172.16.0.${i}`))
            expect(res.status).not.toBe(429)
        }
        // Mesmo cliente, proxy diferente: sem normalizar, cada cadeia virava um
        // balde novo e o limite nunca era atingido.
        const limited = await POST(makeRequest(body, '10.0.2.1, 172.16.0.99'))
        expect(limited.status).toBe(429)
    })

    it('repassa o IP do visitante pro WP para não colapsar o rate limit de lá', async () => {
        await POST(makeRequest({ target_type: 'artist', target_id: 1, category: 'outro' }, '10.0.3.1, 172.16.0.1'))
        const call = vi.mocked(fetch).mock.calls[0]
        const headers = (call[1] as RequestInit).headers as Record<string, string>
        expect(headers['X-Forwarded-For']).toBe('10.0.3.1')
    })
})
