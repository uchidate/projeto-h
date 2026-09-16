// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AutoBreadcrumb } from './AutoBreadcrumb'

let pathnameValue = '/'
vi.mock('next/navigation', () => ({
    usePathname: () => pathnameValue,
}))

describe('AutoBreadcrumb', () => {
    it('não renderiza nada na home ("/")', () => {
        pathnameValue = '/'
        const { container } = render(<AutoBreadcrumb />)
        expect(container).toBeEmptyDOMElement()
    })

    it('sempre inclui "Início" como primeiro crumb', () => {
        pathnameValue = '/blog'
        render(<AutoBreadcrumb />)
        expect(screen.getByText('Início')).toBeInTheDocument()
    })

    it('usa o label mapeado conhecido para o segmento', () => {
        pathnameValue = '/artists'
        render(<AutoBreadcrumb />)
        expect(screen.getByText('Artistas')).toBeInTheDocument()
    })

    it('formata slugs desconhecidos capitalizando cada palavra', () => {
        pathnameValue = '/blog/meu-artigo-legal'
        render(<AutoBreadcrumb />)
        expect(screen.getByText('Meu Artigo Legal')).toBeInTheDocument()
    })

    it('constrói o href acumulado corretamente para cada nível', () => {
        pathnameValue = '/productions/k-drama'
        render(<AutoBreadcrumb />)
        expect(screen.getByText('Produções').closest('a')).toHaveAttribute('href', '/productions')
    })

    it('gera um crumb por segmento do path', () => {
        pathnameValue = '/groups/bts/discografia'
        render(<AutoBreadcrumb />)
        expect(screen.getByText('Início')).toBeInTheDocument()
        expect(screen.getByText('Grupos K-Pop')).toBeInTheDocument()
        expect(screen.getByText('Bts')).toBeInTheDocument()
        expect(screen.getByText('Discografia')).toBeInTheDocument()
    })
})
