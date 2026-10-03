import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildLock, compareMessages, flattenMessages, hashMessage, type MessageLock } from './message-lock'

describe('flattenMessages', () => {
    it('achata com namespace e caminho', () => {
        expect(flattenMessages('entity', { a: { b: 'x' }, c: 'y' })).toEqual({ 'entity.a.b': 'x', 'entity.c': 'y' })
    })
})

describe('compareMessages', () => {
    const pt = { 'n.a': 'um', 'n.b': 'dois', 'n.c': 'tres' }
    const en = { 'n.a': 'one', 'n.b': 'two', 'n.z': 'extra' }

    it('separa faltando, órfã, sem registro e desatualizada', () => {
        const lock: MessageLock = { 'n.a': hashMessage('um'), 'n.b': hashMessage('2 antigo') }
        const r = compareMessages(pt, en, lock)
        expect(r.missing).toEqual(['n.c'])
        expect(r.orphan).toEqual(['n.z'])
        expect(r.stale).toEqual(['n.b'])
        expect(r.unlocked).toEqual([])
        expect(compareMessages(pt, en, {}).unlocked).toEqual(['n.a', 'n.b'])
    })

    it('buildLock registra só chaves que já têm EN', () => {
        expect(Object.keys(buildLock(pt, en))).toEqual(['n.a', 'n.b'])
    })
})

describe('messages/ no repositório', () => {
    const raiz = join(process.cwd(), 'messages')
    const carregar = (idioma: string) => {
        const plano: Record<string, string> = {}
        for (const arquivo of readdirSync(join(raiz, idioma)).filter((f) => f.endsWith('.json'))) {
            Object.assign(plano, flattenMessages(arquivo.replace(/\.json$/, ''), JSON.parse(readFileSync(join(raiz, idioma, arquivo), 'utf8'))))
        }
        return plano
    }
    const lock = JSON.parse(readFileSync(join(raiz, '.i18n-lock.json'), 'utf8')) as MessageLock
    const r = compareMessages(carregar('pt'), carregar('en'), lock)

    it('toda chave PT tem EN, e vice-versa', () => {
        expect(r.missing).toEqual([])
        expect(r.orphan).toEqual([])
    })

    it('toda chave traduzida está no lock (npm run i18n:lock -- --write)', () => {
        expect(r.unlocked).toEqual([])
    })

    it('avisa, sem falhar, quando o PT mudou depois do EN', () => {
        if (r.stale.length) console.warn(`EN possivelmente desatualizado (${r.stale.length}): ${r.stale.join(', ')}`)
    })
})
