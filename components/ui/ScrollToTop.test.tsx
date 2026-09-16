// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScrollToTop } from './ScrollToTop'

describe('ScrollToTop', () => {
    it('não renderiza nada quando o scroll está abaixo de 600px', () => {
        const { container } = render(<ScrollToTop />)
        expect(container).toBeEmptyDOMElement()
    })

    it('renderiza o botão quando o scroll passa de 600px', () => {
        render(<ScrollToTop />)
        Object.defineProperty(window, 'scrollY', { value: 700, configurable: true })
        fireEvent.scroll(window)
        expect(screen.getByRole('button', { name: /voltar ao topo/i })).toBeInTheDocument()
    })

    it('esconde de novo quando o scroll volta abaixo de 600px', () => {
        render(<ScrollToTop />)
        Object.defineProperty(window, 'scrollY', { value: 700, configurable: true })
        fireEvent.scroll(window)
        expect(screen.getByRole('button')).toBeInTheDocument()

        Object.defineProperty(window, 'scrollY', { value: 100, configurable: true })
        fireEvent.scroll(window)
        expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('clicar chama window.scrollTo suave pro topo', async () => {
        const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
        render(<ScrollToTop />)
        Object.defineProperty(window, 'scrollY', { value: 700, configurable: true })
        fireEvent.scroll(window)

        const user = userEvent.setup()
        await user.click(screen.getByRole('button', { name: /voltar ao topo/i }))
        expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })
})
