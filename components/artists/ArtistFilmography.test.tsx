import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import client from '@/messages/pt/client.json'
import type { WPProduction } from '@/lib/wordpress/types'
import { ArtistFilmography } from './ArtistFilmography'

function producao(i: number): WPProduction {
    return {
        id: i, slug: `obra-${i}`, status: 'publish', date: '2020-01-01', modified: '2020-01-01',
        title: { rendered: `Obra ${i}` }, content: { rendered: '' }, featured_media: 0,
        acf: { year: 2000 + i, type: i % 2 ? 'movie' : 'drama', rating: 7 },
    } as unknown as WPProduction
}

function html(quantidade: number, extra: Partial<Parameters<typeof ArtistFilmography>[0]> = {}) {
    const productions = Array.from({ length: quantidade }, (_, i) => producao(i + 1))
    return renderToStaticMarkup(
        <NextIntlClientProvider locale="pt" messages={{ client }}>
            <ArtistFilmography productions={productions} label="Obras" accent="#000" {...extra} />
        </NextIntlClientProvider>,
    )
}

describe('ArtistFilmography — o que o Google recebe no HTML', () => {
    it('serve TODAS as obras no HTML, não só as 10 primeiras', () => {
        const saida = html(25)
        for (let i = 1; i <= 25; i++) {
            expect(saida, `obra-${i} ausente do HTML`).toContain(`/productions/obra-${i}"`)
        }
    })

    it('o "ver mais" é nativo (<details>), sem depender de JavaScript', () => {
        const saida = html(25)
        expect(saida).toContain('<details')
        expect(saida).toContain('Ver todos os 25 trabalhos')
    })

    it('não cria "ver mais" quando cabe nas primeiras 10', () => {
        expect(html(8)).not.toContain('<details')
    })

    it('o título carrega o nome e a intenção de busca "filmes e programas de TV"', () => {
        expect(html(3, { artistName: 'Lee Sung-min' })).toContain('Filmes e programas de TV de Lee Sung-min')
    })

    it('sem nome, mantém o título genérico', () => {
        expect(html(3)).toContain('Obras e participações')
    })

    it('mostra as grafias alternativas como texto visível', () => {
        const saida = html(3, { artistName: 'Moo Jin-sung', alternativas: ['Mu Jin-sung', 'Moo Jinsung'] })
        expect(saida).toContain('Também grafado como Mu Jin-sung, Moo Jinsung.')
    })

    it('sem grafias, não cria a linha', () => {
        expect(html(3, { artistName: 'Kangnam', alternativas: [] })).not.toContain('Também grafado')
    })
})
