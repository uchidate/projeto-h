import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildCsp, buildReportingEndpoints } from './csp.mjs'
import { SECURITY_HEADERS } from './headers.mjs'

const diretivas = new Map(
    buildCsp().split('; ').map(parte => {
        const [nome, ...valores] = parte.split(' ')
        return [nome, valores] as const
    }),
)
const cabecalho = (chave: string) => SECURITY_HEADERS.find(h => h.key === chave)?.value

describe('CSP', () => {
    it('segue só reportando: bloquear de verdade é decisão, não efeito de uma edição', () => {
        expect(cabecalho('Content-Security-Policy-Report-Only')).toBe(buildCsp())
        expect(cabecalho('Content-Security-Policy')).toBeUndefined()
    })

    it('não repete diretiva, porque o navegador ignora a segunda', () => {
        expect(diretivas.size).toBe(buildCsp().split('; ').length)
    })

    it('não abre origem genérica nem sem https', () => {
        for (const [nome, valores] of diretivas) {
            for (const v of valores) {
                expect(v, nome).not.toMatch(/^(\*|https?:|http:\/\/.*)$/)
                expect(v, nome).not.toContain('*')
            }
        }
    })

    it('ninguém coloca o site em iframe, e plugins e base externa ficam fora', () => {
        expect(diretivas.get('frame-ancestors')).toEqual(["'none'"])
        expect(diretivas.get('object-src')).toEqual(["'none'"])
        expect(diretivas.get('base-uri')).toEqual(["'self'"])
        expect(diretivas.get('form-action')).toEqual(["'self'"])
        expect(cabecalho('X-Frame-Options')).toBe('DENY')
    })

    it('libera os embeds que os artigos usam', () => {
        expect(diretivas.get('frame-src')).toEqual(expect.arrayContaining([
            'https://www.youtube-nocookie.com',
            'https://open.spotify.com',
            'https://www.instagram.com',
            'https://platform.twitter.com',
            'https://www.tiktok.com',
        ]))
    })

    it('manda o relatório para uma rota que existe, pelos dois mecanismos', () => {
        expect(diretivas.get('report-uri')).toEqual(['/api/csp-report'])
        expect(diretivas.get('report-to')).toEqual(['csp'])
        expect(buildReportingEndpoints()).toBe('csp="/api/csp-report"')
        expect(cabecalho('Reporting-Endpoints')).toBe(buildReportingEndpoints())
        expect(existsSync('app/api/csp-report/route.ts')).toBe(true)
    })
})
