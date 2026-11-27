// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { QuizFacts } from './QuizFacts'

const m = vi.hoisted(() => ({ locale: '',perguntas: vi.fn(), mini: vi.fn() }))
vi.mock('next-intl/server', () => ({ getLocale: async () => m.locale, getTranslations: async () => (chave: string) => chave }))
vi.mock('@/lib/wordpress/quiz', () => ({ getQuizQuestions: m.perguntas }))
vi.mock('@/components/i18n/LocalizedLink', () => ({ default: (props: ComponentProps<'a'>) => <a {...props} /> }))
vi.mock('./MiniQuiz', () => ({ MiniQuiz: (props: unknown) => { m.mini(props); return null } }))

const pergunta = (id: string, extra: Record<string, unknown> = {}) => ({
    id, question: id, options: ['Um', 'Dois'], correct: 0, explanation: '', category: 'k-pop',
    relatedHref: '/artists/jin', links: { artists: [], groups: [], productions: [] }, ...extra,
})
type Item = { id: string; relatedHref?: string }
const montar = async (extra: Partial<Parameters<typeof QuizFacts>[0]> = {}) => {
    const el = await QuizFacts({ entitySlug: 'jin', entityType: 'artist', entityName: 'Jin', entityId: 7, ...extra })
    if (el) render(el)
    return el
}
const itens = (): Item[] => m.mini.mock.calls.at(-1)?.[0].items ?? []

describe('QuizFacts', () => {
    beforeEach(() => {
        m.locale = DEFAULT_LOCALE
        m.perguntas.mockReset().mockResolvedValue([])
        m.mini.mockReset()
    })
    afterEach(cleanup)

    it('não aparece fora do português, sem nem buscar as perguntas', async () => {
        m.locale = 'en'
        expect(await montar()).toBeNull()
        expect(m.perguntas).not.toHaveBeenCalled()
    })

    it('não aparece sem pergunta ligada à ficha', async () => {
        m.perguntas.mockResolvedValue([pergunta('a', { relatedHref: '/artists/outro' })])
        expect(await montar()).toBeNull()
    })

    it('não confunde a ficha com outra cujo endereço começa igual', async () => {
        m.perguntas.mockResolvedValue([
            pergunta('outra', { relatedHref: '/artists/jin-young' }),
            pergunta('certa', { relatedHref: 'https://www.hallyuhub.com.br/artists/jin/?ref=quiz' }),
        ])
        await montar()
        expect(itens().map(i => i.id)).toEqual(['certa'])
    })

    it('tira o link que aponta para a própria ficha e mantém os outros', async () => {
        m.perguntas.mockResolvedValue([
            pergunta('propria', { relatedHref: '/artists/jin/' }),
            pergunta('fora', { relatedHref: '/groups/bts', links: { artists: [7], groups: [], productions: [] } }),
        ])
        await montar()
        expect(itens().map(i => [i.id, i.relatedHref])).toEqual([['propria', undefined], ['fora', '/groups/bts']])
    })

    it('descarta a pergunta cuja resposta é a própria ficha, sem ligar para acento', async () => {
        m.perguntas.mockResolvedValue([pergunta('entrega', { options: ['Jín', 'x'] }), pergunta('boa')])
        await montar()
        expect(itens().map(i => i.id)).toEqual(['boa'])
    })

    it('mostra no máximo 5 e leva ao quiz da categoria', async () => {
        m.perguntas.mockResolvedValue(Array.from({ length: 8 }, (_, i) => pergunta(`p${i}`, { category: 'k-drama' })))
        await montar()
        expect(new Set(itens().map(i => i.id)).size).toBe(5)
        expect(screen.getByRole('link').getAttribute('href')).toBe('/quiz/k-drama')
    })

    it('na agência junta as perguntas dos grupos e artistas do elenco', async () => {
        m.perguntas.mockResolvedValue([
            pergunta('grupo', { links: { artists: [], groups: [1], productions: [] } }),
            pergunta('artista', { links: { artists: [2], groups: [], productions: [] } }),
            pergunta('alheia', { links: { artists: [9], groups: [9], productions: [] } }),
        ])
        await montar({ entityType: 'agency', entitySlug: 'casa', entityName: 'Casa', groupIds: [1], artistIds: [2] })
        expect(itens().map(i => i.id).sort()).toEqual(['artista', 'grupo'])
    })
})
