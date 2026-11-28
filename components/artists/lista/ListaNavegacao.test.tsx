// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { salvarContexto } from '@/lib/artists/listaContexto'

vi.mock('@/components/i18n/LanguageSwitcher', () => ({ LanguageSwitcher: ({ embutido }: { embutido?: boolean }) => <div data-testid="idiomas">{embutido ? 'embutido' : 'faixa'}</div> }))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import { ListaBarra, ListaProxima } from './ListaNavegacao'

const IDIOMAS = { availableIn: 'Disponível em', dismissLabel: 'Fechar', links: [{ href: '/en/x' }] } as unknown as Parameters<typeof ListaBarra>[0]['idiomas']
const item = (n: number, foto: string | null = `https://exemplo.test/${n}.jpg`, papel: string | null = 'Cantora') => ({ slug: `a${n}`, nome: `Artista ${n}`, foto, papel })
const salvar = (itens = [item(1), item(2), item(3, null, null)]) => salvarContexto({ href: '/artists?aba=alta', rotulo: 'Em alta', inicio: 1, total: 3424, itens })
const vizinho = (lado: string) => document.querySelector(`[data-posicao="${lado}"]`)

beforeEach(() => sessionStorage.clear())
afterEach(cleanup)

describe('ListaBarra', () => {
    it('quem chega direto não vê barra; com outros idiomas vê a faixa deles', () => {
        const { container } = render(<ListaBarra slug="a2" />)
        expect(container.innerHTML).toBe('')
        cleanup()
        render(<ListaBarra slug="a2" idiomas={IDIOMAS} />)
        expect(screen.getByTestId('idiomas').textContent).toBe('faixa')
    })

    it('no meio da lista oferece voltar, anterior e próximo', () => {
        salvar()
        render(<ListaBarra slug="a2" idiomas={IDIOMAS} />)
        expect(screen.getByRole('link', { name: /Voltar à lista/ }).getAttribute('href')).toBe('/artists?aba=alta')
        expect(screen.getByRole('link', { name: 'Artista anterior: Artista 1' }).getAttribute('href')).toBe('/artists/a1')
        expect(screen.getByRole('link', { name: 'Próximo artista: Artista 3' }).getAttribute('href')).toBe('/artists/a3')
        expect(screen.getByText(/2 de 3\.424/)).toBeTruthy()
        expect(screen.getByTestId('idiomas').textContent).toBe('embutido')
    })

    it.each([['a1', 'anterior'], ['a3', 'proximo']])('na ponta %s não há vizinho %s', (slug, lado) => {
        salvar()
        render(<ListaBarra slug={slug} />)
        expect(vizinho(lado)).toBeNull()
        expect(screen.queryByTestId('idiomas')).toBeNull()
    })
})

describe('ListaProxima', () => {
    it('some fora da lista ou quando a lista tem um só item', () => {
        const { container } = render(<ListaProxima slug="a2" />)
        expect(container.innerHTML).toBe('')
        cleanup()
        salvar([item(1)])
        expect(render(<ListaProxima slug="a1" />).container.innerHTML).toBe('')
    })

    it('mostra os dois vizinhos com posição e papel', () => {
        salvar()
        render(<ListaProxima slug="a2" />)
        expect(vizinho('anterior')?.textContent).toContain('‹ Anterior · 1')
        expect(vizinho('anterior')?.textContent).toContain('Cantora')
        expect(vizinho('proximo')?.textContent).toBe('Próximo · 3 ›Artista 3')
        expect(vizinho('proximo')?.querySelector('img')).toBeNull()
    })
})
