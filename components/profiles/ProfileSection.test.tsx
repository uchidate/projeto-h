// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
    renderProfileEntries,
    validateProfileEntries,
    type ProfileEntry,
} from './ProfileSection'

function block(overrides: Partial<Extract<ProfileEntry, { id: string }>> = {}): Extract<ProfileEntry, { id: string }> {
    return {
        id: 'biografia',
        nav: 'Biografia',
        present: true,
        render: label => <span>{label}</span>,
        ...overrides,
    }
}

describe('renderProfileEntries', () => {
    it('deriva as âncoras apenas dos blocos visíveis e na ordem do registro', () => {
        const entries: ProfileEntry[] = [
            block(),
            block({ id: 'premios', nav: 'Prêmios', present: false }),
            { key: 'ad', interstitial: <span>Publicidade</span> },
            block({ id: 'artigos', nav: 'Artigos' }),
        ]

        const { anchors } = renderProfileEntries(entries)

        expect(anchors).toEqual([
            { href: '#biografia', label: 'Biografia' },
            { href: '#artigos', label: 'Artigos' },
        ])
    })

    it('numera somente blocos visíveis que participam da numeração', () => {
        const entries: ProfileEntry[] = [
            block(),
            block({ id: 'videos', nav: 'Vídeos', numbered: false }),
            block({ id: 'premios', nav: 'Prêmios', present: false }),
            block({ id: 'artigos', nav: 'Artigos' }),
        ]

        const { nodes } = renderProfileEntries(entries)
        render(<>{nodes}</>)

        expect(screen.getByText('01 · BIOGRAFIA')).toBeInTheDocument()
        expect(screen.getByText('VÍDEOS')).toBeInTheDocument()
        expect(screen.getByText('02 · ARTIGOS')).toBeInTheDocument()
        expect(screen.queryByText(/PRÊMIOS/)).not.toBeInTheDocument()
    })

    it('aplica ProfileSection por padrão e respeita layout self', () => {
        const entries: ProfileEntry[] = [
            block(),
            block({
                id: 'proprio',
                nav: 'Próprio',
                layout: 'self',
                render: label => <section id="interno">{label}</section>,
            }),
        ]

        const { nodes } = renderProfileEntries(entries)
        const { container } = render(<>{nodes}</>)

        expect(container.querySelector('section#biografia')).toBeInTheDocument()
        expect(container.querySelector('section#interno')).toBeInTheDocument()
        expect(container.querySelector('section#proprio')).not.toBeInTheDocument()
    })

    it('empilha o índice no mesmo rail do conteúdo sem criar coluna lateral', () => {
        const { nodes } = renderProfileEntries([block()])
        const { container } = render(<>{nodes}</>)
        const wrapper = screen.getByText('01 · BIOGRAFIA').parentElement

        expect(wrapper).toHaveClass('lg:pl-48')
        expect(wrapper).not.toHaveClass('lg:grid')
        expect(wrapper?.lastElementChild).toHaveTextContent('')
        expect(container.querySelector('.lg\\:grid-cols-\\[minmax\\(0\\,9\\.5rem\\)_minmax\\(0\\,1fr\\)\\]')).not.toBeInTheDocument()
    })

    it('não duplica o rail quando o contêiner pai já fornece o recuo', () => {
        const { nodes } = renderProfileEntries([block()], { parentProvidesRail: true })
        render(<>{nodes}</>)

        expect(screen.getByText('01 · BIOGRAFIA').parentElement).not.toHaveClass('lg:pl-48')
    })

    it('mantém interstitials na posição declarada', () => {
        const entries: ProfileEntry[] = [
            block(),
            { key: 'ad', interstitial: <span>Publicidade</span> },
            block({ id: 'artigos', nav: 'Artigos' }),
        ]

        const { nodes } = renderProfileEntries(entries)
        const { container } = render(<>{nodes}</>)

        expect(Array.from(container.children).map(node => node.textContent)).toEqual([
            '01 · BIOGRAFIA',
            'Publicidade',
            '02 · ARTIGOS',
        ])
    })
})

describe('validateProfileEntries', () => {
    it('rejeita IDs de blocos duplicados', () => {
        expect(() => validateProfileEntries([block(), block()])).toThrow('Duplicate profile block id: biografia')
    })

    it('rejeita chaves de interstitial duplicadas', () => {
        const ad = { key: 'inline-ad', interstitial: <span>Ad</span> }
        expect(() => validateProfileEntries([ad, ad])).toThrow('Duplicate profile interstitial key: inline-ad')
    })

    it('rejeita IDs, labels e chaves vazios', () => {
        expect(() => validateProfileEntries([block({ id: ' ' })])).toThrow('Profile block id cannot be empty')
        expect(() => validateProfileEntries([block({ nav: ' ' })])).toThrow('Profile block nav cannot be empty')
        expect(() => validateProfileEntries([{ key: ' ', interstitial: null }])).toThrow('Profile interstitial key cannot be empty')
    })
})
