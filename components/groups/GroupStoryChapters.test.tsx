// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GroupStoryChapters } from './GroupStoryChapters'

const chapters = [
    { period: '2001', title: 'Estreia', description: 'Primeiro papel.', source_url: 'https://example.com/a' },
    { period: '2018', title: 'A virada', description: 'Papel decisivo.', source_url: 'https://example.com/b' },
]

describe('GroupStoryChapters — anos documentados', () => {
    afterEach(() => vi.useRealTimers())

    it('conta até o ano corrente quando não há endYear', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-08-03T12:00:00Z'))

        render(<GroupStoryChapters chapters={chapters} accent="#fff" groupName="Fulano" debutYear={2001} />)

        expect(screen.getByText('25')).toBeTruthy()
        expect(screen.getByText('anos de carreira documentada')).toBeTruthy()
    })

    it('para no endYear quando a carreira terminou — perfil póstumo', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-08-03T12:00:00Z'))

        render(<GroupStoryChapters chapters={chapters} accent="#fff" groupName="Fulano" debutYear={2001} endYear={2023} />)

        expect(screen.getByText('22')).toBeTruthy()
        expect(screen.queryByText('25')).toBeNull()
    })

    it('cai para a contagem de capítulos quando não há ano de estreia', () => {
        render(<GroupStoryChapters chapters={chapters} accent="#fff" groupName="Fulano" />)

        expect(screen.getByText('2')).toBeTruthy()
        expect(screen.getByText('capítulos documentados')).toBeTruthy()
    })
})
