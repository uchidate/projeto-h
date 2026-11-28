// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Episodio } from '@/lib/tmdb/episodios'
import { EpisodiosPainel } from './EpisodiosPainel'

// eslint-disable-next-line @next/next/no-img-element
vi.mock('next/image', () => ({ default: ({ src }: { src: string }) => <img src={src} alt="" /> }))

afterEach(cleanup)

const textos = {
    episodio: 'Episódio {n}', votos: '{n} votos', posicao: '{n}º de {total}', semSinopse: 'Sem sinopse',
    fonte: 'Fonte: TMDB', pico: 'Pico: ep. {n} ({nota})', menor: 'Menor: ep. {n} ({nota})',
    estreia: 'Estreia', final: 'Final', minutos: '{min} min',
}

const ep = (n: number, nota: number, extra: Partial<Episodio> = {}) =>
    ({ n, nota, votos: n * 10, titulo: `Título ${n}`, sinopse: `Sinopse ${n}`, imagem: null, minutos: null, data: null, ...extra }) as Episodio

const montar = (episodios: Episodio[]) =>
    render(<EpisodiosPainel episodios={episodios} ariaLabel="Notas" textos={textos} accent="#f00" />)

const barra = (n: number) => screen.getByRole('button', { name: new RegExp(`^Episódio ${n}:`) })
const altura = (n: number) => (barra(n).querySelector('[aria-hidden]') as HTMLElement).style.height

describe('EpisodiosPainel', () => {
    it('abre no episódio de maior nota e resume pico e menor', () => {
        montar([ep(1, 7), ep(2, 9), ep(3, 8)])
        expect(barra(2).getAttribute('aria-pressed')).toBe('true')
        expect(screen.getByRole('heading').textContent).toBe('Título 2')
        expect(screen.getByText('1º de 3')).toBeDefined()
        expect(screen.getByText('Pico: ep. 2 (9) · Menor: ep. 1 (7)')).toBeDefined()
    })

    it('no empate, vale o episódio mais antigo', () => {
        montar([ep(1, 8), ep(2, 9), ep(3, 9)])
        expect(barra(2).getAttribute('aria-pressed')).toBe('true')
    })

    it('troca o cartão ao clicar, com duração, data e posição', () => {
        montar([ep(1, 7, { minutos: 62, data: '1 jan 2026', imagem: 'https://img.test/1.jpg' }), ep(2, 9)])
        fireEvent.click(barra(1))
        expect(screen.getByText('Episódio 1 · 62 min · 1 jan 2026')).toBeDefined()
        expect(screen.getByText('10 votos')).toBeDefined()
        expect(screen.getByText('2º de 2')).toBeDefined()
        expect(document.querySelector('img')?.getAttribute('src')).toBe('https://img.test/1.jpg')
    })

    it('sem título e sem sinopse não deixa buraco', () => {
        montar([ep(1, 8, { titulo: '', sinopse: '' })])
        expect(screen.queryByRole('heading')).toBeNull()
        expect(screen.getByText('Sem sinopse')).toBeDefined()
    })

    it('a altura vai de 30% a 100% do intervalo, e notas iguais não dividem por zero', () => {
        montar([ep(1, 7), ep(2, 9)])
        expect([altura(1), altura(2)]).toEqual(['30%', '100%'])
        cleanup()
        montar([ep(1, 8), ep(2, 8)])
        expect([altura(1), altura(2)]).toEqual(['30%', '30%'])
    })
})
