// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupErasTimeline } from './GroupErasTimeline'

function historico(entries: [string, string][]): string[] {
    return entries.map(([year, text]) => `HISTÓRICO|${year}|${text}`)
}

describe('GroupErasTimeline', () => {
    it('não renderiza nada quando não há linhas HISTÓRICO', () => {
        const { container } = render(<GroupErasTimeline historico={['OUTRA_COISA|2020|x']} accent="#000" groupName="BTS" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('ignora linhas que não começam com HISTÓRICO|', () => {
        const h = [...historico([['2013', 'Debut']]), 'ALGO_MAIS|2015|Não deveria aparecer']
        render(<GroupErasTimeline historico={h} accent="#000" groupName="BTS" />)
        expect(screen.queryByText('Não deveria aparecer')).not.toBeInTheDocument()
    })

    it('anos próximos (gap <= 2) ficam na mesma era', () => {
        const h = historico([['2013', 'Debut'], ['2014', 'Segundo álbum'], ['2015', 'Terceiro álbum']])
        render(<GroupErasTimeline historico={h} accent="#000" groupName="BTS" />)
        expect(screen.getByText('2013–2015 · 3 marcos')).toBeInTheDocument()
    })

    it('um gap maior que 2 anos separa em eras diferentes', () => {
        const h = historico([['2013', 'Debut'], ['2014', 'Segundo álbum'], ['2020', 'Retorno']])
        render(<GroupErasTimeline historico={h} accent="#000" groupName="BTS" />)
        expect(screen.getByText('2013–2014 · 2 marcos')).toBeInTheDocument()
        expect(screen.getByText('2020 · 1 marcos')).toBeInTheDocument()
    })

    it('nomeia as eras em ordem: Debut, Ascensão, Consolidação...', () => {
        const h = historico([['2013', 'a'], ['2020', 'b'], ['2023', 'c']])
        render(<GroupErasTimeline historico={h} accent="#000" groupName="BTS" />)
        expect(screen.getByText('Debut')).toBeInTheDocument()
        expect(screen.getByText('Ascensão')).toBeInTheDocument()
    })

    it('ordena as entradas por ano, mesmo se o histórico vier fora de ordem', () => {
        const h = historico([['2020', 'Depois'], ['2013', 'Antes']])
        render(<GroupErasTimeline historico={h} accent="#000" groupName="BTS" />)
        // como o gap entre 2013 e 2020 é grande, viram eras separadas — a primeira era (Debut) deve ser 2013
        const debutEra = screen.getByText('Debut').closest('button')
        expect(debutEra).toHaveTextContent('2013')
    })

    it('mostra os eventos da primeira era (Debut) por padrão', () => {
        const h = historico([['2013', 'Evento do debut'], ['2020', 'Evento posterior']])
        render(<GroupErasTimeline historico={h} accent="#000" groupName="BTS" />)
        expect(screen.getByText('Evento do debut')).toBeInTheDocument()
        expect(screen.queryByText('Evento posterior')).not.toBeInTheDocument()
    })

    it('clicar numa era diferente troca os eventos exibidos', async () => {
        const h = historico([['2013', 'Evento do debut'], ['2020', 'Evento posterior']])
        const user = userEvent.setup()
        render(<GroupErasTimeline historico={h} accent="#000" groupName="BTS" />)
        await user.click(screen.getByText('Ascensão'))
        expect(screen.queryByText('Evento do debut')).not.toBeInTheDocument()
        expect(screen.getByText('Evento posterior')).toBeInTheDocument()
    })

    it('mostra o resumo final com nome do grupo, total de marcos e eras', () => {
        const h = historico([['2013', 'a'], ['2020', 'b']])
        render(<GroupErasTimeline historico={h} accent="#000" groupName="BTS" />)
        expect(screen.getByText('BTS · 2 marcos · 2 eras')).toBeInTheDocument()
    })
})
