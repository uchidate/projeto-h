import { describe, it, expect } from 'vitest'
import { accessibleAccent, normalizeAccent, optionalAccent, toRgba, countryLabel, agencyMark } from './presentation'

describe('normalizeAccent', () => {
    it('retorna o fallback quando o valor é null/undefined/vazio', () => {
        expect(normalizeAccent(null)).toBe('#dc2626')
        expect(normalizeAccent(undefined)).toBe('#dc2626')
        expect(normalizeAccent('')).toBe('#dc2626')
    })

    it('aceita um fallback customizado', () => {
        expect(normalizeAccent(null, '#000000')).toBe('#000000')
    })

    it('retorna hex de 6 dígitos como está (case-insensitive)', () => {
        expect(normalizeAccent('#AABBCC')).toBe('#AABBCC')
    })

    it('expande hex de 3 dígitos pra 6', () => {
        expect(normalizeAccent('#abc')).toBe('#aabbcc')
    })

    it('remove espaços em volta do valor', () => {
        expect(normalizeAccent('  #ff0000  ')).toBe('#ff0000')
    })

    it('retorna o fallback pra hex inválido', () => {
        expect(normalizeAccent('not-a-color')).toBe('#dc2626')
        expect(normalizeAccent('#gggggg')).toBe('#dc2626')
        expect(normalizeAccent('#12345')).toBe('#dc2626')
    })
})

describe('optionalAccent', () => {
    it('retorna null quando o valor é null/undefined/vazio', () => {
        expect(optionalAccent(null)).toBeNull()
        expect(optionalAccent(undefined)).toBeNull()
        expect(optionalAccent('')).toBeNull()
    })

    it('retorna null pra hex inválido (não cai no fallback vermelho como normalizeAccent)', () => {
        expect(optionalAccent('not-a-color')).toBeNull()
    })

    it('retorna o hex normalizado quando válido', () => {
        expect(optionalAccent('#abc')).toBe('#aabbcc')
        expect(optionalAccent('#123456')).toBe('#123456')
    })
})

describe('toRgba', () => {
    it('converte hex de 6 dígitos pra rgba com o alpha informado', () => {
        expect(toRgba('#ff0000', 0.5)).toBe('rgba(255,0,0,0.5)')
    })

    it('usa o fallback (via normalizeAccent) quando o hex é inválido', () => {
        expect(toRgba('invalido', 0.3)).toBe('rgba(220,38,38,0.3)') // #dc2626
    })

    it('expande hex de 3 dígitos antes de converter', () => {
        expect(toRgba('#0f0', 1)).toBe('rgba(0,255,0,1)')
    })
})

describe('accessibleAccent', () => {
    it('clareia cores institucionais escuras para uso como texto e linha', () => {
        expect(accessibleAccent('#0f172a')).not.toBe('#0f172a')
    })

    it('mantém o retorno como hexadecimal normalizado', () => {
        expect(accessibleAccent('#f00')).toMatch(/^#[0-9a-f]{6}$/)
    })
})

describe('countryLabel', () => {
    it('retorna "Coreia do Sul" pro código KR', () => {
        expect(countryLabel('KR')).toBe('Coreia do Sul')
    })

    it('retorna "Coreia do Sul" pro nome longo do WP', () => {
        expect(countryLabel('Korea, Republic of')).toBe('Coreia do Sul')
    })

    it('retorna "Coreia do Sul" quando o país é null/undefined', () => {
        expect(countryLabel(null)).toBe('Coreia do Sul')
        expect(countryLabel(undefined)).toBe('Coreia do Sul')
    })

    it('retorna o país como está pra qualquer outro valor', () => {
        expect(countryLabel('Japan')).toBe('Japan')
    })
})

describe('agencyMark', () => {
    it('gera as iniciais das primeiras 3 palavras significativas do nome', () => {
        expect(agencyMark('Hybe Universe Studio')).toBe('HUS')
    })

    it('remove palavras genéricas de tipo de empresa antes de gerar as iniciais', () => {
        expect(agencyMark('SM Entertainment')).toBe('SM')
        expect(agencyMark('JYP Entertainment Corporation')).toBe('JYP')
    })

    it('com só 1 palavra significativa, usa as 3 primeiras letras dela', () => {
        expect(agencyMark('Hybe')).toBe('HYB')
    })

    it('quando remover as palavras genéricas zera todas as palavras, usa as 3 primeiras letras do nome original', () => {
        expect(agencyMark('Entertainment')).toBe('ENT')
    })

    it('lida com nomes com pontuação/caracteres especiais', () => {
        expect(agencyMark('P NATION')).toBe('PN')
    })
})
