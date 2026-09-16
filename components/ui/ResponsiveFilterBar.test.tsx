// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResponsiveFilterBar } from './ResponsiveFilterBar'

describe('ResponsiveFilterBar', () => {
    it('mostra o label e não mostra o value quando ausente', () => {
        render(<ResponsiveFilterBar label="Filtros"><button>Opção</button></ResponsiveFilterBar>)
        expect(screen.getAllByText('Filtros').length).toBeGreaterThan(0)
    })

    it('mostra o value junto do label quando presente', () => {
        render(<ResponsiveFilterBar label="Gênero" value="Romance"><button>Opção</button></ResponsiveFilterBar>)
        expect(screen.getByText('Romance')).toBeInTheDocument()
    })

    it('o painel mobile começa fechado (aria-expanded=false)', () => {
        render(<ResponsiveFilterBar label="Filtros"><button>Opção</button></ResponsiveFilterBar>)
        expect(screen.getByRole('button', { name: /filtros/i })).toHaveAttribute('aria-expanded', 'false')
    })

    it('clicar no toggle abre o painel mobile (aria-expanded=true)', async () => {
        const user = userEvent.setup()
        render(<ResponsiveFilterBar label="Filtros"><button>Opção</button></ResponsiveFilterBar>)
        await user.click(screen.getByRole('button', { name: /filtros/i }))
        expect(screen.getByRole('button', { name: /filtros/i })).toHaveAttribute('aria-expanded', 'true')
        expect(screen.getAllByRole('button', { name: 'Opção' }).length).toBeGreaterThan(0)
    })

    it('clicar de novo no toggle fecha o painel', async () => {
        const user = userEvent.setup()
        render(<ResponsiveFilterBar label="Filtros"><button>Opção</button></ResponsiveFilterBar>)
        const toggle = screen.getByRole('button', { name: /filtros/i })
        await user.click(toggle)
        await user.click(toggle)
        expect(toggle).toHaveAttribute('aria-expanded', 'false')
    })

    it('clicar numa opção (button/a/select) dentro do painel fecha o menu mobile', async () => {
        const user = userEvent.setup()
        render(
            <ResponsiveFilterBar label="Filtros">
                <button>Uma opção</button>
            </ResponsiveFilterBar>,
        )
        await user.click(screen.getByRole('button', { name: /filtros/i }))
        expect(screen.getByRole('button', { name: /filtros/i })).toHaveAttribute('aria-expanded', 'true')

        const panel = document.getElementById('responsive-filter-menu')!
        await user.click(within(panel).getByRole('button', { name: 'Uma opção' }))
        expect(screen.getByRole('button', { name: /filtros/i })).toHaveAttribute('aria-expanded', 'false')
    })

    it('clicar num texto não-interativo dentro do painel não fecha o menu', async () => {
        const user = userEvent.setup()
        render(
            <ResponsiveFilterBar label="Filtros">
                <span>Texto não clicável</span>
            </ResponsiveFilterBar>,
        )
        await user.click(screen.getByRole('button', { name: /filtros/i }))
        const panel = document.getElementById('responsive-filter-menu')!
        await user.click(within(panel).getByText('Texto não clicável'))
        expect(screen.getByRole('button', { name: /filtros/i })).toHaveAttribute('aria-expanded', 'true')
    })

    it('define a variável CSS --section-bar-h ao montar e remove ao desmontar', () => {
        const { unmount } = render(<ResponsiveFilterBar label="Filtros"><button>Opção</button></ResponsiveFilterBar>)
        expect(document.documentElement.style.getPropertyValue('--section-bar-h')).toBe('52px')
        unmount()
        expect(document.documentElement.style.getPropertyValue('--section-bar-h')).toBe('')
    })
})
