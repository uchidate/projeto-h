#!/usr/bin/env node
/**
 * Mede português visível nas páginas /en de produção e compara com a linha de base.
 *
 *   node lib/i18n/vazamento-cli.mjs            # imprime o relatório, sai 1 se houver regressão
 *   node lib/i18n/vazamento-cli.mjs --write    # grava a linha de base com o resultado atual
 *   HH_BASE=https://staging.exemplo node ...   # outro host
 *
 * Só leitura: GET com ?nocache= (a Cloudflare guarda a página). Amostra = rotas fixas + alguns
 * detalhes tirados dos links de cada listagem (/en/<seção>/<slug>).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { linhasEmPortugues, regressoes } from './vazamento.ts'

const BASE = (process.env.HH_BASE || 'https://www.hallyuhub.com.br').replace(/\/$/, "")
const ARQUIVO = fileURLToPath(new URL('./vazamento-baseline.json', import.meta.url))
const POR_LISTAGEM = 3

const FIXAS = [
    '/en', '/en/groups', '/en/artists', '/en/productions', '/en/news', '/en/blog', '/en/foods',
    '/en/companies', '/en/agencies', '/en/guides', '/en/calendar', '/en/trending', '/en/search',
    '/en/artists/birthdays', '/en/positions', '/en/fandoms',
]
const LISTAGENS = ['/en/groups', '/en/artists', '/en/productions', '/en/blog', '/en/foods', '/en/guides', '/en/companies', '/en/agencies']

async function baixar(caminho) {
    const url = `${BASE}${caminho}${caminho.includes('?') ? '&' : '?'}nocache=${Date.now()}`
    const r = await fetch(url, { headers: { 'user-agent': 'hallyuhub-vazamento/1' } })
    return { status: r.status, html: r.ok ? await r.text() : '' }
}

function detalhesDe(html, listagem) {
    const re = new RegExp(`href="(${listagem}/[a-z0-9][a-z0-9-]*)"`, 'g')
    return [...new Set([...html.matchAll(re)].map(m => m[1]))].slice(0, POR_LISTAGEM)
}

async function amostra() {
    const caminhos = new Set(FIXAS)
    for (const l of LISTAGENS) {
        const { html } = await baixar(l)
        for (const d of detalhesDe(html, l)) caminhos.add(d)
    }
    return [...caminhos]
}

const escrever = process.argv.includes('--write')
const resultados = []
for (const caminho of await amostra()) {
    const { status, html } = await baixar(caminho)
    if (status !== 200) {
        console.warn(`! ${caminho} → HTTP ${status} (ignorada)`)
        continue
    }
    resultados.push({ caminho, linhas: linhasEmPortugues(html) })
}

if (escrever) {
    const base = Object.fromEntries(resultados.map(r => [r.caminho, r.linhas.length]))
    writeFileSync(ARQUIVO, JSON.stringify(base, null, 2) + '\n')
    console.log(`Linha de base gravada: ${resultados.length} páginas, ${Object.values(base).reduce((a, b) => a + b, 0)} linhas suspeitas.`)
    process.exit(0)
}

let base = {}
try { base = JSON.parse(readFileSync(ARQUIVO, 'utf8')) } catch { console.warn('Sem linha de base: toda linha suspeita conta como regressão.') }

const total = resultados.reduce((a, r) => a + r.linhas.length, 0)
console.log(`${resultados.length} páginas, ${total} linhas suspeitas no total.`)
// Detalhe sorteado da listagem que não está na linha de base só informa: um conteúdo antigo
// sem tradução que entra na amostra não é regressão do código.
const conhecida = r => FIXAS.includes(r.caminho) || r.caminho in base
const ruins = regressoes(resultados.filter(conhecida), base)
const soInforma = resultados.filter(r => !conhecida(r) && r.linhas.length)
for (const r of soInforma) console.log(`· amostra nova ${r.caminho}: ${r.linhas.length} linha(s) suspeita(s), fora da linha de base`)
for (const r of ruins) {
    console.log(`\n✗ ${r.caminho}: ${r.antes} → ${r.agora}`)
    for (const l of r.novas.slice(0, 8)) console.log(`    ${l.slice(0, 140)}`)
}
if (ruins.length) process.exit(1)
console.log('Sem regressão.')
