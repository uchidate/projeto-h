// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageBreadcrumb } from './PageBreadcrumb'

describe('PageBreadcrumb', () => {
    beforeEach(() => {
        // @ts-expect-error mock global — jsdom não implementa ResizeObserver
        global.ResizeObserver = class {
            observe = vi.fn()
            disconnect = vi.fn()
        }
        document.documentElement.style.removeProperty('--breadcrumb-h')
    })

    it('renderiza o trail de breadcrumb dado os itens', () => {
        render(<PageBreadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Blog' }]} />)
        expect(screen.getByText('Home')).toBeInTheDocument()
        expect(screen.getByText('Blog')).toBeInTheDocument()
    })

    it('mostra a descrição quando fornecida', () => {
        render(<PageBreadcrumb crumbs={[{ label: 'Home', href: '/' }]} description="Uma descrição da página" />)
        expect(screen.getByText('Uma descrição da página')).toBeInTheDocument()
    })

    it('não mostra parágrafo de descrição quando não fornecida', () => {
        const { container } = render(<PageBreadcrumb crumbs={[{ label: 'Home', href: '/' }]} />)
        expect(container.querySelectorAll('p').length).toBe(0)
    })

    it('define a variável CSS --breadcrumb-h no documentElement ao montar', () => {
        render(<PageBreadcrumb crumbs={[{ label: 'Home', href: '/' }]} />)
        expect(document.documentElement.style.getPropertyValue('--breadcrumb-h')).toMatch(/px$/)
    })

    it('remove a variável CSS --breadcrumb-h ao desmontar', () => {
        const { unmount } = render(<PageBreadcrumb crumbs={[{ label: 'Home', href: '/' }]} />)
        expect(document.documentElement.style.getPropertyValue('--breadcrumb-h')).not.toBe('')
        unmount()
        expect(document.documentElement.style.getPropertyValue('--breadcrumb-h')).toBe('')
    })

    it('usa aria-label="Breadcrumb" na nav', () => {
        render(<PageBreadcrumb crumbs={[{ label: 'Home', href: '/' }]} />)
        expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
    })
})
