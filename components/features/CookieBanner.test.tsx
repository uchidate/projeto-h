// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CookieBanner } from './CookieBanner'
import { CONSENT_STORAGE_KEY, CONSENT_EVENT, resetConsent, __resetCmpParaTeste } from '@/lib/consent'

/** Funding Choices: define __tcfapi em todo visitante e responde gdprApplies. */
function instalarFundingChoices(gdprApplies: boolean) {
    ;(window as unknown as { __tcfapi?: unknown }).__tcfapi = (
        comando: string,
        _v: number,
        cb: (d: { gdprApplies: boolean } | null, ok: boolean) => void,
    ) => {
        if (comando === 'addEventListener') cb({ gdprApplies }, true)
    }
}

function lerDecisao() {
    const bruto = localStorage.getItem(CONSENT_STORAGE_KEY)
    return bruto ? (JSON.parse(bruto) as { decision: string }).decision : null
}

describe('CookieBanner', () => {
    beforeEach(() => {
        localStorage.clear()
        delete (window as unknown as { __tcfapi?: unknown }).__tcfapi
        window.dataLayer = []
        __resetCmpParaTeste()
        // Padrão dos testes: tráfego brasileiro — o Funding Choices está lá,
        // mas responde que o GDPR não se aplica e não exibe mensagem.
        instalarFundingChoices(false)
    })

    it('mostra o banner quando não há decisão registrada', () => {
        render(<CookieBanner />)
        expect(screen.getByRole('button', { name: /aceitar/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /recusar/i })).toBeInTheDocument()
    })

    it('não mostra o banner se a decisão já foi registrada', () => {
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ decision: 'denied', at: '2026-08-25T00:00:00.000Z' }))
        render(<CookieBanner />)
        expect(screen.queryByRole('button', { name: /aceitar/i })).not.toBeInTheDocument()
    })

    it('Aceitar grava o consentimento e esconde o banner', async () => {
        const user = userEvent.setup()
        render(<CookieBanner />)
        await user.click(screen.getByRole('button', { name: /aceitar/i }))
        expect(lerDecisao()).toBe('granted')
        expect(screen.queryByRole('button', { name: /aceitar/i })).not.toBeInTheDocument()
    })

    it('Recusar grava a recusa e esconde o banner', async () => {
        const user = userEvent.setup()
        render(<CookieBanner />)
        await user.click(screen.getByRole('button', { name: /recusar/i }))
        expect(lerDecisao()).toBe('denied')
        expect(screen.queryByRole('button', { name: /recusar/i })).not.toBeInTheDocument()
    })

    it('não aceita automaticamente ao rolar a página', () => {
        render(<CookieBanner />)
        Object.defineProperty(window, 'scrollY', { value: 400, configurable: true })
        act(() => {
            window.dispatchEvent(new Event('scroll'))
        })
        expect(lerDecisao()).toBeNull()
        expect(screen.getByRole('button', { name: /aceitar/i })).toBeInTheDocument()
    })

    it('reabre o banner quando o usuário apaga a escolha na página de privacidade', () => {
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ decision: 'granted', at: '2026-08-25T00:00:00.000Z' }))
        render(<CookieBanner />)
        expect(screen.queryByRole('button', { name: /aceitar/i })).not.toBeInTheDocument()

        act(() => {
            resetConsent()
        })
        expect(screen.getByRole('button', { name: /aceitar/i })).toBeInTheDocument()
    })

    it('cede a vez ao CMP do Google quando o GDPR se aplica ao visitante', () => {
        __resetCmpParaTeste()
        instalarFundingChoices(true)
        render(<CookieBanner />)
        expect(screen.queryByRole('button', { name: /aceitar/i })).not.toBeInTheDocument()
    })

    it('pergunta mesmo com __tcfapi presente quando o GDPR não se aplica', () => {
        // O Funding Choices instala o __tcfapi em todo visitante, inclusive no
        // Brasil, onde não exibe mensagem nenhuma. Tratar a presença da API
        // como "o Google assume" deixaria esse tráfego sem consentimento algum.
        instalarFundingChoices(false)
        render(<CookieBanner />)
        expect(screen.getByRole('button', { name: /aceitar/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /recusar/i })).toBeInTheDocument()
    })

    it('espera o CMP antes de perguntar, e some se ele assumir (script atrasado)', () => {
        delete (window as unknown as { __tcfapi?: unknown }).__tcfapi
        vi.useFakeTimers()
        try {
            render(<CookieBanner />)
            // Fica calado enquanto o CMP pode ainda estar a caminho, para não
            // piscar na cara de quem o Google vai perguntar de qualquer jeito.
            expect(screen.queryByRole('button', { name: /aceitar/i })).not.toBeInTheDocument()

            instalarFundingChoices(true)
            act(() => {
                vi.advanceTimersByTime(400)
            })
            expect(screen.queryByRole('button', { name: /aceitar/i })).not.toBeInTheDocument()
        } finally {
            vi.useRealTimers()
        }
    })

    it('assume o consentimento se o CMP não responder dentro da janela', () => {
        delete (window as unknown as { __tcfapi?: unknown }).__tcfapi
        vi.useFakeTimers()
        try {
            render(<CookieBanner />)
            expect(screen.queryByRole('button', { name: /aceitar/i })).not.toBeInTheDocument()
            act(() => {
                vi.advanceTimersByTime(4500)
            })
            expect(screen.getByRole('button', { name: /aceitar/i })).toBeInTheDocument()
        } finally {
            vi.useRealTimers()
        }
    })

    it('o link de política de privacidade aponta para /privacidade', () => {
        render(<CookieBanner />)
        expect(screen.getByRole('link', { name: /política de privacidade/i })).toHaveAttribute('href', '/privacidade')
    })

    it('notifica o Consent Mode ao decidir', async () => {
        const user = userEvent.setup()
        const eventos: unknown[] = []
        window.addEventListener(CONSENT_EVENT, e => eventos.push((e as CustomEvent).detail))
        render(<CookieBanner />)
        await user.click(screen.getByRole('button', { name: /aceitar/i }))
        expect(eventos).toHaveLength(1)
    })

    // Destaque sim, pressão para aceitar não: pela LGPD o consentimento tem de
    // ser livre. Se um dia alguém encolher o Recusar para "converter mais", este
    // teste falha antes de o banner virar padrão enganoso.
    it('Recusar e Aceitar têm o mesmo peso de clique', () => {
        render(<CookieBanner />)
        // Só classes de TAMANHO e forma. Cor fica de fora de propósito: destacar
        // o Aceitar pela cor é permitido; o que não pode é ele ser maior.
        const tamanho = (nome: RegExp) => screen.getByRole('button', { name: nome }).className
            .split(/\s+/).filter(c => /^(w-|px-|py-|text-\[\d|font-|rounded-|border-2$)/.test(c)).sort()
        expect(tamanho(/recusar/i)).toEqual(tamanho(/aceitar/i))
    })

    it('é um diálogo modal nomeado, sobre um fundo escurecido', () => {
        const { container } = render(<CookieBanner />)
        const dialogo = screen.getByRole('dialog', { name: /sua escolha sobre cookies/i })
        expect(dialogo).toHaveAttribute('aria-modal', 'true')
        expect(container.querySelector('[aria-hidden="true"].fixed.inset-0')).not.toBeNull()
    })
})

