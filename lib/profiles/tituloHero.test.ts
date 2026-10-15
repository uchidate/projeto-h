import { describe, it, expect } from 'vitest'
import { classeDoTituloHero } from './tituloHero'

describe('classeDoTituloHero', () => {
    it('título curto mantém o corpo grande', () => {
        expect(classeDoTituloHero('Mimi')).toContain('text-[40px]')
    })
    it('título médio e longo descem de faixa', () => {
        expect(classeDoTituloHero('Pousando no Seu Coração')).toContain('text-[34px]')
        expect(classeDoTituloHero('O Retorno de um Gangster no Ensino Médio')).toContain('text-[28px]')
    })
    it('título muito longo usa a menor faixa', () => {
        expect(classeDoTituloHero('O Misterioso Caso do Colégio Interno Esquecido na Montanha Gelada')).toContain('text-[24px]')
    })
    it('conta caracteres, não bytes (hangul)', () => {
        expect(classeDoTituloHero('조폭인 내가 고등학생이 되었습니다')).toContain('text-[34px]')
    })
})
