// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next-intl', () => ({ useTranslations: () => (chave: string) => chave }))

import { AtribuicaoJustWatch } from './AtribuicaoJustWatch'

describe('AtribuicaoJustWatch', () => {
    it('aponta para o JustWatch, abre em outra aba e não passa autoridade', () => {
        render(<AtribuicaoJustWatch />)
        const link = screen.getByRole('link', { name: 'sidebar.justWatch' })
        expect(link).toHaveAttribute('href', 'https://www.justwatch.com')
        expect(link).toHaveAttribute('target', '_blank')
        expect(link.getAttribute('rel')).toMatch(/noopener/)
        expect(link.getAttribute('rel')).toMatch(/nofollow/)
    })

    it('aceita classe extra sem perder o estilo base', () => {
        render(<AtribuicaoJustWatch className="mt-3 block" />)
        expect(screen.getByRole('link')).toHaveClass('mt-3', 'block', 'text-muted')
    })
})
