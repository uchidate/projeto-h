// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReportButton } from './ReportButton'

describe('ReportButton', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 })))
    })

    it('abre o modal ao clicar no botão de report', async () => {
        const user = userEvent.setup()
        render(<ReportButton targetType="artist" targetId={123} />)

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: /reportar erro/i }))
        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('fecha o modal ao clicar em fechar', async () => {
        const user = userEvent.setup()
        render(<ReportButton targetType="artist" targetId={123} />)
        await user.click(screen.getByRole('button', { name: /reportar erro/i }))
        await user.click(screen.getByRole('button', { name: /fechar/i }))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('envia o report com target_type/target_id corretos e mostra confirmação', async () => {
        const user = userEvent.setup()
        render(<ReportButton targetType="production" targetId={456} />)
        await user.click(screen.getByRole('button', { name: /reportar erro/i }))
        await user.click(screen.getByRole('button', { name: /enviar report/i }))

        await waitFor(() => expect(screen.getByText(/report enviado/i)).toBeInTheDocument())

        expect(fetch).toHaveBeenCalledWith('/api/report', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ target_type: 'production', target_id: 456, category: 'dado_incorreto', message: '' }),
        }))
    })

    it('envia a categoria selecionada pelo usuário', async () => {
        const user = userEvent.setup()
        render(<ReportButton targetType="artist" targetId={1} />)
        await user.click(screen.getByRole('button', { name: /reportar erro/i }))
        await user.selectOptions(screen.getByLabelText(/o que está errado/i), 'foto_errada')
        await user.click(screen.getByRole('button', { name: /enviar report/i }))

        await waitFor(() => expect(fetch).toHaveBeenCalled())
        const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
        expect(body.category).toBe('foto_errada')
    })

    it('mostra mensagem de erro quando o envio falha', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('erro', { status: 500 })))
        const user = userEvent.setup()
        render(<ReportButton targetType="artist" targetId={1} />)
        await user.click(screen.getByRole('button', { name: /reportar erro/i }))
        await user.click(screen.getByRole('button', { name: /enviar report/i }))

        await waitFor(() => expect(screen.getByText(/não foi possível enviar/i)).toBeInTheDocument())
    })

    it('reseta categoria/mensagem/status ao fechar depois de um envio', async () => {
        const user = userEvent.setup()
        render(<ReportButton targetType="artist" targetId={1} />)
        await user.click(screen.getByRole('button', { name: /reportar erro/i }))
        await user.type(screen.getByLabelText(/detalhes/i), 'algo errado aqui')
        await user.click(screen.getByRole('button', { name: /enviar report/i }))
        await waitFor(() => expect(screen.getByText(/report enviado/i)).toBeInTheDocument())
        // 2 botões acessíveis como "Fechar" nesse estado: o X do header e o
        // botão de confirmação — clica no de confirmação (o último no DOM).
        const closeButtons = screen.getAllByRole('button', { name: /fechar/i })
        await user.click(closeButtons[closeButtons.length - 1])

        await user.click(screen.getByRole('button', { name: /reportar erro/i }))
        expect(screen.getByLabelText(/detalhes/i)).toHaveValue('')
    })
})
