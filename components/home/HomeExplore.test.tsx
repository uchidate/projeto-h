// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { CartaoExplore } from '@/lib/home/explore'

vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...p }: { href: string; children: React.ReactNode }) => <a href={href} {...p}>{children}</a>,
}))

import { HomeExplore } from './HomeExplore'

const cartao = (extra: Partial<CartaoExplore> = {}): CartaoExplore => ({
    chave: 'kpop', cor: '#c61153', href: '/blog?category=k-pop', unidade: 'artigos', total: 1234, novo: false,
    ultimo: { id: 1, slug: 'materia', title: { rendered: '<em>Matéria</em>' }, date: '2026-10-24T00:30:00' } as CartaoExplore['ultimo'],
    ...extra,
})

describe('HomeExplore', () => {
    afterEach(cleanup)

    it('sem cartões não desenha a seção', async () => {
        expect(await HomeExplore({ cartoes: [] })).toBeNull()
    })

    // A data do WordPress vem no horário de São Paulo: 00:30 do dia 24 não é dia 23.
    it('mostra total, título limpo e o dia em que o texto saiu', async () => {
        render((await HomeExplore({ cartoes: [cartao({ novo: true })] }))!)

        expect(screen.getByText('1.234')).toBeTruthy()
        expect(screen.getByRole('link', { name: 'Matéria' }).getAttribute('href')).toBe('/blog/materia')
        expect(screen.getByText(/ultimo/).textContent).toContain('24 de out')
        expect(screen.getByText('novo')).toBeTruthy()
    })

    it('assunto sem matéria mostra o texto de apoio', async () => {
        render((await HomeExplore({ cartoes: [cartao({ chave: 'agencias', ultimo: null, hangul: '기획사' })] }))!)

        expect(screen.getByText('agencias', { selector: 'p' })).toBeTruthy()
        expect(screen.getByText('기획사')).toBeTruthy()
        expect(screen.queryByText(/ultimo/)).toBeNull()
    })
})
