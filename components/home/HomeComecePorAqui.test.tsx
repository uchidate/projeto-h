// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HomeComecePorAqui } from './HomeComecePorAqui'
import type { BestOfList } from '@/lib/wordpress/site-settings'

vi.mock('next-intl/server', () => ({
    getTranslations: async () => (chave: string) => chave,
}))

const guia = (n: number): BestOfList => ({ label: `Guia ${n}`, href: `/guias/g${n}`, emoji: '📚' } as BestOfList)

describe('HomeComecePorAqui', () => {
    it('não renderiza nada sem guias', async () => {
        const { container } = render(await HomeComecePorAqui({ guides: [] }))
        expect(container).toBeEmptyDOMElement()
    })

    it('mostra no máximo seis guias, na ordem curada', async () => {
        render(await HomeComecePorAqui({ guides: [1, 2, 3, 4, 5, 6, 7].map(guia) }))
        expect(screen.getAllByRole('link', { name: /Guia \d/ })).toHaveLength(6)
        expect(screen.queryByText('Guia 7')).not.toBeInTheDocument()
        expect(screen.getByText('Guia 1').closest('a')).toHaveAttribute('href', '/guias/g1')
    })

    it('aponta o "ver todos" para a Cultura Coreana 101', async () => {
        render(await HomeComecePorAqui({ guides: [guia(1)] }))
        expect(screen.getByRole('link', { name: 'verTodos' })).toHaveAttribute('href', '/cultura-coreana-101')
    })
})
