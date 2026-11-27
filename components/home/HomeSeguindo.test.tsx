// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'

const m = vi.hoisted(() => ({ sessao: { data: { user: { name: 'fã' } } as unknown, status: 'authenticated' } }))

vi.mock('next-auth/react', () => ({ useSession: () => m.sessao }))
vi.mock('next-intl', () => ({
    useLocale: () => 'pt',
    useTranslations: (ns: string) => (key: string, valores?: Record<string, string>) =>
        valores ? `${ns}.${key}~${JSON.stringify(valores)}` : key,
}))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...p }: { href: string; children: React.ReactNode }) => <a href={href} {...p}>{children}</a>,
}))

import { HomeSeguindo } from './HomeSeguindo'

const novidade = (id: number, data: string) => ({ id, slug: `post-${id}`, titulo: `Matéria ${id}`, imagem: null, data, sobre: 'aespa' })
const dados = (...novidades: unknown[]) => ({ nomes: ['aespa', 'IVE'], novidades })
const responder = (corpo: unknown, ok = true) => {
    const fetch = vi.fn().mockResolvedValue({ ok, json: async () => corpo })
    vi.stubGlobal('fetch', fetch)
    return fetch
}
const montar = () => act(async () => render(<HomeSeguindo />))

describe('HomeSeguindo', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-11-27T15:00:00Z')) // meio-dia em São Paulo
        m.sessao = { data: { user: { name: 'fã' } }, status: 'authenticated' }
    })
    afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })

    it.each(['loading', 'unauthenticated'])('sessão %s: não consulta nem mostra o bloco', async (status) => {
        m.sessao = { data: null, status }
        const fetch = responder(dados(novidade(1, '2026-11-27T09:00:00')))
        await montar()

        expect(fetch).not.toHaveBeenCalled()
        expect(screen.queryByRole('region')).toBeNull()
    })

    it('mostra os seguidos, o link para seguir mais e as matérias', async () => {
        const fetch = responder(dados(novidade(1, '2026-11-27T09:00:00')))
        await montar()

        expect(fetch).toHaveBeenCalledWith('/api/home/seguindo?lang=pt', { credentials: 'same-origin' })
        expect(screen.getByText('aespa ✓')).toBeTruthy()
        expect(screen.getByText('IVE ✓')).toBeTruthy()
        expect(screen.getByRole('link', { name: 'seguirMais' }).getAttribute('href')).toBe('/artists')
        expect(screen.getByRole('link', { name: /Matéria 1/ }).getAttribute('href')).toBe('/blog/post-1')
        expect(screen.getByText('client.homeSeguindo.sobre~{"nome":"aespa"}')).toBeTruthy()
    })

    // A data do WordPress vem no horário de São Paulo, sem fuso.
    it('diz hoje, ontem ou a data, pelo dia de São Paulo', async () => {
        responder(dados(
            novidade(1, '2026-11-27T00:40:00'),
            novidade(2, '2026-11-26T23:50:00'),
            novidade(3, '2026-11-20T01:00:00'),
        ))
        await montar()

        const selo = (n: number) => screen.getByRole('link', { name: new RegExp(`Matéria ${n}`) }).textContent
        expect(selo(1)).toContain('novo · hoje')
        expect(selo(2)).toContain('novo · ontem')
        expect(selo(3)).toContain('novo · 20/11')
    })

    it.each([
        ['sem novidades', () => responder(dados())],
        ['resposta com erro', () => responder(dados(novidade(1, '2026-11-27T09:00:00')), false)],
        ['rede fora', () => vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))],
    ])('%s: o bloco não aparece', async (_, preparar) => {
        preparar()
        await montar()

        expect(screen.queryByRole('region')).toBeNull()
    })

    it('ao sair da conta, o bloco some', async () => {
        responder(dados(novidade(1, '2026-11-27T09:00:00')))
        let tela!: ReturnType<typeof render>
        await act(async () => { tela = render(<HomeSeguindo />) })
        expect(screen.getByRole('region')).toBeTruthy()

        m.sessao = { data: null, status: 'unauthenticated' }
        await act(async () => { tela.rerender(<HomeSeguindo />) })
        expect(screen.queryByRole('region')).toBeNull()
    })
})
