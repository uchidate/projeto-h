// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { WpAdminBar } from './WpAdminBar'
import { useWpEdit } from '@/components/ui/WpEditContext'

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }))
vi.mock('next/navigation', () => ({ usePathname: () => '/artists/bts' }))
vi.mock('@/components/ui/WpEditContext', () => ({ useWpEdit: vi.fn() }))

const mockedUseSession = vi.mocked(useSession)
const mockedUseWpEdit = vi.mocked(useWpEdit)

describe('WpAdminBar', () => {
    it('não renderiza nada quando não há sessão', () => {
        // @ts-expect-error mock parcial suficiente pro teste
        mockedUseSession.mockReturnValue({ data: null })
        mockedUseWpEdit.mockReturnValue({ editUrl: null, setEdit: vi.fn(), clearEdit: vi.fn() })
        const { container } = render(<WpAdminBar />)
        expect(container).toBeEmptyDOMElement()
    })

    it('não renderiza nada quando o e-mail não está na allowlist de admins', () => {
        // @ts-expect-error mock parcial suficiente pro teste
        mockedUseSession.mockReturnValue({ data: { user: { email: 'outro@x.com', name: 'Outro' } } })
        mockedUseWpEdit.mockReturnValue({ editUrl: null, setEdit: vi.fn(), clearEdit: vi.fn() })
        const { container } = render(<WpAdminBar />)
        expect(container).toBeEmptyDOMElement()
    })

    it('renderiza a barra quando o e-mail é de admin', () => {
        // @ts-expect-error mock parcial suficiente pro teste
        mockedUseSession.mockReturnValue({ data: { user: { email: 'admin@example.com', name: 'Pessoa' } } })
        mockedUseWpEdit.mockReturnValue({ editUrl: null, setEdit: vi.fn(), clearEdit: vi.fn() })
        render(<WpAdminBar />)
        expect(screen.getByRole('link', { name: /wp admin/i })).toBeInTheDocument()
    })

    it('não mostra o link "Editar no WP" quando não há editUrl no contexto', () => {
        // @ts-expect-error mock parcial suficiente pro teste
        mockedUseSession.mockReturnValue({ data: { user: { email: 'admin@example.com', name: 'Pessoa' } } })
        mockedUseWpEdit.mockReturnValue({ editUrl: null, setEdit: vi.fn(), clearEdit: vi.fn() })
        render(<WpAdminBar />)
        expect(screen.queryByRole('link', { name: /editar no wp/i })).not.toBeInTheDocument()
    })

    it('mostra o link "Editar no WP" apontando pro editUrl do contexto', () => {
        // @ts-expect-error mock parcial suficiente pro teste
        mockedUseSession.mockReturnValue({ data: { user: { email: 'admin@example.com', name: 'Pessoa' } } })
        mockedUseWpEdit.mockReturnValue({ editUrl: 'https://example.com/wp-admin/post.php?post=42&action=edit', setEdit: vi.fn(), clearEdit: vi.fn() })
        render(<WpAdminBar />)
        expect(screen.getByRole('link', { name: /editar no wp/i })).toHaveAttribute(
            'href', 'https://example.com/wp-admin/post.php?post=42&action=edit',
        )
    })

    it('inclui o pathname atual codificado no link do Site Kit', () => {
        // @ts-expect-error mock parcial suficiente pro teste
        mockedUseSession.mockReturnValue({ data: { user: { email: 'admin@example.com', name: 'Pessoa' } } })
        mockedUseWpEdit.mockReturnValue({ editUrl: null, setEdit: vi.fn(), clearEdit: vi.fn() })
        render(<WpAdminBar />)
        const link = screen.getByRole('link', { name: /site kit/i })
        expect(link.getAttribute('href')).toContain(encodeURIComponent('https://www.example.com/artists/bts'))
    })

    it('mostra o nome do usuário logado', () => {
        // @ts-expect-error mock parcial suficiente pro teste
        mockedUseSession.mockReturnValue({ data: { user: { email: 'admin@example.com', name: 'Pessoa Teste' } } })
        mockedUseWpEdit.mockReturnValue({ editUrl: null, setEdit: vi.fn(), clearEdit: vi.fn() })
        render(<WpAdminBar />)
        expect(screen.getByText('Pessoa Teste')).toBeInTheDocument()
    })
})
