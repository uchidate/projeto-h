import { describe, expect, it } from 'vitest'
import { metaDescription } from './metaDescription'

describe('metaDescription', () => {
    it('mantém texto curto, só normalizando espaços e reticências finais', () => {
        expect(metaDescription('A maior empresa\nde entretenimento.  ')).toBe('A maior empresa de entretenimento.')
        expect(metaDescription('Listada na KOSPI…\n')).toBe('Listada na KOSPI')
    })

    it('prefere terminar numa frase inteira quando ela ocupa boa parte do limite', () => {
        const texto = 'Korea Broadcasting System é a emissora pública nacional coreana, fundada em 1961 e responsável por grande parte dos doramas. Opera o KBS1 e o KBS2 com programação variada.'
        expect(metaDescription(texto)).toBe('Korea Broadcasting System é a emissora pública nacional coreana, fundada em 1961 e responsável por grande parte dos doramas.')
    })

    it('sem frase que caiba, corta em limite de palavra e nunca no meio dela', () => {
        const texto = 'Divisão de entretenimento e mídia do grupo CJ que opera o tvN, OCN, Mnet e a plataforma TVING e é responsável por uma geração de doramas que redefiniu o padrão narrativo'
        const out = metaDescription(texto)
        expect(out.length).toBeLessThanOrEqual(161)
        expect(out.endsWith('…')).toBe(true)
        expect(texto.startsWith(out.slice(0, -1))).toBe(true)
        expect(out.slice(0, -1).endsWith(' ')).toBe(false)
    })
})
