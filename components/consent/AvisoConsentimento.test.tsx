// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import client from '@/messages/pt/client.json'

const consent = vi.hoisted(() => ({ pode: false, banner: 'oculto' as 'oculto' | 'perguntar', reset: vi.fn() }))
vi.mock('@/lib/consent', () => ({
    podeGuardarHistorico: () => consent.pode,
    getBannerState: () => consent.banner,
    getServerBannerState: () => 'oculto',
    subscribeConsent: () => () => {},
    subscribeBanner: () => () => {},
    resetConsent: consent.reset,
}))

import { AvisoConsentimento } from './AvisoConsentimento'

const renderizar = (recurso: 'sequencia' | 'placar') => render(
    <NextIntlClientProvider locale="pt" messages={{ client }}><AvisoConsentimento recurso={recurso} /></NextIntlClientProvider>,
)

describe('AvisoConsentimento', () => {
    beforeEach(() => { consent.pode = false; consent.banner = 'oculto'; consent.reset.mockClear() })

    it('explica o motivo e diz o que se quer guardar', () => {
        renderizar('sequencia')
        expect(screen.getByRole('note')).toHaveTextContent(/guardar sua sequência de dias/)
    })

    it('reabre a escolha de consentimento ao clicar em rever', async () => {
        renderizar('placar')
        await userEvent.click(screen.getByRole('button', { name: /Rever minha escolha/ }))
        expect(consent.reset).toHaveBeenCalledTimes(1)
    })

    it('não aparece quando já pode guardar', () => {
        consent.pode = true
        renderizar('placar')
        expect(screen.queryByRole('note')).toBeNull()
    })

    it('não aparece enquanto o banner de cookies já está aberto', () => {
        consent.banner = 'perguntar'
        renderizar('placar')
        expect(screen.queryByRole('note')).toBeNull()
    })
})
