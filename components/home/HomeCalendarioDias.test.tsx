// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HomeCalendarioDias, type DiaCalendario, type ItemDia, type RotulosCalendario } from './HomeCalendarioDias'

vi.mock('next/image', () => ({ default: ({ src }: { src: string }) => <span data-foto={src} /> }))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}))

afterEach(cleanup)

const rotulos: RotulosCalendario = {
    hoje: 'Hoje', aSeguir: 'A seguir', tag: 'Aniversários', anos: 'anos', semAniversario: 'Ninguém neste dia.',
    escolherDia: 'Escolher o dia', abrirHref: '/calendario', abrir: 'Abrir calendário',
}

const pessoa = (nome: string, extra: Partial<ItemDia> = {}): ItemDia =>
    ({ nome, hangul: null, foto: null, idade: 25, href: `/artists/${nome.toLowerCase()}`, ...extra })

const dia = (n: number, semana: string, itens: ItemDia[] = []): DiaCalendario =>
    ({ data: `2026-01-0${n}`, semana, dia: String(n), diaMes: `${n}/01`, itens })

const semana = [
    dia(1, 'qui', [pessoa('Ana', { hangul: '아나', foto: 'https://img.test/ana.jpg' })]),
    dia(2, 'sex'),
    dia(3, 'sáb', ['Bia', 'Cris', 'Duda', 'Eva'].map(n => pessoa(n))),
]

const botaoDoDia = (indice: number) => within(screen.getByRole('group', { name: 'Escolher o dia' })).getAllByRole('button')[indice]
const titulos = () => screen.getAllByRole('heading').map(h => h.textContent)

describe('HomeCalendarioDias', () => {
    it('começa em hoje, com os aniversariantes dele', () => {
        render(<HomeCalendarioDias dias={semana} rotulos={rotulos} />)
        expect(botaoDoDia(0).getAttribute('aria-pressed')).toBe('true')
        expect(titulos()).toEqual(['Hoje · qui 1/01', 'A seguir'])
        expect(screen.getByRole('link', { name: /Ana/ }).getAttribute('href')).toBe('/artists/ana')
        expect(screen.getByText('아나')).toBeDefined()
        expect(document.querySelector('[data-foto]')?.getAttribute('data-foto')).toBe('https://img.test/ana.jpg')
    })

    it('"a seguir" mostra no máximo três nomes por dia e pula dia vazio', () => {
        render(<HomeCalendarioDias dias={semana} rotulos={rotulos} />)
        expect(screen.getByRole('link', { name: 'Duda' })).toBeDefined()
        expect(screen.queryByRole('link', { name: 'Eva' })).toBeNull()
        expect(screen.queryByRole('button', { name: 'sex 2' })).toBeNull()
    })

    it('dia sem aniversário avisa e oferece o calendário', () => {
        render(<HomeCalendarioDias dias={semana} rotulos={rotulos} />)
        fireEvent.click(botaoDoDia(1))
        expect(titulos()[0]).toBe('sex 2/01')
        expect(screen.getByText(/Ninguém neste dia/)).toBeDefined()
        expect(screen.getByRole('link', { name: 'Abrir calendário' }).getAttribute('href')).toBe('/calendario')
    })

    it('sem página de calendário no idioma, não oferece o link', () => {
        render(<HomeCalendarioDias dias={semana} rotulos={{ ...rotulos, abrirHref: null }} />)
        fireEvent.click(botaoDoDia(1))
        expect(screen.queryByRole('link', { name: 'Abrir calendário' })).toBeNull()
    })

    it('escolher por "a seguir" seleciona o dia e o tira da lista', () => {
        render(<HomeCalendarioDias dias={semana} rotulos={rotulos} />)
        fireEvent.click(screen.getByRole('button', { name: 'sáb 3' }))
        expect(botaoDoDia(2).getAttribute('aria-pressed')).toBe('true')
        expect(screen.getByRole('link', { name: /Eva/ })).toBeDefined()
        expect(screen.queryByRole('heading', { name: 'A seguir' })).toBeNull()
    })
})
