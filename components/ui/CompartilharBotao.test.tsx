// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CompartilharBotao } from './CompartilharBotao'

const props = { url: 'https://www.hallyuhub.com.br/productions/x', title: 'X' }

afterEach(() => { vi.restoreAllMocks(); Reflect.deleteProperty(navigator, 'share') })

describe('CompartilharBotao', () => {
    it('sem folha nativa: abre o menu com WhatsApp, Facebook e copiar link', () => {
        render(<CompartilharBotao {...props} />)
        expect(screen.queryByRole('menu')).toBeNull()
        fireEvent.click(screen.getByRole('button'))
        expect(screen.getByRole('menu')).toBeInTheDocument()
        expect(decodeURIComponent(screen.getByRole('menuitem', { name: /WhatsApp/ }).getAttribute('href') ?? '')).toContain('utm_source=whatsapp')
        expect(screen.getByRole('menuitem', { name: /Facebook/ })).toBeInTheDocument()
    })

    it('com navigator.share: usa a folha nativa e não abre o menu', () => {
        const share = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, 'share', { value: share, configurable: true })
        render(<CompartilharBotao {...props} />)
        fireEvent.click(screen.getByRole('button'))
        expect(share).toHaveBeenCalledTimes(1)
        expect(share.mock.calls[0][0].url).toContain('utm_source=nativo')
        expect(screen.queryByRole('menu')).toBeNull()
    })

    it('Escape fecha o menu', () => {
        render(<CompartilharBotao {...props} />)
        fireEvent.click(screen.getByRole('button'))
        fireEvent.keyDown(document, { key: 'Escape' })
        expect(screen.queryByRole('menu')).toBeNull()
    })
})
