import { createHash } from 'node:crypto'

/**
 * Lockfile dos textos de interface (D12 em docs/I18N-V2.md).
 *
 * `messages/.i18n-lock.json` guarda, por chave, o hash do valor em português
 * quando o inglês foi escrito/revisado. Se o PT muda e o lock não, o EN está
 * possivelmente desatualizado. Só funções puras; sem dependência do app.
 */

export type MessageTree = { [key: string]: string | MessageTree }
export type MessageLock = Record<string, string>

/** `namespace.caminho.da.chave` → valor, para toda folha de texto. */
export function flattenMessages(namespace: string, tree: MessageTree, prefix = namespace): Record<string, string> {
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(tree)) {
        const path = `${prefix}.${key}`
        if (typeof value === 'string') out[path] = value
        else Object.assign(out, flattenMessages(namespace, value, path))
    }
    return out
}

export function hashMessage(value: string): string {
    return createHash('sha256').update(value).digest('hex').slice(0, 12)
}

export interface LockReport {
    /** Chave existe em PT e não em EN. */
    missing: string[]
    /** Chave existe em EN e não em PT. */
    orphan: string[]
    /** PT mudou desde que o EN foi registrado no lock. */
    stale: string[]
    /** Chave em PT e EN sem registro no lock (rodar `npm run i18n:lock`). */
    unlocked: string[]
}

export function compareMessages(pt: Record<string, string>, en: Record<string, string>, lock: MessageLock): LockReport {
    const missing = Object.keys(pt).filter((k) => !(k in en))
    const orphan = Object.keys(en).filter((k) => !(k in pt))
    const both = Object.keys(pt).filter((k) => k in en)
    const unlocked = both.filter((k) => !(k in lock))
    const stale = both.filter((k) => k in lock && lock[k] !== hashMessage(pt[k]))
    return { missing, orphan, stale, unlocked }
}

/** Lock novo: o PT atual de toda chave que já tem EN. Chamar só depois de revisar o EN. */
export function buildLock(pt: Record<string, string>, en: Record<string, string>): MessageLock {
    const lock: MessageLock = {}
    for (const key of Object.keys(pt).sort()) if (key in en) lock[key] = hashMessage(pt[key])
    return lock
}
