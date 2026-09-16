// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePathname } from 'next/navigation'
import { MobileMenu } from './MobileMenu'

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }))
const mockedUsePathname = vi.mocked(usePathname)

const LINKS = [
    { label: 'Início', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: 'Artistas', href: '/artists' },
]

describe('MobileMenu', () => {
    beforeEach(() => {
        mockedUsePathname.mockReturnValue('/')
    })

    it('o drawer não aparece antes de abrir', () => {
        render(<MobileMenu links={LINKS} />)
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('clicar no botão de abrir mostra o drawer', async () => {
        const user = userEvent.setup()
        render(<MobileMenu links={LINKS} />)
        await user.click(screen.getByRole('button', { name: /abrir menu/i }))
        expect(screen.getByRole('dialog', { name: /menu de navegação/i })).toBeInTheDocument()
    })

    it('clicar no X fecha o drawer', async () => {
        const user = userEvent.setup()
        render(<MobileMenu links={LINKS} />)
        await user.click(screen.getByRole('button', { name: /abrir menu/i }))
        await user.click(screen.getByRole('button', { name: /fechar menu/i }))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('marca "/" como ativo só na home exata (não em rotas que começam com "/")', async () => {
        mockedUsePathname.mockReturnValue('/')
        const user = userEvent.setup()
        render(<MobileMenu links={LINKS} />)
        await user.click(screen.getByRole('button', { name: /abrir menu/i }))
        expect(screen.getByRole('link', { name: /início/i })).toHaveClass('text-accent')
        expect(screen.getByRole('link', { name: 'Blog' })).not.toHaveClass('text-accent')
    })

    it('marca rotas aninhadas como ativas via startsWith (ex: /blog/algum-post)', async () => {
        mockedUsePathname.mockReturnValue('/blog/algum-post')
        const user = userEvent.setup()
        render(<MobileMenu links={LINKS} />)
        await user.click(screen.getByRole('button', { name: /abrir menu/i }))
        expect(screen.getByRole('link', { name: 'Blog' })).toHaveClass('text-accent')
        expect(screen.getByRole('link', { name: /início/i })).not.toHaveClass('text-accent')
    })

    it('não confunde /artists com /artists-outracoisa (evita falso positivo de prefixo)', async () => {
        mockedUsePathname.mockReturnValue('/artists-outracoisa')
        const user = userEvent.setup()
        render(<MobileMenu links={LINKS} />)
        await user.click(screen.getByRole('button', { name: /abrir menu/i }))
        expect(screen.getByRole('link', { name: 'Artistas' })).not.toHaveClass('text-accent')
    })

    it('clicar num link de navegação fecha o drawer', async () => {
        const user = userEvent.setup()
        render(<MobileMenu links={LINKS} />)
        await user.click(screen.getByRole('button', { name: /abrir menu/i }))
        await user.click(screen.getByRole('link', { name: 'Blog' }))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('mostra os links em destaque (Últimos artigos, Explorar doramas)', async () => {
        const user = userEvent.setup()
        render(<MobileMenu links={LINKS} />)
        await user.click(screen.getByRole('button', { name: /abrir menu/i }))
        expect(screen.getByRole('link', { name: /últimos artigos/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /explorar doramas/i })).toBeInTheDocument()
    })

    it('clicar no backdrop fecha o drawer', async () => {
        const user = userEvent.setup()
        const { container } = render(<MobileMenu links={LINKS} />)
        await user.click(screen.getByRole('button', { name: /abrir menu/i }))
        const backdrop = container.ownerDocument.querySelector('.backdrop-blur-xs') as HTMLElement
        await user.click(backdrop)
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
})
