// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import {
    getUserNotifications,
    markAllUserNotificationsRead,
    updateUserNotification,
    type UserNotification,
} from '@/lib/wordpress/userApi'
import { NotificationBell } from './NotificationBell'

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }))
vi.mock('@/lib/wordpress/userApi', () => ({
    getUserNotifications: vi.fn(),
    markAllUserNotificationsRead: vi.fn(),
    updateUserNotification: vi.fn(),
}))

const mockedUseSession = vi.mocked(useSession)

function notification(overrides: Partial<UserNotification> = {}): UserNotification {
    return {
        id: '1',
        type: 'saved_reading',
        title: 'Novo capítulo',
        body: 'Algo aconteceu',
        href: '/blog/algo',
        objectType: 'post',
        objectId: 1,
        priority: 'normal',
        createdAt: new Date().toISOString(),
        readAt: null,
        ...overrides,
    }
}

function mockAuthenticated() {
    mockedUseSession.mockReturnValue({
        data: { user: { id: '1' } }, status: 'authenticated',
    } as unknown as ReturnType<typeof useSession>)
}

describe('NotificationBell', () => {
    beforeEach(() => {
        vi.mocked(getUserNotifications).mockReset()
        vi.mocked(markAllUserNotificationsRead).mockReset()
        vi.mocked(updateUserNotification).mockReset()
    })

    it('não renderiza nada quando não há sessão autenticada', () => {
        mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as unknown as ReturnType<typeof useSession>)
        const { container } = render(<NotificationBell />)
        expect(container).toBeEmptyDOMElement()
    })

    it('mostra o badge com a contagem de não lidas', async () => {
        mockAuthenticated()
        vi.mocked(getUserNotifications).mockResolvedValue({ items: [notification()], unreadCount: 3 })
        render(<NotificationBell />)
        expect(await screen.findByText('3')).toBeInTheDocument()
    })

    it('não mostra badge quando não há notificações não lidas', async () => {
        mockAuthenticated()
        vi.mocked(getUserNotifications).mockResolvedValue({ items: [], unreadCount: 0 })
        render(<NotificationBell />)
        await screen.findByLabelText('Notificações')
        expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('satura o badge em "9" quando há mais de 9 não lidas', async () => {
        mockAuthenticated()
        vi.mocked(getUserNotifications).mockResolvedValue({ items: [], unreadCount: 42 })
        render(<NotificationBell />)
        expect(await screen.findByText('9')).toBeInTheDocument()
    })

    it('abre o painel ao clicar no sino e mostra os itens', async () => {
        mockAuthenticated()
        vi.mocked(getUserNotifications).mockResolvedValue({ items: [notification({ title: 'Capítulo novo' })], unreadCount: 1 })
        const user = userEvent.setup()
        render(<NotificationBell />)

        expect(screen.queryByText('Capítulo novo')).not.toBeInTheDocument()
        await user.click(screen.getByLabelText('Notificações'))
        expect(await screen.findByText('Capítulo novo')).toBeInTheDocument()
    })

    it('mostra "Nada importante agora" quando não há notificações', async () => {
        mockAuthenticated()
        vi.mocked(getUserNotifications).mockResolvedValue({ items: [], unreadCount: 0 })
        const user = userEvent.setup()
        render(<NotificationBell />)
        await user.click(screen.getByLabelText('Notificações'))
        expect(await screen.findByText(/nada importante agora/i)).toBeInTheDocument()
    })

    it('fecha o painel ao clicar fora', async () => {
        mockAuthenticated()
        vi.mocked(getUserNotifications).mockResolvedValue({ items: [], unreadCount: 0 })
        const user = userEvent.setup()
        render(
            <div>
                <div data-testid="outside">fora</div>
                <NotificationBell />
            </div>
        )
        await user.click(screen.getByLabelText('Notificações'))
        await screen.findByText(/nada importante agora/i)
        await user.click(screen.getByTestId('outside'))
        await waitFor(() => expect(screen.queryByText(/nada importante agora/i)).not.toBeInTheDocument())
    })

    it('marca uma notificação como lida ao clicar em "Lida"', async () => {
        mockAuthenticated()
        const item = notification({ id: 'n1' })
        vi.mocked(getUserNotifications).mockResolvedValue({ items: [item], unreadCount: 1 })
        vi.mocked(updateUserNotification).mockResolvedValue({
            ok: true, items: [{ ...item, readAt: new Date().toISOString() }], unreadCount: 0,
        })
        const user = userEvent.setup()
        render(<NotificationBell />)
        await user.click(screen.getByLabelText('Notificações'))
        await user.click(await screen.findByRole('button', { name: /lida/i }))

        await waitFor(() => expect(updateUserNotification).toHaveBeenCalledWith(null, 'n1', 'read'))
    })

    it('dispensa uma notificação ao clicar em "Dispensar"', async () => {
        mockAuthenticated()
        const item = notification({ id: 'n1' })
        vi.mocked(getUserNotifications).mockResolvedValue({ items: [item], unreadCount: 1 })
        vi.mocked(updateUserNotification).mockResolvedValue({ ok: true, items: [], unreadCount: 0 })
        const user = userEvent.setup()
        render(<NotificationBell />)
        await user.click(screen.getByLabelText('Notificações'))
        await user.click(await screen.findByRole('button', { name: /dispensar/i }))

        await waitFor(() => expect(updateUserNotification).toHaveBeenCalledWith(null, 'n1', 'dismiss'))
    })

    it('"Ler tudo" só aparece quando há não lidas, e chama markAllUserNotificationsRead', async () => {
        mockAuthenticated()
        vi.mocked(getUserNotifications).mockResolvedValue({ items: [notification()], unreadCount: 2 })
        vi.mocked(markAllUserNotificationsRead).mockResolvedValue({ ok: true, items: [], unreadCount: 0 })
        const user = userEvent.setup()
        render(<NotificationBell />)
        await user.click(screen.getByLabelText('Notificações'))

        const readAllBtn = await screen.findByRole('button', { name: /ler tudo/i })
        await user.click(readAllBtn)
        await waitFor(() => expect(markAllUserNotificationsRead).toHaveBeenCalledWith())
    })

    it('não mostra "Ler tudo" quando não há não lidas', async () => {
        mockAuthenticated()
        vi.mocked(getUserNotifications).mockResolvedValue({ items: [notification({ readAt: new Date().toISOString() })], unreadCount: 0 })
        const user = userEvent.setup()
        render(<NotificationBell />)
        await user.click(screen.getByLabelText('Notificações'))
        await screen.findByText(/novo capítulo/i)
        expect(screen.queryByRole('button', { name: /ler tudo/i })).not.toBeInTheDocument()
    })
})
