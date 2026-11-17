// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { WPArtist, WPGroup, WPProduction } from '@/lib/wordpress/types'

vi.mock('next-intl/server', async () => {
    const { createTranslator } = await import('next-intl')
    const { PT_MESSAGES } = await import('@/lib/i18n/messages')
    return { getTranslations: async ({ namespace }: { namespace: string }) => createTranslator({ locale: 'pt', messages: PT_MESSAGES, namespace: namespace as 'home' }) }
})
vi.mock('next-intl', async (importOriginal) => {
    const actual = await importOriginal<typeof import('next-intl')>()
    const { PT_MESSAGES } = await import('@/lib/i18n/messages')
    return { ...actual, useLocale: () => 'pt', useTranslations: (namespace: string) => actual.createTranslator({ locale: 'pt', messages: PT_MESSAGES, namespace: namespace as 'home' }) }
})

const titulo = (nome: string) => ({ rendered: nome })
const artista = (id: number, nome: string, trending: number) => ({ id, slug: `a-${id}`, title: titulo(nome), acf: { trending_score: trending } }) as unknown as WPArtist
const grupo = (id: number, nome: string, trending: number) => ({ id, slug: `g-${id}`, title: titulo(nome), acf: { trending_score: trending } }) as unknown as WPGroup
const producao = (id: number, nome: string, rating: number) => ({ id, slug: `p-${id}`, title: titulo(nome), acf: { rating } }) as unknown as WPProduction

function nomesDa(coluna: string) {
    return within(screen.getByRole('region', { name: coluna })).getAllByRole('listitem').map(li => li.textContent)
}

describe('HomePopulares', () => {
    it('mantém a ordem de relevância das listagens, sem reordenar pelo trending_score legado', async () => {
        const { HomePopulares } = await import('./HomePopulares')
        // V é o 1º em /artists, mas tem trending_score menor (valor herdado da importação, nunca recalculado).
        // Antes a home reordenava por ele e escondia quem tinha 0.
        const artistas = [artista(1, 'V', 83), artista(2, 'Jisoo', 150), artista(3, 'Sem Trending', 0)]
        const grupos = [grupo(10, 'KATSEYE', 45), grupo(11, 'Hearts2Hearts', 70)]
        render(await HomePopulares({ artistas, grupos, producoes: [] }))
        const a = nomesDa('Artistas em alta')
        expect(a[0]).toContain('V')
        expect(a[1]).toContain('Jisoo')
        expect(a[2]).toContain('Sem Trending')
        expect(nomesDa('Grupos em alta')[0]).toContain('KATSEYE')
        // O número 0–150 não aparece mais.
        expect(screen.queryByText('150')).not.toBeInTheDocument()
    })

    it('mostra até 5 por coluna, inclusive produções, com a nota como texto', async () => {
        const { HomePopulares } = await import('./HomePopulares')
        const producoes = Array.from({ length: 7 }, (_, i) => producao(100 + i, `Série ${i + 1}`, 8.5))
        const artistas = Array.from({ length: 7 }, (_, i) => artista(i + 1, `Artista ${i + 1}`, 0))
        render(await HomePopulares({ artistas, grupos: [], producoes }))
        expect(nomesDa('Produções em alta')).toHaveLength(5)
        expect(nomesDa('Artistas em alta')).toHaveLength(5)
        expect(screen.getAllByText('★ 8,5')).toHaveLength(5)
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Em alta agora')
    })
})
