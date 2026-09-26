// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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

describe('AvisoConsentimento', () => {
    beforeEach(() => { consent.pode = false; consent.banner = 'oculto'; consent.reset.mockClear() })

    it('explica o motivo e diz o que se quer guardar', () => {
        render(<AvisoConsentimento recurso="sua sequência de dias" />)
        expect(screen.getByRole('note')).toHaveTextContent(/guardar sua sequência de dias/)
    })

    it('reabre a escolha de consentimento ao clicar em rever', async () => {
        render(<AvisoConsentimento recurso="algo" />)
        await userEvent.click(screen.getByRole('button', { name: /Rever minha escolha/ }))
        expect(consent.reset).toHaveBeenCalledTimes(1)
    })

    it('não aparece quando já pode guardar', () => {
        consent.pode = true
        render(<AvisoConsentimento recurso="algo" />)
        expect(screen.queryByRole('note')).toBeNull()
    })

    it('não aparece enquanto o banner de cookies já está aberto', () => {
        consent.banner = 'perguntar'
        render(<AvisoConsentimento recurso="algo" />)
        expect(screen.queryByRole('note')).toBeNull()
    })
})
