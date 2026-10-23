import { describe, expect, it } from 'vitest'
import { ligarArtigosAosAlbuns } from './albumArticles'

const post = (slug: string, title: string) => ({ slug, title: { rendered: title } })

describe('ligarArtigosAosAlbuns', () => {
    const posts = [post('amortage-jisoo', 'AMORTAGE, o primeiro EP de Jisoo: faixas, créditos, vendas e paradas'), post('outro', 'Guia de K-pop')]

    it('liga pelo título do álbum, ignorando qualificadores de edição', () => {
        const r = ligarArtigosAosAlbuns([{ id: '1', title: 'AMORTAGE' }, { id: '2', title: 'AMORTAGE (Deluxe)' }], posts)
        expect(r).toEqual({ '1': '/blog/amortage-jisoo', '2': '/blog/amortage-jisoo' })
    })

    it('não liga títulos curtos nem álbuns sem artigo', () => {
        const r = ligarArtigosAosAlbuns([{ id: '3', title: 'Blue' }, { id: '4', title: 'Outro Disco Qualquer' }], [post('x', 'Blue Spring, o disco'), ...posts])
        expect(r).toEqual({})
    })

    it('exige o título inteiro como palavras, não como pedaço de palavra', () => {
        const r = ligarArtigosAosAlbuns([{ id: '5', title: 'AMORTAGES' }], posts)
        expect(r).toEqual({})
    })
})
