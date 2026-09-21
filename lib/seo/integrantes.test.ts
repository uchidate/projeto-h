import { describe, expect, it } from 'vitest'
import type { MemberSummary } from '@/lib/artists/memberSummary'
import { linhasIntegrantes, listaDeNomes } from './integrantes'

const HOJE = new Date(2026, 8, 22) // 22/09/2026

function membro(slug: string, nome: string, acf: MemberSummary['acf'] = {}): MemberSummary {
    return { id: 1, slug, title: { rendered: nome }, featured_image_url: undefined, blood_type: undefined, acf } as unknown as MemberSummary
}

describe('linhasIntegrantes', () => {
    it('calcula a idade na data dada, respeitando o aniversário', () => {
        const [antes, depois] = linhasIntegrantes([
            membro('a', 'A', { birth_date: '2000-09-23' }), // faz 26 amanhã
            membro('b', 'B', { birth_date: '2000-09-22' }), // faz 26 hoje
        ], {}, HOJE)
        expect(antes.idade).toBe(25)
        expect(depois.idade).toBe(26)
    })

    it('aceita a data no formato AAAAMMDD do ACF e devolve ISO', () => {
        const [l] = linhasIntegrantes([membro('a', 'A', { birth_date: '19951008' })], {}, HOJE)
        expect(l.nascimento).toBe('1995-10-08')
    })

    it('sem data válida, nascimento e idade ficam nulos (nada é inferido)', () => {
        const [semData, invalida] = linhasIntegrantes([
            membro('a', 'A'),
            membro('b', 'B', { birth_date: 'quando-foi' }),
        ], {}, HOJE)
        expect(semData.nascimento).toBeNull()
        expect(semData.idade).toBeNull()
        expect(invalida.nascimento).toBeNull()
        expect(invalida.idade).toBeNull()
    })

    it('falecido não tem idade "hoje"', () => {
        const [l] = linhasIntegrantes([membro('a', 'A', { birth_date: '1990-01-01', death_date: '2017-12-18' })], {}, HOJE)
        expect(l.nascimento).toBe('1990-01-01')
        expect(l.idade).toBeNull()
    })

    it('traduz as posições e mantém a desconhecida como veio', () => {
        const [l] = linhasIntegrantes([membro('a', 'A')], { a: ['leader', 'main_vocal', 'posicao_nova'] }, HOJE)
        expect(l.posicoes).toEqual(['Líder', 'Main Vocal', 'posicao_nova'])
    })

    it('limpa HTML do nome e preserva o hangul', () => {
        const [l] = linhasIntegrantes([membro('a', 'S.Coups &amp; <b>Co</b>', { name_hangul: ' 에스쿱스 ' })], {}, HOJE)
        expect(l.nome).not.toContain('<')
        expect(l.hangul).toBe('에스쿱스')
    })
})

describe('listaDeNomes', () => {
    it('formata "A, B e C"', () => {
        expect(listaDeNomes(['A', 'B', 'C'])).toBe('A, B e C')
        expect(listaDeNomes(['A', 'B'])).toBe('A e B')
        expect(listaDeNomes(['A'])).toBe('A')
        expect(listaDeNomes([])).toBe('')
    })

    it('aceita outro conector (idioma)', () => {
        expect(listaDeNomes(['A', 'B', 'C'], 'and')).toBe('A, B and C')
    })
})
