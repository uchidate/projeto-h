// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarPage } from './CalendarPage'
import type { CalendarEvent } from '@/app/(site)/calendario/page'

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
    return {
        id: 1, day: 15, month: 6, year: 2026, date: '2026-06-15',
        daysUntil: 10, type: 'birthday', name: 'Jimin', slug: 'jimin',
        href: '/artists/jimin', image: null,
        ...overrides,
    }
}

describe('CalendarPage', () => {
    it('mostra "Nenhum evento encontrado" quando a lista está vazia', () => {
        render(<CalendarPage events={[]} todayStr="2026-06-05" />)
        expect(screen.getByText(/nenhum evento encontrado/i)).toBeInTheDocument()
    })

    it('mostra as estatísticas corretas (hoje, semana, aniversários, debuts)', () => {
        const events = [
            event({ id: 1, name: 'Hoje-Aniversário', daysUntil: 0, type: 'birthday' }),
            event({ id: 2, name: 'Semana-Debut', daysUntil: 3, type: 'debut' }),
            event({ id: 3, name: 'Depois', daysUntil: 30, type: 'birthday' }),
        ]
        render(<CalendarPage events={events} todayStr="2026-06-05" />)
        // "Próximos 7 dias" conta 1..7 e NÃO inclui hoje. Antes esse cartão
        // contava `daysUntil <= 7`, então dizia 2 enquanto a seção de mesmo nome
        // logo abaixo listava 1 — os dois números agora saem do mesmo recorte.
        const statLabels = screen.getAllByText(/^(Hoje|Próximos 7 dias|Aniversários|Debuts)$/, {
            selector: 'p.font-mono',
        })
        const values = statLabels.map(label => label.previousElementSibling?.textContent)
        expect(values).toEqual(['1', '1', '2', '1'])
    })

    it('estatísticas respondem ao filtro ativo', async () => {
        const events = [
            event({ id: 1, name: 'Jimin', type: 'birthday', daysUntil: 30 }),
            event({ id: 2, name: 'NewGroup', type: 'debut', daysUntil: 30 }),
        ]
        const user = userEvent.setup()
        render(<CalendarPage events={events} todayStr="2026-06-05" />)

        const readStats = () => screen
            .getAllByText(/^(Hoje|Próximos 7 dias|Aniversários|Debuts)$/, { selector: 'p.font-mono' })
            .map(l => l.previousElementSibling?.textContent)

        expect(readStats()).toEqual(['0', '0', '1', '1'])
        // Antes os números saíam de `events` cru: filtrar por Aniversários
        // mantinha "1 Debut" na tela, contradizendo a lista logo abaixo.
        await user.click(screen.getByRole('button', { name: /aniversários/i }))
        expect(readStats()).toEqual(['0', '0', '1', '0'])
    })

    it('não repete no hero o evento que já está na lista abaixo', () => {
        const events = [event({ id: 1, name: 'Jimin', daysUntil: 3 })]
        render(<CalendarPage events={events} todayStr="2026-06-05" />)
        // Sem evento hoje o hero assume o próximo; ele não pode aparecer de novo
        // na lista de 7 dias, a poucos pixels de distância.
        expect(screen.getAllByText('Jimin')).toHaveLength(1)
    })

    it('filtra por tipo ao clicar em "Aniversários" ou "Debuts"', async () => {
        const events = [
            event({ id: 1, name: 'Jimin', type: 'birthday', daysUntil: 30 }),
            event({ id: 2, name: 'NewGroup', type: 'debut', daysUntil: 30 }),
        ]
        const user = userEvent.setup()
        render(<CalendarPage events={events} todayStr="2026-06-05" />)

        expect(screen.getByText('Jimin')).toBeInTheDocument()
        expect(screen.getByText('NewGroup')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /debuts/i }))
        expect(screen.queryByText('Jimin')).not.toBeInTheDocument()
        expect(screen.getByText('NewGroup')).toBeInTheDocument()
    })

    it('"Todos" mostra os dois tipos de novo depois de filtrar', async () => {
        const events = [
            event({ id: 1, name: 'Jimin', type: 'birthday', daysUntil: 30 }),
            event({ id: 2, name: 'NewGroup', type: 'debut', daysUntil: 30 }),
        ]
        const user = userEvent.setup()
        render(<CalendarPage events={events} todayStr="2026-06-05" />)

        await user.click(screen.getByRole('button', { name: /aniversários/i }))
        expect(screen.queryByText('NewGroup')).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Todos' }))
        expect(screen.getByText('Jimin')).toBeInTheDocument()
        expect(screen.getByText('NewGroup')).toBeInTheDocument()
    })

    it('filtra por busca de nome (case-insensitive)', async () => {
        const events = [
            event({ id: 1, name: 'Jimin', daysUntil: 30 }),
            event({ id: 2, name: 'V (BTS)', daysUntil: 30 }),
        ]
        const user = userEvent.setup()
        render(<CalendarPage events={events} todayStr="2026-06-05" />)

        await user.type(screen.getByPlaceholderText(/buscar idol ou grupo/i), 'JIMIN')
        expect(screen.getByText('Jimin')).toBeInTheDocument()
        expect(screen.queryByText('V (BTS)')).not.toBeInTheDocument()
    })

    it('botão de limpar busca (X) só aparece com texto digitado, e limpa a busca', async () => {
        const events = [event({ name: 'Jimin', daysUntil: 30 })]
        const user = userEvent.setup()
        render(<CalendarPage events={events} todayStr="2026-06-05" />)

        expect(screen.queryByRole('button', { name: /limpar busca/i })).not.toBeInTheDocument()
        await user.type(screen.getByPlaceholderText(/buscar idol ou grupo/i), 'xyz')
        expect(screen.queryByText('Jimin')).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /limpar busca/i }))
        expect(screen.getByText('Jimin')).toBeInTheDocument()
    })

    it('combina filtro de tipo E busca ao mesmo tempo', async () => {
        const events = [
            event({ id: 1, name: 'Jimin', type: 'birthday', daysUntil: 30 }),
            event({ id: 2, name: 'Jisoo', type: 'debut', daysUntil: 30 }),
        ]
        const user = userEvent.setup()
        render(<CalendarPage events={events} todayStr="2026-06-05" />)

        await user.click(screen.getByRole('button', { name: /aniversários/i }))
        await user.type(screen.getByPlaceholderText(/buscar idol ou grupo/i), 'ji')
        // "Jimin" é aniversário e bate na busca; "Jisoo" bate na busca mas é debut (filtrado fora)
        expect(screen.getByText('Jimin')).toBeInTheDocument()
        expect(screen.queryByText('Jisoo')).not.toBeInTheDocument()
    })
})
