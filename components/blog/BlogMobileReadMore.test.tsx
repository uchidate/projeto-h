// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BlogMobileReadMore } from './BlogMobileReadMore'

describe('BlogMobileReadMore', () => {
    it('mostra o botão "Saiba mais" por padrão', () => {
        render(<BlogMobileReadMore><p>Conteúdo</p></BlogMobileReadMore>)
        expect(screen.getByRole('button', { name: /saiba mais/i })).toBeInTheDocument()
    })

    it('clicar em "Saiba mais" expande e remove o botão', async () => {
        const user = userEvent.setup()
        render(<BlogMobileReadMore><p>Conteúdo</p></BlogMobileReadMore>)
        await user.click(screen.getByRole('button', { name: /saiba mais/i }))
        expect(screen.queryByRole('button', { name: /saiba mais/i })).not.toBeInTheDocument()
    })

    it('mantém uma única cópia do conteúdo no DOM', () => {
        render(<BlogMobileReadMore><p>Texto único</p></BlogMobileReadMore>)
        expect(screen.getAllByText('Texto único')).toHaveLength(1)
    })

    it('expõe gateHeight como variável do container antes de expandir', () => {
        const { container } = render(<BlogMobileReadMore gateHeight={500}><p>X</p></BlogMobileReadMore>)
        const gated = container.querySelector<HTMLElement>('[style*="--mobile-gate-height"]')
        expect(gated).toHaveStyle({ '--mobile-gate-height': '500px' })
        expect(gated?.className).toContain('max-lg:max-h-(--mobile-gate-height)')
    })

    it('após expandir remove o limite de altura sem duplicar o conteúdo', async () => {
        const user = userEvent.setup()
        const { container } = render(<BlogMobileReadMore gateHeight={500}><p>X</p></BlogMobileReadMore>)
        await user.click(screen.getByRole('button', { name: /saiba mais/i }))
        const gated = container.querySelector<HTMLElement>('[style*="--mobile-gate-height"]')
        expect(gated?.className).not.toContain('max-lg:max-h-(--mobile-gate-height)')
        expect(screen.getAllByText('X')).toHaveLength(1)
    })
})
