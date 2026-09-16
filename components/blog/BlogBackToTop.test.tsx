// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BlogBackToTop } from './BlogBackToTop'

function setScrollMetrics({ scrollY, scrollHeight, innerHeight }: { scrollY: number; scrollHeight: number; innerHeight: number }) {
    Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: scrollHeight, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: innerHeight, configurable: true })
}

describe('BlogBackToTop', () => {
    beforeEach(() => {
        setScrollMetrics({ scrollY: 0, scrollHeight: 2000, innerHeight: 1000 })
    })

    it('fica invisível (opacity-0) quando o scroll está abaixo de 35% da página', () => {
        render(<BlogBackToTop />)
        setScrollMetrics({ scrollY: 200, scrollHeight: 2000, innerHeight: 1000 })
        fireEvent.scroll(window)
        expect(screen.getByRole('button', { name: /voltar ao topo/i })).toHaveClass('opacity-0')
    })

    it('fica visível (opacity-100) quando o scroll passa de 35% da página', () => {
        render(<BlogBackToTop />)
        setScrollMetrics({ scrollY: 500, scrollHeight: 2000, innerHeight: 1000 })
        fireEvent.scroll(window)
        expect(screen.getByRole('button', { name: /voltar ao topo/i })).toHaveClass('opacity-100')
    })

    it('clicar chama window.scrollTo com behavior smooth pro topo', async () => {
        const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
        const user = userEvent.setup()
        render(<BlogBackToTop />)
        await user.click(screen.getByRole('button', { name: /voltar ao topo/i }))
        expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })
})
