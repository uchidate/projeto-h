// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { GoogleTagScript } from './GoogleTagScript'

/**
 * O que estes testes protegem.
 *
 * Adiar o Google Tag economiza 174 KB em ~95% dos carregamentos, mas tem uma
 * armadilha: no EEE quem pergunta é o CMP certificado do Google, que NÃO
 * escreve no nosso localStorage. Olhar só a decisão local cortaria exatamente
 * o tráfego consentido europeu — a população onde o GA ainda funciona.
 *
 * Por isso a regra tem duas pernas, e cada uma tem teste.
 */

vi.mock('next/script', () => ({
    default: ({ src, children }: { src?: string; children?: unknown }) =>
        <script data-src={src ?? 'inline'}>{String(children ?? '')}</script>,
}))

const estado = { cmp: false, decisao: null as 'granted' | 'denied' | null }

vi.mock('@/lib/consent', () => ({
    hasCertifiedCmp: () => estado.cmp,
    readConsent: () => (estado.decisao ? { decision: estado.decisao, at: '' } : null),
    subscribeBanner: () => () => {},
}))

beforeEach(() => { estado.cmp = false; estado.decisao = null })
afterEach(() => { vi.clearAllMocks() })

const carregou = (c: HTMLElement) => c.querySelectorAll('script').length > 0

describe('GoogleTagScript', () => {
    it('NÃO carrega para visitante que ainda não decidiu', () => {
        const { container } = render(<GoogleTagScript id="G-TESTE" />)
        expect(carregou(container)).toBe(false)
    })

    it('NÃO carrega para quem recusou', () => {
        estado.decisao = 'denied'
        const { container } = render(<GoogleTagScript id="G-TESTE" />)
        expect(carregou(container)).toBe(false)
    })

    it('carrega para quem aceitou no banner local', () => {
        estado.decisao = 'granted'
        const { container } = render(<GoogleTagScript id="G-TESTE" />)
        expect(carregou(container)).toBe(true)
        expect(container.innerHTML).toContain('G-TESTE')
    })

    it('carrega sob CMP certificado mesmo sem decisão local — o caso do EEE', () => {
        estado.cmp = true
        const { container } = render(<GoogleTagScript id="G-TESTE" />)
        // Era isto que uma versão ingênua quebraria: no EEE o consentimento
        // vive nos sinais TCF, não no nosso localStorage.
        expect(carregou(container)).toBe(true)
    })
})
