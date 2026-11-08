import { describe, expect, it } from 'vitest'
import trilhas from './trilhas.json'

describe('trilhas do hub de cultura', () => {
    it('nenhum guia aparece em duas trilhas nem no início e numa trilha', () => {
        const todos = [...trilhas.inicio, ...trilhas.trilhas.flatMap((t) => t.slugs)]
        expect(new Set(todos).size).toBe(todos.length)
    })
})
