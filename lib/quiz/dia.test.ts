import { describe, expect, it } from 'vitest'
import { chaveDia, escolherDoDia, sequenciaApos, sequenciaVigente } from './dia'

const e = (ultimo: string, sequencia: number) => ({ ultimo, resposta: 0, acertou: true, sequencia })

describe('pergunta do dia', () => {
    it('usa o dia de Brasília, não o UTC', () => {
        expect(chaveDia(new Date('2026-09-27T02:30:00Z'))).toBe('2026-09-26')
    })
    it('escolhe a mesma pergunta no mesmo dia e muda no dia seguinte', () => {
        const qs = [{ id: 3 }, { id: 1 }, { id: 2 }]
        expect(escolherDoDia(qs, '2026-09-26')).toEqual(escolherDoDia([...qs].reverse(), '2026-09-26'))
        expect(escolherDoDia(qs, '2026-09-26')).not.toEqual(escolherDoDia(qs, '2026-09-27'))
    })
    it('lista vazia não escolhe nada', () => { expect(escolherDoDia([], '2026-09-26')).toBeNull() })
    it('continua a sequência se respondeu ontem e recomeça se pulou um dia', () => {
        expect(sequenciaApos(e('2026-09-25', 3), '2026-09-26')).toBe(4)
        expect(sequenciaApos(e('2026-09-24', 3), '2026-09-26')).toBe(1)
        expect(sequenciaApos(null, '2026-09-26')).toBe(1)
    })
    it('não conta duas vezes no mesmo dia', () => {
        expect(sequenciaApos(e('2026-09-26', 4), '2026-09-26')).toBe(4)
    })
    it('a sequência mostrada zera quando passou de ontem', () => {
        expect(sequenciaVigente(e('2026-09-25', 3), '2026-09-26')).toBe(3)
        expect(sequenciaVigente(e('2026-09-23', 3), '2026-09-26')).toBe(0)
    })
})
