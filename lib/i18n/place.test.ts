import { describe, expect, it } from 'vitest'
import { localizePlace, placeWithPreposition } from './place'

describe('localizePlace', () => {
    it('traduz cidade e país conhecidos para português', () => {
        expect(localizePlace('Seoul, South Korea')).toBe('Seul, Coreia do Sul')
        expect(localizePlace('Philippines')).toBe('Filipinas')
    })

    it('traduz só os trechos conhecidos e preserva o resto', () => {
        expect(localizePlace('Cheongju, North Chungcheong, South Korea')).toBe('Cheongju, Chungcheong do Norte, Coreia do Sul')
        expect(localizePlace('Busan, South Korea')).toBe('Busan, Coreia do Sul')
    })

    it('normaliza espaços e devolve null para vazio', () => {
        expect(localizePlace(' Seoul, South Korea')).toBe('Seul, Coreia do Sul')
        expect(localizePlace('')).toBeNull()
        expect(localizePlace(undefined)).toBeNull()
    })

    it('não traduz fora do português nem valor já em português', () => {
        expect(localizePlace('Seoul, South Korea', 'en')).toBe('Seoul, South Korea')
        expect(localizePlace('Seul, Coreia do Sul')).toBe('Seul, Coreia do Sul')
    })

    it('usa a contração certa para país sozinho e "em" com cidade', () => {
        expect(placeWithPreposition('Filipinas')).toBe('nas Filipinas')
        expect(placeWithPreposition('Coreia do Sul')).toBe('na Coreia do Sul')
        expect(placeWithPreposition('Japão')).toBe('no Japão')
        expect(placeWithPreposition('Estados Unidos')).toBe('nos Estados Unidos')
        expect(placeWithPreposition('Seul, Coreia do Sul')).toBe('em Seul, Coreia do Sul')
        expect(placeWithPreposition('Taiwan')).toBe('em Taiwan')
        expect(placeWithPreposition('Japan', 'en')).toBe('in Japan')
    })
})
