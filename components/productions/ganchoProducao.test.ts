import { describe, expect, it } from 'vitest'
import { ganchoProducao } from './ProductionCard'

describe('ganchoProducao', () => {
    it('usa os dois primeiros nomes e a rede', () => {
        expect(ganchoProducao({ main_cast: 'A, B, C', network: 'Netflix' } as never)).toEqual({ elenco: 'A, B', rede: 'Netflix', noAr: false })
    })
    it('tira id entre parênteses do nome', () => {
        expect(ganchoProducao({ main_cast: 'Lee Sang-min (4066834), Jeong' } as never)?.elenco).toBe('Lee Sang-min, Jeong')
    })
    it('descarta rede "None" e marca quem está no ar', () => {
        expect(ganchoProducao({ main_cast: 'A', network: 'None', status_production: 'ongoing' } as never)).toEqual({ elenco: 'A', rede: undefined, noAr: true })
    })
    it('sem elenco não há gancho', () => expect(ganchoProducao({ network: 'tvN' } as never)).toBeNull())
})
