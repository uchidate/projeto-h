// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupFactsTabbed } from './GroupFactsTabbed'

describe('GroupFactsTabbed', () => {
    it('não renderiza nada quando não há curiosidades', () => {
        const { container } = render(<GroupFactsTabbed curiosidades={[]} accent="#000" groupName="X" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('sem tabbar quando há só um tipo de conteúdo (só conquistas)', () => {
        render(<GroupFactsTabbed curiosidades={['Recorde no Guinness']} accent="#000" groupName="X" />)
        expect(screen.queryByRole('button')).not.toBeInTheDocument()
        expect(screen.getByText('1 conquista')).toBeInTheDocument()
    })

    it('sem tabbar quando há só histórico', () => {
        render(<GroupFactsTabbed curiosidades={['HISTÓRICO|2013|Debut']} accent="#000" groupName="X" />)
        expect(screen.queryByRole('button', { name: /timeline ·|conquistas ·/i })).not.toBeInTheDocument()
    })

    it('mostra as duas abas com contagem quando há histórico e conquistas', () => {
        render(<GroupFactsTabbed curiosidades={['HISTÓRICO|2013|Debut', 'Recorde no Guinness', 'Billboard Hot 100']} accent="#000" groupName="X" />)
        expect(screen.getByRole('button', { name: /timeline · 1/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /conquistas · 2/i })).toBeInTheDocument()
    })

    it('a aba de timeline vem selecionada por padrão quando existe histórico', () => {
        render(<GroupFactsTabbed curiosidades={['HISTÓRICO|2013|Debut', 'Recorde no Guinness']} accent="#000" groupName="X" />)
        expect(screen.queryByText('1 conquista')).not.toBeInTheDocument()
    })

    it('clicar na aba de conquistas troca o conteúdo exibido', async () => {
        const user = userEvent.setup()
        render(<GroupFactsTabbed curiosidades={['HISTÓRICO|2013|Debut', 'Recorde no Guinness']} accent="#000" groupName="X" />)
        await user.click(screen.getByRole('button', { name: /conquistas · 1/i }))
        expect(screen.getByText('1 conquista')).toBeInTheDocument()
    })
})
