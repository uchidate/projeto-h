import { describe, expect, it } from 'vitest'
import { proximasDatas } from './datas'

const hoje = '2026-09-26'

describe('próximas datas da torcida', () => {
    it('acha o aniversário de estreia e a idade que o membro faz', () => {
        const r = proximasDatas([{ nome: 'BTS', data: '20130613' }], [{ nome: 'Jimin', data: '19951013' }], hoje, 365)
        expect(r.find(x => x.tipo === 'aniversario')).toMatchObject({ quem: 'Jimin', dia: '13/10', dias: 17, anos: 31 })
        expect(r.find(x => x.tipo === 'estreia')).toMatchObject({ quem: 'BTS', dia: '13/06', anos: 14 })
    })
    it('data de hoje conta como 0 dias', () => {
        expect(proximasDatas([], [{ nome: 'A', data: '20000926' }], hoje)[0]).toMatchObject({ dias: 0, anos: 26 })
    })
    it('data que já passou este ano vira a do ano que vem', () => {
        const r = proximasDatas([], [{ nome: 'A', data: '19990101' }], hoje, 365)
        expect(r[0]).toMatchObject({ dias: 97, anos: 28 })
    })
    it('respeita o limite de dias e o máximo, em ordem', () => {
        const membros = ['1001', '1002', '1003', '1004', '1231'].map((md, i) => ({ nome: `M${i}`, data: `1995${md}` }))
        const r = proximasDatas([], membros, hoje, 30, 3)
        expect(r.map(x => x.quem)).toEqual(['M0', 'M1', 'M2'])
        expect(r.every(x => x.dias <= 30)).toBe(true)
    })
    it('ignora grupo encerrado, dado inválido e ano de estreia zero', () => {
        expect(proximasDatas([{ nome: 'X', data: '20000101', encerrado: true }], [{ nome: 'Y', data: 'lixo' }], hoje, 365)).toEqual([])
    })
    it('29 de fevereiro não quebra', () => {
        expect(() => proximasDatas([], [{ nome: 'B', data: '20000229' }], '2027-02-20', 30)).not.toThrow()
    })
})
