// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { ReactNode } from 'react'

// Análise editorial do grupo: a marcação [QUOTE], [DESTAQUE] e **título** vira HTML.
vi.mock('next-intl', () => ({ useTranslations: () => (chave: string) => chave }))
vi.mock('@/components/profiles/CollapsibleProse', () => ({ CollapsibleProse: ({ children }: { children: ReactNode }) => <div>{children}</div> }))
vi.mock('@/components/blocks/BlockHeader', () => ({ BlockHeader: () => null }))
vi.mock('@/lib/profiles/highlightProse', () => ({ highlightProse: (html: string) => html }))

import { GroupEditorialAnalysis } from './GroupEditorialAnalysis'

const montar = (content: string) =>
    render(<GroupEditorialAnalysis content={content} accent="#ff0000" groupName="aespa" />).container
const corpo = (c: HTMLElement) => c.querySelector('.editorial-body')!

afterEach(cleanup)

describe('GroupEditorialAnalysis', () => {
    it('sem texto não mostra a seção', () => {
        expect(montar('').innerHTML).toBe('')
    })

    it('separa a citação do corpo', () => {
        const c = montar('[QUOTE] Uma frase. [/QUOTE]\n\nTexto.')
        expect(c.querySelector('blockquote')!.textContent).toContain('Uma frase.')
        expect(corpo(c).textContent).toBe('Texto.')
    })

    it('transforma a linha em negrito no topo do bloco em título de seção', () => {
        const c = montar('**Começo**\nPrimeira linha\nsegunda linha\n\n**Sozinho**')
        expect([...corpo(c).querySelectorAll('h3')].map(h => h.textContent)).toEqual(['Começo', 'Sozinho'])
        expect(corpo(c).querySelectorAll('p')).toHaveLength(1)
        expect(corpo(c).querySelectorAll('br')).toHaveLength(1)
    })

    it('destaca [DESTAQUE] e negrito no meio do parágrafo, sem citação quando não há', () => {
        const c = montar('Um [DESTAQUE]recorde[/DESTAQUE] e um **prêmio**.\n\n\n\n')
        expect([...corpo(c).querySelectorAll('strong')].map(s => s.textContent)).toEqual(['recorde', 'prêmio'])
        expect(c.querySelector('blockquote')).toBeNull()
        expect(corpo(c).querySelector('h3')).toBeNull()
    })
})
