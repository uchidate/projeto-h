import { describe, it, expect } from 'vitest'
import { producaoFoiRemovida } from './producoes-removidas'

describe('producaoFoiRemovida', () => {
    it('pega o lixo de importação por padrão, não por lista', () => {
        // São 280 URLs; enumerá-las apodreceria a cada nova importação com
        // defeito. O padrão cobre as que existem e as que ainda apareçam.
        expect(producaoFoiRemovida('producao-558')).toBe(true)
        expect(producaoFoiRemovida('producao-1327')).toBe(true)
    })

    it('pega o que foi verificado como impróprio', () => {
        expect(producaoFoiRemovida('between-the-navel-and-knees')).toBe(true)
    })

    it('não atinge produção viva', () => {
        // O risco real desta função é falso positivo: devolver 410 numa página
        // que existe some com ela do índice de busca.
        for (const vivo of ['golden-fish', 'the-yeast', 'o-favor', 'arquivando-o-amor', 'we-riize']) {
            expect(producaoFoiRemovida(vivo)).toBe(false)
        }
    })

    it('não confunde slug que apenas começa com producao', () => {
        expect(producaoFoiRemovida('producao-de-cinema')).toBe(false)
        expect(producaoFoiRemovida('producoes-2020')).toBe(false)
    })
})
