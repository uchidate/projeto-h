// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next-intl', () => ({
    useTranslations: () => (chave: string, valores?: Record<string, unknown>) => (valores ? `${chave}:${JSON.stringify(valores)}` : chave),
}))

import { ProductionElencoB } from './ProductionElencoB'
import type { WPArtist } from '@/lib/wordpress/types'

const ator = (id: number, nome: string, slug: string) => ({ id, slug, title: { rendered: nome }, featured_image_url: null }) as unknown as WPArtist
const elenco = Array.from({ length: 16 }, (_, i) => ator(i + 1, `Ator ${i + 1}`, `ator-${i + 1}`))

describe('ProductionElencoB', () => {
    it('uma só seção #elenco, medida, com as duas apresentações (faixa no celular, grade no desktop)', () => {
        const { container } = render(<ProductionElencoB title="Gatilho" cast={elenco} castRoles={new Map()} />)
        expect(container.querySelectorAll('#elenco')).toHaveLength(1)
        expect(container.querySelector('#elenco')).toHaveAttribute('data-bloco', 'ficha-producao-elenco')
        expect(container.querySelector('ul.lg\\:hidden')).not.toBeNull()
        expect(container.querySelector('ul.lg\\:grid')).not.toBeNull()
    })

    it('grade do desktop limita a 12; faixa do celular mostra todos até 20', () => {
        const { container } = render(<ProductionElencoB title="Gatilho" cast={elenco} castRoles={new Map()} />)
        expect(container.querySelector('ul.lg\\:hidden')!.querySelectorAll('li')).toHaveLength(16)
        expect(container.querySelector('ul.lg\\:grid')!.querySelectorAll('li')).toHaveLength(12)
    })

    it('cada nome leva à ficha do artista e o papel aparece', () => {
        render(<ProductionElencoB title="Gatilho" cast={[ator(1, 'Kim Nam-gil', 'kim-nam-gil')]} castRoles={new Map([['kim-nam-gil', 'Lee Do']])} />)
        const links = screen.getAllByRole('link', { name: /Kim Nam-gil/ })
        expect(links.length).toBe(2)
        for (const l of links) expect(l).toHaveAttribute('href', '/artists/kim-nam-gil')
        expect(screen.getAllByText('Lee Do').length).toBe(2)
    })

    it('sem elenco não renderiza nada', () => {
        const { container } = render(<ProductionElencoB title="Gatilho" cast={[]} castRoles={new Map()} />)
        expect(container).toBeEmptyDOMElement()
    })
})
