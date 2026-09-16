// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { getNotificationPreferences, updateNotificationPreferences, updateProfile } from '@/lib/wordpress/userApi'
import { PerfilClient } from './PerfilClient'

vi.mock('next/navigation', () => ({ useRouter: vi.fn() }))
vi.mock('@/lib/wordpress/userApi', () => ({
    getNotificationPreferences: vi.fn(),
    updateNotificationPreferences: vi.fn(),
    updateProfile: vi.fn(),
}))

const mockRefresh = vi.fn()

const BASE_USER = { name: 'Jimin Fan', email: 'fan@example.com', image: null, bio: 'Fã de K-pop', token: 'tok' }
const BASE_STATS = { favoritesCount: 0, watchlistCount: 0, joinDate: '2026-01-15T00:00:00' }

describe('PerfilClient', () => {
    beforeEach(() => {
        mockRefresh.mockReset()
        vi.mocked(useRouter).mockReturnValue({ refresh: mockRefresh } as unknown as ReturnType<typeof useRouter>)
        vi.mocked(getNotificationPreferences).mockResolvedValue({ savedReadings: true, watching: true })
        vi.mocked(updateNotificationPreferences).mockReset()
        vi.mocked(updateProfile).mockReset()
    })

    it('mostra nome, email e bio em modo de visualização', () => {
        render(<PerfilClient user={BASE_USER} stats={BASE_STATS} />)
        expect(screen.getByText('Jimin Fan')).toBeInTheDocument()
        expect(screen.getByText('fan@example.com')).toBeInTheDocument()
        expect(screen.getByText('Fã de K-pop')).toBeInTheDocument()
    })

    it('mostra "Nenhuma bio ainda" quando a bio está vazia', () => {
        render(<PerfilClient user={{ ...BASE_USER, bio: '' }} stats={BASE_STATS} />)
        expect(screen.getByText(/nenhuma bio ainda/i)).toBeInTheDocument()
    })

    it('clicar em "Editar perfil" mostra os campos de edição', async () => {
        const user = userEvent.setup()
        render(<PerfilClient user={BASE_USER} stats={BASE_STATS} />)
        await user.click(screen.getByRole('button', { name: /editar perfil/i }))
        expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('Jimin Fan')
    })

    it('"Cancelar" descarta as alterações e volta ao modo de visualização', async () => {
        const user = userEvent.setup()
        render(<PerfilClient user={BASE_USER} stats={BASE_STATS} />)
        await user.click(screen.getByRole('button', { name: /editar perfil/i }))
        await user.clear(screen.getByRole('textbox', { name: 'Nome' }))
        await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Outro Nome')
        await user.click(screen.getByRole('button', { name: /cancelar/i }))
        expect(screen.getByText('Jimin Fan')).toBeInTheDocument()
        expect(screen.queryByText('Outro Nome')).not.toBeInTheDocument()
    })

    it('"Salvar" chama updateProfile e sai do modo de edição', async () => {
        vi.mocked(updateProfile).mockResolvedValue({ ok: true, name: 'Novo Nome', bio: 'Fã de K-pop' })
        const user = userEvent.setup()
        render(<PerfilClient user={BASE_USER} stats={BASE_STATS} />)
        await user.click(screen.getByRole('button', { name: /editar perfil/i }))
        await user.clear(screen.getByRole('textbox', { name: 'Nome' }))
        await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Novo Nome')
        await user.click(screen.getByRole('button', { name: /^salvar$/i }))

        expect(await screen.findByText('Novo Nome')).toBeInTheDocument()
        expect(updateProfile).toHaveBeenCalledWith(null, { name: 'Novo Nome', bio: 'Fã de K-pop' })
        expect(mockRefresh).toHaveBeenCalled()
    })

    it('mostra mensagem de erro quando o salvamento falha (permanece em edição)', async () => {
        vi.mocked(updateProfile).mockRejectedValue(new Error('falhou'))
        const user = userEvent.setup()
        render(<PerfilClient user={BASE_USER} stats={BASE_STATS} />)
        await user.click(screen.getByRole('button', { name: /editar perfil/i }))
        await user.click(screen.getByRole('button', { name: /^salvar$/i }))

        expect(await screen.findByText(/erro ao salvar/i)).toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: 'Nome' })).toBeInTheDocument()
    })

    it('mostra "Membro desde" formatado a partir de joinDate', () => {
        render(<PerfilClient user={BASE_USER} stats={BASE_STATS} />)
        expect(screen.getByText(/membro desde/i)).toBeInTheDocument()
    })

    it('calcula a % de completude do perfil com base nas tarefas concluídas', () => {
        // bio curta (< 20 chars) conta como não preenchida — só "Nome visível"
        // fica concluída = 1 de 6 tarefas = 17% (arredondado)
        render(<PerfilClient user={BASE_USER} stats={BASE_STATS} />)
        expect(screen.getByText('17%')).toBeInTheDocument()
    })

    it('bio com 20+ caracteres conta como tarefa "Bio preenchida" concluída', () => {
        const user = { ...BASE_USER, bio: 'Fã de K-pop desde 2016, apaixonada por tudo' }
        render(<PerfilClient user={user} stats={BASE_STATS} />)
        // Nome visível + Bio preenchida = 2 de 6 = 33%
        expect(screen.getByText('33%')).toBeInTheDocument()
    })

    it('completude sobe pra 100% quando todas as tarefas do perfil estão concluídas', () => {
        const user = { ...BASE_USER, bio: 'Fã de K-pop desde 2016, apaixonada por tudo' }
        const stats = {
            ...BASE_STATS,
            favoritesCount: 5, watchlistCount: 2,
            contentCounts: { production: 0, artist: 1, group: 0, post: 0 },
            contentStateCounts: { favorite: 0, following: 0, saved: 1, read: 0 },
        }
        render(<PerfilClient user={user} stats={stats} />)
        expect(screen.getByText('100%')).toBeInTheDocument()
    })
})
