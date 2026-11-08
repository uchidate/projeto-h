import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Trava de contrato: página que declara hreflang não pode fixar a lista de idiomas no código.
 * Foi uma lista fixa (`l === 'en'`) que deixou o ES fora do seletor do hub de cultura.
 * Idioma entra por `ACTIVE_LOCALES`/`buildAlternatesAtivos`/`hreflangDe`, nunca por literal.
 */
const RAIZES = ['components', 'app', 'lib']
const PADROES = [
    /filter\(\(\[l\]\)\s*=>[^)]*===\s*'en'/,
    /\(\[\s*'pt'\s*,\s*'en'(\s*,\s*'es')?\s*\]\s*as const\)\.map\([^)]*htmlLang/,
    /LOCALE_META\)\.filter\([^)]*===\s*'(en|es)'/,
]

function arquivos(dir: string): string[] {
    return readdirSync(dir).flatMap((nome) => {
        const caminho = join(dir, nome)
        if (statSync(caminho).isDirectory()) return nome === 'node_modules' ? [] : arquivos(caminho)
        return /\.(ts|tsx)$/.test(nome) && !/\.test\./.test(nome) ? [caminho] : []
    })
}

describe('hreflang sem lista fixa de idiomas', () => {
    it('nenhum arquivo monta o mapa de idiomas com literais', () => {
        const culpados = RAIZES.flatMap(arquivos).filter((f) => {
            const src = readFileSync(f, 'utf8')
            return PADROES.some((p) => p.test(src))
        })
        expect(culpados).toEqual([])
    })
})
