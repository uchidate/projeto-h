// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareBar } from './ShareBar'

describe('ShareBar', () => {
    it('monta o link do WhatsApp com título e URL codificados', () => {
        render(<ShareBar url="https://example.com/blog/post" title="Meu Post" />)
        const link = screen.getByRole('link', { name: /compartilhar no whatsapp/i })
        expect(link.getAttribute('href')).toContain(encodeURIComponent('Meu Post'))
        expect(link.getAttribute('href')).toContain(encodeURIComponent('https://example.com/blog/post'))
    })

    // Até 2026-09-13 o link compartilhado ia sem origem, e a volta pelo
    // WhatsApp chegava como tráfego direto. Cada rede agora leva o próprio UTM.
    it('monta o link do Facebook com a URL marcada pela origem', () => {
        render(<ShareBar url="https://example.com/blog/post" title="Meu Post" />)
        const href = screen.getByRole('link', { name: /compartilhar no facebook/i }).getAttribute('href')!
        const compartilhada = new URL(new URL(href).searchParams.get('u')!)
        expect(compartilhada.origin + compartilhada.pathname).toBe('https://example.com/blog/post')
        expect(compartilhada.searchParams.get('utm_source')).toBe('facebook')
        expect(compartilhada.searchParams.get('utm_medium')).toBe('share')
        expect(compartilhada.searchParams.get('utm_campaign')).toBe('post')
    })

    it('o link do WhatsApp leva utm_source=whatsapp', () => {
        render(<ShareBar url="https://example.com/blog/post" title="Meu Post" />)
        const href = screen.getByRole('link', { name: /compartilhar no whatsapp/i }).getAttribute('href')!
        expect(decodeURIComponent(href)).toContain('utm_source=whatsapp')
    })

    it('abre os links de compartilhamento em nova aba com rel seguro', () => {
        render(<ShareBar url="https://x.com" title="X" />)
        for (const link of screen.getAllByRole('link')) {
            expect(link).toHaveAttribute('target', '_blank')
            expect(link).toHaveAttribute('rel', 'noopener noreferrer')
        }
    })

    it('clicar em copiar link copia a URL e mostra confirmação', async () => {
        const user = userEvent.setup()
        render(<ShareBar url="https://example.com/x" title="X" />)
        const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText')
        await user.click(screen.getByRole('button', { name: /copiar link/i }))
        const copiada = new URL(writeTextSpy.mock.calls[0][0] as string)
        expect(copiada.origin + copiada.pathname).toBe('https://example.com/x')
        expect(copiada.searchParams.get('utm_source')).toBe('copiar_link')
        expect(await screen.findByText(/link copiado!/i)).toBeInTheDocument()
    })

    it('modo vertical (horizontal=false) mostra o rótulo "Compartilhar" acima e não mostra o texto de status ao lado', () => {
        render(<ShareBar url="https://x.com" title="X" horizontal={false} />)
        expect(screen.getByText('Compartilhar')).toBeInTheDocument()
        expect(screen.queryByText(/^compartilhar$/i, { selector: 'span.ml-1' })).not.toBeInTheDocument()
    })

    it('modo horizontal (default) mostra "Compartilhar" ao lado dos botões', () => {
        render(<ShareBar url="https://x.com" title="X" />)
        const status = screen.getByText('Compartilhar', { selector: 'span.ml-1' })
        expect(status).toBeInTheDocument()
    })

    it('pode ocultar apenas o rótulo lateral e preserva alvos mínimos nos controles', () => {
        render(<ShareBar url="https://x.com" title="X" showLabel={false} />)
        expect(screen.queryByText('Compartilhar')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: /copiar link/i })).toHaveClass('touch-target')
        expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveClass('touch-target')
    })
})
