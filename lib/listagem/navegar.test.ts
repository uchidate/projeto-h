import { describe, it, expect } from 'vitest'
import { exigeNavegacaoCompleta } from './navegar'

const ORIGEM = 'https://www.hallyuhub.com.br'

describe('exigeNavegacaoCompleta', () => {
    it('listagem com filtro, paginação ou busca exige', () => {
        expect(exigeNavegacaoCompleta('/productions?genre=drama', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/blog?category=k-beauty', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/artists?page=2', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta(`${ORIGEM}/loja?categoria=lightstick`, ORIGEM)).toBe(true)
    })

    it('vale em todos os idiomas (a lista só tinha o português)', () => {
        expect(exigeNavegacaoCompleta('/ja/artists?page=2', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/en/groups?page=2', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/en/productions?genre=drama', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/en/foods?page=2', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/ja/guides?kind=receitas', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/ja/artists', ORIGEM)).toBe(false)
        expect(exigeNavegacaoCompleta('/ja/artists/iu?x=1', ORIGEM)).toBe(false)
    })

    it('listagem sem query, páginas de detalhe e outras rotas não exigem', () => {
        expect(exigeNavegacaoCompleta('/productions', ORIGEM)).toBe(false)
        expect(exigeNavegacaoCompleta('/productions/escandalo-e-intriga?x=1', ORIGEM)).toBe(false)
        expect(exigeNavegacaoCompleta('/quiz?x=1', ORIGEM)).toBe(false)
    })

    it('link externo nunca exige', () => {
        expect(exigeNavegacaoCompleta('https://outro.com/productions?genre=drama', ORIGEM)).toBe(false)
    })
})
