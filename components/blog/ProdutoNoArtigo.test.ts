import { describe, expect, it } from 'vitest'
import { legendaRepeteTitulo } from './ProdutoNoArtigo'

describe('legendaRepeteTitulo', () => {
    it('detecta legenda que só repete o título', () => {
        expect(legendaRepeteTitulo('AESTURA Atobarrier 365 Cream, 80 ml', 'Aestura Atobarrier 365 Cream 80ml')).toBe(true)
        expect(legendaRepeteTitulo('Illiyoon Ceramide Ato Concentrate, kit mini', 'Illiyoon Ceramide Ato Concentrate – kit mini')).toBe(true)
    })
    it('mantém legenda que acrescenta informação', () => {
        expect(legendaRepeteTitulo('Versão em bisnaga, boa para levar na bolsa e testar a textura', 'Creme Teste 50ml')).toBe(false)
        expect(legendaRepeteTitulo(undefined, 'x')).toBe(false)
    })
})
