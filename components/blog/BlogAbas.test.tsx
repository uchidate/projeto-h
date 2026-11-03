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
})
