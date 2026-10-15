import { describe, it, expect } from 'vitest'
import { interpretarProvedores } from './watchProviders'

describe('interpretarProvedores', () => {
    it('sem Brasil e com Coreia e EUA: brasil vazio, fora na ordem de prioridade', () => {
        const d = interpretarProvedores({ results: {
            KR: { flatrate: [{ provider_name: 'wavve' }, { provider_name: 'Watcha' }, { provider_name: 'TVING' }] },
            US: { flatrate: [{ provider_name: 'Hulu' }] },
            TH: { flatrate: [{ provider_name: 'Viu' }] },
        } })
        expect(d?.brasil).toEqual([])
        expect(d?.fora).toEqual([
            { regiao: 'US', provedores: ['Hulu'] },
            { regiao: 'KR', provedores: ['wavve', 'Watcha', 'TVING'] },
        ])
    })

    it('com Brasil: junta assinatura, grátis e anúncio sem duplicar', () => {
        const d = interpretarProvedores({ results: { BR: { flatrate: [{ provider_name: 'Netflix' }], ads: [{ provider_name: 'Netflix' }, { provider_name: 'Pluto TV' }] } } })
        expect(d?.brasil).toEqual(['Netflix', 'Pluto TV'])
    })

    it('descarta variantes do mesmo serviço (with Ads, Amazon Channel)', () => {
        const d = interpretarProvedores({ results: { JP: { flatrate: [
            { provider_name: 'Amazon Prime Video' }, { provider_name: 'Channel K Amazon Channel' },
            { provider_name: 'Amazon Prime Video with Ads' }, { provider_name: 'FOD' },
        ] } } })
        expect(d?.fora[0].provedores).toEqual(['Amazon Prime Video', 'FOD'])
    })

    it('se só houver variantes, mantém em vez de apagar a região', () => {
        const d = interpretarProvedores({ results: { US: { ads: [{ provider_name: 'Hulu with Ads' }] } } })
        expect(d?.fora[0].provedores).toEqual(['Hulu with Ads'])
    })

    it('TMDB sem nenhuma região = sem informação, não "indisponível"', () => {
        expect(interpretarProvedores({ results: {} })).toBeNull()
        expect(interpretarProvedores({})).toBeNull()
    })

    it('limita a 3 regiões e 4 provedores por região', () => {
        const prov = ['a', 'b', 'c', 'd', 'e'].map(provider_name => ({ provider_name }))
        const d = interpretarProvedores({ results: { US: { flatrate: prov }, KR: { flatrate: prov }, JP: { flatrate: prov }, GB: { flatrate: prov } } })
        expect(d?.fora).toHaveLength(3)
        expect(d?.fora[0].provedores).toHaveLength(4)
    })
})
