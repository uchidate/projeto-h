import { describe, expect, it } from 'vitest'
import { normalizarEpisodios, painelViavel } from './episodios'

const ep = (n: number, nota: number, votos: number) => ({ episode_number: n, name: `Ep ${n}`, vote_average: nota, vote_count: votos, still_path: n % 2 ? '/a.jpg' : null })

describe('normalizarEpisodios', () => {
    it('ordena, arredonda a nota e monta a URL da imagem', () => {
        const r = normalizarEpisodios({ episodes: [ep(2, 8.449, 10), ep(1, 9.04, 12)] })
        expect(r.map(e => e.n)).toEqual([1, 2])
        expect(r[0].nota).toBe(9)
        expect(r[0].imagem).toBe('https://image.tmdb.org/t/p/w780/a.jpg')
        expect(r[1].imagem).toBeNull()
    })
    it('tolera resposta vazia', () => {
        expect(normalizarEpisodios({})).toEqual([])
    })
})

describe('painelViavel', () => {
    const lote = (votos: number[]) => normalizarEpisodios({ episodes: votos.map((v, i) => ep(i + 1, 8, v)) })
    it('aceita quando ≥80% dos episódios têm ≥5 votos', () => {
        expect(painelViavel(lote([7, 12, 44, 9, 5]))).toBe(true)
        expect(painelViavel(lote([7, 12, 44, 9, 1]))).toBe(true)
    })
    it('recusa amostra de 1 voto por episódio (caso Mr. Sunshine)', () => {
        expect(painelViavel(lote([1, 1, 1, 1, 1, 1, 1, 1, 1]))).toBe(false)
    })
    it('recusa série curta e nota zero', () => {
        expect(painelViavel(lote([9, 9, 9]))).toBe(false)
        expect(painelViavel(normalizarEpisodios({ episodes: [1, 2, 3, 4].map(n => ep(n, 0, 20)) }))).toBe(false)
    })
})
