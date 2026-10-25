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
})
