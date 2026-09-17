import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { POST } from './route'

/**
 * O que estes testes protegem.
 *
 * O endpoint coletou 42 violações em uma semana e registrou todas como
 * `diretiva=desconhecida origem=desconhecido`: ele só lia as chaves em
 * kebab-case do `report-uri` legado, e os navegadores atuais mandam camelCase
 * pela Reporting API do `report-to`.
 *
 * Nada acusou. O endpoint respondia 204, escrevia no log e parecia saudável —
 * um teste com payload no formato REAL era a única coisa que teria mostrado
 * que a informação nunca chegava.
 */

const requisicao = (corpo: unknown, tipo = 'application/csp-report') =>
    new Request('https://exemplo/api/csp-report', {
        method: 'POST',
        headers: { 'content-type': tipo },
        body: JSON.stringify(corpo),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- o teste monta corpo inválido de propósito, que é o caso que a rota precisa recusar
    }) as any

let avisos: string[]

beforeEach(() => {
    avisos = []
    vi.spyOn(console, 'warn').mockImplementation((m: unknown) => { avisos.push(String(m)) })
})
afterEach(() => { vi.restoreAllMocks() })

describe('endpoint de relatório CSP', () => {
    it('extrai diretiva e origem do formato report-uri (kebab-case)', async () => {
        const r = await POST(requisicao({
            'csp-report': {
                'effective-directive': 'script-src',
                'blocked-uri': 'https://malicioso.exemplo/x.js',
                'document-uri': 'https://www.example.com/blog/a',
            },
        }))
        expect(r.status).toBe(204)
        expect(avisos.join('\n')).toContain('diretiva=script-src')
        expect(avisos.join('\n')).toContain('origem=https://malicioso.exemplo')
    })

    it('extrai diretiva e origem do formato Reporting API (camelCase)', async () => {
        const r = await POST(requisicao([{
            type: 'csp-violation',
            body: {
                effectiveDirective: 'img-src',
                blockedURL: 'https://cdn.terceiro.exemplo/foto.png',
                documentURL: 'https://www.example.com/artists/iu',
            },
        }], 'application/reports+json'))
        expect(r.status).toBe(204)
        // Era exatamente isto que falhava em produção: chegava "desconhecida".
        expect(avisos.join('\n')).toContain('diretiva=img-src')
        expect(avisos.join('\n')).toContain('origem=https://cdn.terceiro.exemplo')
        expect(avisos.join('\n')).not.toContain('desconhecida')
    })

    it('aceita corpo ilegível sem virar erro', async () => {
        const r = await POST(new Request('https://exemplo/api/csp-report', {
            method: 'POST',
            body: 'nao e json',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- o teste monta corpo inválido de propósito, que é o caso que a rota precisa recusar
        }) as any)
        expect(r.status).toBe(204)
    })

    it('agrupa por origem, não por página, ao limitar a taxa', async () => {
        for (let i = 0; i < 12; i++) {
            await POST(requisicao([{
                body: {
                    effectiveDirective: 'font-src',
                    blockedURL: 'https://fontes.exemplo/f.woff2',
                    documentURL: `https://www.example.com/p/${i}`,
                },
            }], 'application/reports+json'))
        }
        const violacoes = avisos.filter((a) => a.includes('violacao diretiva=font-src'))
        // Doze páginas distintas, uma única origem: o log não pode ter doze linhas.
        expect(violacoes.length).toBeLessThanOrEqual(5)
    })
})
