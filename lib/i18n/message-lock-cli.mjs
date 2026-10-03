// npm run i18n:lock            → relatório (sai com 1 se faltar chave/lock; PT alterado só avisa)
// npm run i18n:lock -- --write → grava o lock com o PT atual (depois de revisar o EN)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { buildLock, compareMessages, flattenMessages } from './message-lock.ts'

const raiz = new URL('../../messages/', import.meta.url)
const carregar = (idioma) => {
    const plano = {}
    for (const arquivo of readdirSync(new URL(`${idioma}/`, raiz)).filter((f) => f.endsWith('.json')).sort()) {
        const arvore = JSON.parse(readFileSync(new URL(`${idioma}/${arquivo}`, raiz), 'utf8'))
        Object.assign(plano, flattenMessages(arquivo.replace(/\.json$/, ''), arvore))
    }
    return plano
}
const pt = carregar('pt')
const en = carregar('en')
const arquivoLock = new URL('.i18n-lock.json', raiz)

if (process.argv.includes('--write')) {
    const lock = buildLock(pt, en)
    writeFileSync(arquivoLock, JSON.stringify(lock, null, 2) + '\n')
    console.log(`lock gravado: ${Object.keys(lock).length} chaves`)
    process.exit(0)
}

let lock = {}
try { lock = JSON.parse(readFileSync(arquivoLock, 'utf8')) } catch { /* sem lock: tudo vira "unlocked" */ }
const r = compareMessages(pt, en, lock)
const mostrar = (titulo, chaves) => chaves.length && console.log(`${titulo} (${chaves.length}):\n  ${chaves.slice(0, 30).join('\n  ')}`)
mostrar('Sem EN', r.missing)
mostrar('EN sem PT', r.orphan)
mostrar('Sem registro no lock — rode npm run i18n:lock -- --write', r.unlocked)
mostrar('EN possivelmente desatualizado (PT mudou)', r.stale)
if (!r.missing.length && !r.orphan.length && !r.unlocked.length && !r.stale.length) console.log('messages em dia')
process.exit(r.missing.length || r.orphan.length || r.unlocked.length ? 1 : 0)
