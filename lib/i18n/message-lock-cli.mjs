// npm run i18n:lock                      → relatório de todos os idiomas (sai com 1 se faltar chave/lock; PT alterado só avisa)
// npm run i18n:lock -- --locale es       → só o espanhol
// npm run i18n:lock -- --write [--locale es] → grava o lock com o PT atual (depois de revisar a tradução)
// Um lock por idioma: messages/.i18n-lock.<idioma>.json
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { buildLock, compareMessages, flattenMessages } from './message-lock.ts'
import { LOCALES, SOURCE_LOCALE } from './idiomas.mjs'

const raiz = new URL('../../messages/', import.meta.url)
const carregar = (idioma) => {
    const plano = {}
    for (const arquivo of readdirSync(new URL(`${idioma}/`, raiz)).filter((f) => f.endsWith('.json')).sort()) {
        const arvore = JSON.parse(readFileSync(new URL(`${idioma}/${arquivo}`, raiz), 'utf8'))
        Object.assign(plano, flattenMessages(arquivo.replace(/\.json$/, ''), arvore))
    }
    return plano
}
const i = process.argv.indexOf('--locale')
const idiomas = i >= 0 ? [process.argv[i + 1]] : LOCALES.filter((l) => l !== SOURCE_LOCALE)
const escrever = process.argv.includes('--write')
const fonte = carregar(SOURCE_LOCALE)
const mostrar = (titulo, chaves) => chaves.length && console.log(`${titulo} (${chaves.length}):\n  ${chaves.slice(0, 30).join('\n  ')}`)
let falhou = false

for (const idioma of idiomas) {
    if (!LOCALES.includes(idioma) || idioma === SOURCE_LOCALE) { console.error(`idioma inválido: ${idioma}`); process.exit(2) }
    const traducao = carregar(idioma)
    const arquivoLock = new URL(`.i18n-lock.${idioma}.json`, raiz)
    if (escrever) {
        const lock = buildLock(fonte, traducao)
        writeFileSync(arquivoLock, JSON.stringify(lock, null, 2) + '\n')
        console.log(`${idioma}: lock gravado, ${Object.keys(lock).length} chaves`)
        continue
    }
    let lock = {}
    try { lock = JSON.parse(readFileSync(arquivoLock, 'utf8')) } catch { /* sem lock: tudo vira "unlocked" */ }
    const r = compareMessages(fonte, traducao, lock)
    console.log(`\n== ${idioma}`)
    mostrar('Sem tradução', r.missing)
    mostrar('Tradução sem original', r.orphan)
    mostrar(`Sem registro no lock — rode npm run i18n:lock -- --write --locale ${idioma}`, r.unlocked)
    mostrar('Tradução possivelmente desatualizada (original mudou)', r.stale)
    if (!r.missing.length && !r.orphan.length && !r.unlocked.length && !r.stale.length) console.log('em dia')
    if (r.missing.length || r.orphan.length || r.unlocked.length) falhou = true
}
process.exit(falhou ? 1 : 0)
