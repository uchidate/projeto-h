// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CatalogFilterBar, type FilterPill } from './CatalogFilterBar'

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    usePathname: () => '/productions',
    useSearchParams: () => new URLSearchParams(),
}))

function pill(overrides: Partial<FilterPill> = {}): FilterPill {
    return { label: 'Todos', href: '/productions', active: false, ...overrides }
}

describe('CatalogFilterBar', () => {
    it('renderiza cada pill como um link com o href correto', () => {
        render(<CatalogFilterBar groups={[[pill({ label: 'Doramas', href: '/productions?type=drama' })]]} />)
        expect(screen.getByRole('link', { name: 'Doramas' })).toHaveAttribute('href', '/productions?type=drama')
    })

    it('pill ativa com variant default usa bg-foreground (não accent)', () => {
        render(<CatalogFilterBar groups={[[pill({ label: 'Ativa', active: true })]]} />)
        expect(screen.getByRole('link', { name: 'Ativa' })).toHaveClass('bg-foreground', 'text-background')
    })

    it('pill ativa com variant accent usa bg-accent-a11y (contraste WCAG)', () => {
        render(<CatalogFilterBar groups={[[pill({ label: 'Ativa', active: true, variant: 'accent' })]]} />)
        expect(screen.getByRole('link', { name: 'Ativa' })).toHaveClass('bg-accent-a11y', 'text-white')
    })

    it('pill inativa não recebe nenhuma das duas classes de "ativa"', () => {
        render(<CatalogFilterBar groups={[[pill({ label: 'Inativa', active: false })]]} />)
        const link = screen.getByRole('link', { name: 'Inativa' })
        expect(link).not.toHaveClass('bg-foreground')
        expect(link).not.toHaveClass('bg-accent-a11y')
    })

    it('mostra um separador "|" entre grupos, mas não antes do primeiro grupo', () => {
        render(<CatalogFilterBar groups={[[pill({ label: 'Grupo1' })], [pill({ label: 'Grupo2' })]]} />)
        expect(screen.getAllByText('|')).toHaveLength(1)
    })

    it('não mostra o campo de busca quando searchPlaceholder não é passado', () => {
        render(<CatalogFilterBar groups={[[pill()]]} />)
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('mostra o campo de busca com o placeholder quando searchPlaceholder é passado', () => {
        render(<CatalogFilterBar groups={[[pill()]]} searchPlaceholder="Buscar produções..." />)
        expect(screen.getByPlaceholderText('Buscar produções...')).toBeInTheDocument()
    })
})
