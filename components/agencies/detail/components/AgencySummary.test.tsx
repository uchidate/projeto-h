// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AgencySummary } from './AgencySummary'

vi.mock('next-intl', () => ({ useTranslations: () => (chave: string) => chave }))
vi.mock('@/components/blocks/FactGrid', () => ({ FactGrid: () => null }))

type View = ComponentProps<typeof AgencySummary>['view']
const montar = (updatedAtLabel: string | null) => render(
    <AgencySummary
        view={{
            agency: { modified: '2026-11-27T23:10:00' }, name: 'Casa', acf: {}, interfaceAccent: '#000',
            excerptText: 'Resumo', updatedAtLabel, aboutFallback: '', summaryFacts: [],
        } as unknown as View}
    />,
)

describe('AgencySummary', () => {
    afterEach(cleanup)

    it('publica a data de atualização com o fuso do site', () => {
        const { container } = montar('novembro de 2026')
        expect(container.querySelector('time')?.getAttribute('datetime')).toBe('2026-11-27T23:10:00-03:00')
    })

    it('não mostra a linha de atualização sem o rótulo', () => {
        const { container } = montar(null)
        expect(container.querySelector('time')).toBeNull()
    })
})
