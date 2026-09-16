// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BlogTextShare } from './BlogTextShare'

function mockSelection(text: string | null) {
    const getRangeAt = vi.fn().mockReturnValue({
        getBoundingClientRect: () => ({ left: 100, top: 200, width: 50 }),
    })
    vi.spyOn(window, 'getSelection').mockReturnValue(
        text === null
            ? null
            : ({ toString: () => text, getRangeAt } as unknown as Selection),
    )
}

describe('BlogTextShare', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })
    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('não mostra nada inicialmente', () => {
        const { container } = render(<BlogTextShare shareUrl="https://x.com/post" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('seleção de texto válida (10-280 chars) mostra o popup de compartilhar', () => {
        mockSelection('Um trecho de texto selecionado com mais de dez caracteres')
        render(<BlogTextShare shareUrl="https://x.com/post" />)

        fireEvent.mouseUp(document)
        act(() => vi.advanceTimersByTime(200))

        expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    })

    it('seleção curta demais (< 10 chars) não mostra o popup', () => {
        mockSelection('curto')
        render(<BlogTextShare shareUrl="https://x.com/post" />)

        fireEvent.mouseUp(document)
        act(() => vi.advanceTimersByTime(200))

        expect(screen.queryByText('WhatsApp')).not.toBeInTheDocument()
    })

    it('seleção longa demais (> 280 chars) não mostra o popup', () => {
        mockSelection('a'.repeat(281))
        render(<BlogTextShare shareUrl="https://x.com/post" />)

        fireEvent.mouseUp(document)
        act(() => vi.advanceTimersByTime(200))

        expect(screen.queryByText('WhatsApp')).not.toBeInTheDocument()
    })

    it('sem seleção nenhuma, não mostra o popup', () => {
        mockSelection(null)
        render(<BlogTextShare shareUrl="https://x.com/post" />)

        fireEvent.mouseUp(document)
        act(() => vi.advanceTimersByTime(200))

        expect(screen.queryByText('WhatsApp')).not.toBeInTheDocument()
    })

    it('o link do WhatsApp inclui o texto selecionado e a shareUrl codificados', () => {
        mockSelection('Trecho selecionado interessante')
        render(<BlogTextShare shareUrl="https://example.com/blog/post" />)

        fireEvent.mouseUp(document)
        act(() => vi.advanceTimersByTime(200))

        const link = screen.getByRole('link', { name: /whatsapp/i })
        expect(link.getAttribute('href')).toContain(encodeURIComponent('Trecho selecionado interessante'))
        expect(link.getAttribute('href')).toContain(encodeURIComponent('https://example.com/blog/post'))
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('selectionchange com seleção vazia esconde o popup', () => {
        mockSelection('Um trecho de texto selecionado com mais de dez caracteres')
        render(<BlogTextShare shareUrl="https://x.com/post" />)
        fireEvent.mouseUp(document)
        act(() => vi.advanceTimersByTime(200))
        expect(screen.getByText('WhatsApp')).toBeInTheDocument()

        mockSelection('')
        fireEvent(document, new Event('selectionchange'))
        expect(screen.queryByText('WhatsApp')).not.toBeInTheDocument()
    })
})
