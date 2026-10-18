import { describe, expect, it } from 'vitest'
import { fandomValido } from './GroupsPage'

describe('fandomValido', () => {
    it('aceita um nome de fandom', () => expect(fandomValido(' ATINY ')).toBe('ATINY'))
    it('descarta vazio, traço e N/A', () => {
        for (const v of [undefined, null, '', '—', 'N/A', 'unknown']) expect(fandomValido(v)).toBeUndefined()
    })
    it('descarta texto longo demais', () => expect(fandomValido('x'.repeat(40))).toBeUndefined())
})
