// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GroupHeadlineStat } from './GroupHeadlineStat'

function renderStat(value: string) {
    render(<GroupHeadlineStat value={value} label="rótulo" sourceUrl="https://example.com" accent="#fff" />)
}

describe('GroupHeadlineStat — formatação do valor', () => {
    // Regressão: "2007" saía como "2.007" no card-manchete. Ano é rótulo, não
    // quantidade — separador de milhar aqui vira erro factual na tela.
    it('não aplica separador de milhar a um ano', () => {
        renderStat('2007')
        expect(screen.getByText('2007')).toBeInTheDocument()
        expect(screen.queryByText('2.007')).not.toBeInTheDocument()
    })

    it('formata quantidade de quatro dígitos normalmente', () => {
        renderStat('1500')
        expect(screen.getByText('1.500')).toBeInTheDocument()
    })

    it('mantém separador em números grandes', () => {
        renderStat('330000000')
        expect(screen.getByText('330.000.000')).toBeInTheDocument()
    })

    it('preserva decimais da fonte', () => {
        renderStat('1,2 bi')
        expect(screen.getByText(/1,2/)).toBeInTheDocument()
    })

    it('mantém valores não numéricos como vieram', () => {
        // O valor é montado em prefixo/número/sufixo, então a busca precisa
        // olhar o texto acumulado do elemento, não um nó isolado.
        const { container } = render(
            <GroupHeadlineStat value="Daesang" label="rótulo" sourceUrl="https://example.com" accent="#fff" />,
        )
        expect(container.textContent).toContain('Daesang')
    })

    it('preserva prefixo e sufixo em torno do número', () => {
        renderStat('nº 1')
        expect(screen.getByText(/nº/)).toBeInTheDocument()
    })
})
