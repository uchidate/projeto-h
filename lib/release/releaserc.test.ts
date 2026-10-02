import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { analyzeCommits } from '@semantic-release/commit-analyzer'

// Guarda das regras de versão do semantic-release (.releaserc.json). O analisador avalia
// TODAS as regras que casam e uma regra `release: false` posterior sobrescreve a anterior,
// então `chore(deps) → patch` e `breaking → major` precisam vir DEPOIS das genéricas. Sem
// `breaking`, uma mudança incompatível sairia como minor ou patch.
const cfg = JSON.parse(readFileSync('.releaserc.json', 'utf8')).plugins[0][1]

async function tipo(message: string) {
    const r = await analyzeCommits(cfg, { cwd: process.cwd(), commits: [{ hash: 'a', message }], logger: { log() {} } })
    return r ?? null
}

describe('regras de versão (.releaserc.json)', () => {
    it.each([
        ['fix(security): sanitiza logs', 'patch'],
        ['feat(guias): nova página', 'minor'],
        ['perf(guias): torna cacheável', 'patch'],
        ['revert: desfaz x', 'patch'],
        ['chore(deps): bump next from 16.3.5 to 16.3.8', 'patch'],
        ['chore(deps-dev): bump the desenvolvimento group', null],
        ['ci(deps): bump actions/upload-artifact from 4 to 7', null],
        ['chore: ajuste interno', null],
        ['docs: texto', null],
        ['feat!: quebra de API', 'major'],
        ['chore!: remove suporte', 'major'],
        ['fix: x\n\nBREAKING CHANGE: muda o contrato', 'major'],
    ])('%s → %s', async (mensagem, esperado) => {
        expect(await tipo(mensagem)).toBe(esperado)
    })
})
