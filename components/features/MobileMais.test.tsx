// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MobileMais } from './MobileMais'

const m = vi.hoisted(() => ({ pathname: '/', locale: 'pt-BR', abriu: vi.fn() }))
vi.mock('next/navigation', () => ({ usePathname: () => m.pathname }))
vi.mock('next-intl', () => ({ useLocale: () => m.locale, useTranslations: () => (chave: string) => chave }))
vi.mock('@/components/i18n/LocalizedLink', () => ({ default: (props: ComponentProps<'a'>) => <a {...props} /> }))
vi.mock('@/lib/analytics', () => ({ trackMenuOpen: m.abriu }))
vi.mock('@/components/ui/ThemeToggle', () => ({ ThemeToggle: () => null }))
vi.mock('@/components/ui/NotificationBell', () => ({ NotificationBell: () => null }))
vi.mock('@/components/i18n/SeletorIdioma', () => ({ SeletorIdioma: () => null }))
vi.mock('@/lib/i18n/config', async importOriginal => ({
    ...(await importOriginal<typeof import('@/lib/i18n/config')>()),
    DEFAULT_LOCALE: 'pt-BR',
}))

const links = [
    { label: 'Artistas', href: '/artists' },
    { label: 'Blog', href: '/blog' },
    { label: 'Quiz', href: '/quiz' },
]
const abrir = () => fireEvent.click(screen.getByRole('button', { name: 'nav.menuButton' }))
const folha = () => screen.queryByRole('dialog')

describe('MobileMais', () => {
    beforeEach(() => {
        m.pathname = '/'
        m.locale = 'pt-BR'
        m.abriu.mockReset()
    })
    afterEach(cleanup)

    it('abre a folha, trava a rolagem e mede o toque', () => {
        render(<MobileMais links={links} />)
        expect(folha()).toBeNull()
        abrir()
        expect(folha()).toBeTruthy()
        expect(screen.getByRole('button', { name: 'nav.menuButton' }).getAttribute('aria-expanded')).toBe('true')
        expect(document.body.style.overflow).toBe('hidden')
        expect(m.abriu).toHaveBeenCalledTimes(1)
    })

    it.each([
        ['no X', () => fireEvent.click(screen.getByRole('button', { name: 'nav.closeMenu' }))],
        ['ao tocar fora', () => fireEvent.click(folha()!.firstElementChild!)],
        ['com Esc', () => fireEvent.keyDown(document, { key: 'Escape' })],
    ])('fecha %s e devolve a rolagem', (_como, fechar) => {
        render(<MobileMais links={links} />)
        abrir()
        fechar()
        expect(folha()).toBeNull()
        expect(document.body.style.overflow).toBe('')
    })

    it('ignora outras teclas', () => {
        render(<MobileMais links={links} />)
        abrir()
        fireEvent.keyDown(document, { key: 'Enter' })
        expect(folha()).toBeTruthy()
    })

    it('fecha ao navegar', () => {
        const { rerender } = render(<MobileMais links={links} />)
        abrir()
        m.pathname = '/blog'
        rerender(<MobileMais links={links} />)
        expect(folha()).toBeNull()
    })

    it('agrupa pelo endereço e omite grupo sem item', () => {
        render(<MobileMais links={links.slice(0, 2)} />)
        abrir()
        expect(screen.getByText('nav.groupCatalog')).toBeTruthy()
        expect(screen.getByText('nav.groupRead')).toBeTruthy()
        expect(screen.queryByText('nav.groupExplore')).toBeNull()
    })

    it('marca a seção atual também nas subpáginas, sem confundir prefixo', () => {
        m.pathname = '/blog/um-artigo'
        render(<MobileMais links={[...links, { label: 'Outro', href: '/blo' }]} />)
        abrir()
        const atuais = screen.getAllByRole('link').filter(a => a.getAttribute('aria-current') === 'page')
        expect(atuais.map(a => a.getAttribute('href'))).toEqual(['/blog'])
    })

    it('mostra Loja e Sobre só no idioma padrão', () => {
        render(<MobileMais links={links} />)
        abrir()
        const hrefs = () => screen.getAllByRole('link').map(a => a.getAttribute('href'))
        expect(hrefs()).toEqual(expect.arrayContaining(['/loja', '/about']))
        cleanup()
        m.locale = 'en'
        render(<MobileMais links={links} />)
        abrir()
        expect(hrefs()).toEqual(['/artists', '/blog', '/quiz'])
    })
})
