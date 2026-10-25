import { describe, expect, it } from 'vitest'
import { extrairCapaAlbum } from './capa-album'

const faixa = (n: number, nome: string) => `<div id="faixa-${n}" class="wp-block-group oc-track"><h3 class="wp-block-heading">${n}. &quot;${nome}&quot;</h3><p>x</p></div>`
const stats = '<div class="oc-stats"><dl><div><dt>Lançamento</dt><dd>21 out 2024</dd></div><div><dt>Faixas</dt><dd>5 · 14 min</dd></div></dl></div>'

describe('extrairCapaAlbum', () => {
    it('lê ficha e faixas do texto do álbum', () => {
        const r = extrairCapaAlbum(stats + faixa(1, 'A') + faixa(2, 'B') + faixa(3, 'C'))
        expect(r?.fichas).toEqual([{ rotulo: 'Lançamento', valor: '21 out 2024' }, { rotulo: 'Faixas', valor: '5 · 14 min' }])
        expect(r?.faixas).toEqual([{ id: 'faixa-1', titulo: 'A' }, { id: 'faixa-2', titulo: 'B' }, { id: 'faixa-3', titulo: 'C' }])
    })
    it('menos de três faixas não é capa de álbum', () => {
        expect(extrairCapaAlbum(stats + faixa(1, 'A') + faixa(2, 'B'))).toBeNull()
    })
    it('sem texto devolve null', () => {
        expect(extrairCapaAlbum(undefined)).toBeNull()
    })
    it('lê duração, clipe e Billboard do próprio artigo', () => {
        const yt = '<iframe src="https://www.youtube-nocookie.com/embed/abc"></iframe>'
        const tabela = '<table><tr><th>Faixa</th><th>Duração (Spotify)</th></tr><tr><td>A</td><td>2:07</td></tr><tr><td>B</td><td>2:56</td></tr></table>'
        const texto = '<p>o disco ocupou o 94º lugar na Billboard 200, nos Estados Unidos</p>'
        const r = extrairCapaAlbum(stats + texto + faixa(1, 'A') + faixa(2, 'B') + yt + faixa(3, 'C') + tabela)
        expect(r?.faixas).toEqual([
            { id: 'faixa-1', titulo: 'A', duracao: '2:07' },
            { id: 'faixa-2', titulo: 'B', duracao: '2:56', clipe: true },
            { id: 'faixa-3', titulo: 'C' },
        ])
        expect(r?.fichas.at(-1)).toEqual({ rotulo: 'Billboard 200', valor: '94º' })
    })
    it('não inventa duração nem posição quando o texto não traz', () => {
        const r = extrairCapaAlbum(stats + faixa(1, 'A') + faixa(2, 'B') + faixa(3, 'C'))
        expect(r?.faixas.every(f => f.duracao === undefined && f.clipe === undefined)).toBe(true)
        expect(r?.fichas.some(f => f.rotulo === 'Billboard 200')).toBe(false)
    })
})
