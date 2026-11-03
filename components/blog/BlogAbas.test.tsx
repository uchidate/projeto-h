// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BlogAbas } from './BlogAbas'

const abas = [
    { id: 'ultimas', rotulo: 'Últimas', node: <p>lista das últimas</p> },
    { id: 'em-alta', rotulo: 'Em alta', node: <p>lista em alta</p> },
]

describe('BlogAbas', () => {
    it('abre na primeira aba e mantém as demais no HTML, só escondidas', () => {
        render(<BlogAbas abas={abas} rotuloDoGrupo="Últimas e em alta" />)
        expect(screen.getByRole('tab', { name: 'Últimas' })).toHaveAttribute('aria-selected', 'true')
        expect(screen.getByText('lista das últimas')).toBeVisible()
        expect(screen.getByText('lista em alta')).not.toBeVisible()
        expect(screen.getByText('lista em alta')).toBeInTheDocument()
    })

    it('troca de aba ao clicar', async () => {
        render(<BlogAbas abas={abas} rotuloDoGrupo="Últimas e em alta" />)
        await userEvent.click(screen.getByRole('tab', { name: 'Em alta' }))
        expect(screen.getByRole('tab', { name: 'Em alta' })).toHaveAttribute('aria-selected', 'true')
        expect(screen.getByText('lista em alta')).toBeVisible()
        expect(screen.getByText('lista das últimas')).not.toBeVisible()
    })

    it('troca de aba pelas setas e deixa só a ativa na ordem do Tab', async () => {
        render(<BlogAbas abas={abas} rotuloDoGrupo="Últimas e em alta" />)
        const primeira = screen.getByRole('tab', { name: 'Últimas' })
        const segunda = screen.getByRole('tab', { name: 'Em alta' })
        expect(primeira).toHaveAttribute('tabindex', '0')
        expect(segunda).toHaveAttribute('tabindex', '-1')
        primeira.focus()
        await userEvent.keyboard('{ArrowRight}')
        expect(segunda).toHaveAttribute('aria-selected', 'true')
        expect(segunda).toHaveFocus()
        await userEvent.keyboard('{ArrowRight}')
        expect(primeira).toHaveAttribute('aria-selected', 'true')
        await userEvent.keyboard('{End}')
        expect(segunda).toHaveAttribute('aria-selected', 'true')
    })
})
