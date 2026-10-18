import { describe, it, expect } from 'vitest'
import { confiancaDaNota, interpretarAvaliacao, MIN_VOTOS_NOTA } from '@/lib/tmdb/avaliacao'

describe('confiancaDaNota', () => {
    it('separa sem votos, poucos votos e confiável', () => {
        expect(confiancaDaNota(0)).toBe('sem-votos')
        expect(confiancaDaNota(1)).toBe('poucos-votos')
        expect(confiancaDaNota(MIN_VOTOS_NOTA - 1)).toBe('poucos-votos')
        expect(confiancaDaNota(MIN_VOTOS_NOTA)).toBe('confiavel')
        expect(confiancaDaNota(116)).toBe('confiavel')
    })
})

describe('interpretarAvaliacao', () => {
    it('arredonda a nota a uma casa e mantém os votos', () => {
        expect(interpretarAvaliacao({ vote_average: 8.534, vote_count: 116 })).toEqual({ nota: 8.5, votos: 116 })
    })
    it('mantém 10,0 com 1 voto, para a interface decidir como exibir', () => {
        expect(interpretarAvaliacao({ vote_average: 10, vote_count: 1 })).toEqual({ nota: 10, votos: 1 })
    })
    it('devolve null sem nota ou sem votos', () => {
        expect(interpretarAvaliacao({})).toBeNull()
        expect(interpretarAvaliacao({ vote_average: 0, vote_count: 0 })).toBeNull()
        expect(interpretarAvaliacao({ vote_average: 7, vote_count: 0 })).toBeNull()
    })
})
