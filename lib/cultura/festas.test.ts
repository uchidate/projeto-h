import { describe, expect, it } from 'vitest'
import { FESTAS, MESES_DE_FOLGA, mesesRestantes, proximasFestas, ultimaFesta } from './festas'

describe('festas do hub de cultura', () => {
    it('datas válidas, em ordem e com a nota preenchida', () => {
        const datas = FESTAS.map(f => Date.parse(f.data))
        expect(datas.every(d => !Number.isNaN(d))).toBe(true)
        expect(datas).toEqual([...datas].sort((a, b) => a - b))
        expect(FESTAS.every(f => f.nome && f.hangul && f.nota)).toBe(true)
    })

    it('guia, quando existe, aponta para /blog/', () => {
        expect(FESTAS.filter(f => f.guia).every(f => f.guia!.startsWith('/blog/'))).toBe(true)
    })

    it('proximasFestas conta os dias, descarta as passadas e limita a 4', () => {
        const r = proximasFestas(new Date(2027, 0, 10))
        expect(r).toHaveLength(4)
        expect(r[0]).toMatchObject({ nome: 'Seollal', dias: 28 })
        expect(proximasFestas(new Date(2027, 1, 7))[0].dias).toBe(0)
        expect(proximasFestas(new Date(2027, 1, 8))[0].nome).toBe('Daeboreum')
    })

    it('lista esgotada devolve vazio', () => {
        expect(proximasFestas(new Date(2030, 0, 1))).toEqual([])
    })

    it('mesesRestantes mede até a última data', () => {
        const fim = [{ nome: 'x', hangul: 'x', data: '2028-10-09', nota: 'dano' as const }]
        expect(mesesRestantes(new Date(2028, 3, 9), fim)).toBe(6)
        expect(mesesRestantes(new Date(2028, 3, 10), fim)).toBe(5)
        expect(mesesRestantes(new Date(2029, 0, 1), fim)).toBeLessThan(0)
    })

    // Aviso de manutenção: quando faltarem menos de 6 meses para a última festa, este teste
    // falha e lembra de acrescentar as datas do ano seguinte em lib/cultura/festas.json.
    it(`a lista cobre pelo menos ${MESES_DE_FOLGA} meses à frente (ultima: ver festas.json)`, () => {
        const meses = mesesRestantes()
        expect(
            meses,
            `Faltam ${meses} meses para a última festa (${ultimaFesta().toISOString().slice(0, 10)}). Acrescente o ano seguinte em lib/cultura/festas.json (datas lunares conferidas em fonte oficial).`,
        ).toBeGreaterThanOrEqual(MESES_DE_FOLGA)
    })
})
