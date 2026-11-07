// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LOCALES, DEFAULT_LOCALE } from './idiomas.mjs'
import { flattenMessages } from './message-lock'

const RAIZ = join(__dirname, '../../messages')

const carregar = (locale: string) => {
    const plano: Record<string, unknown> = {}
    for (const arquivo of readdirSync(join(RAIZ, locale)).filter((f) => f.endsWith('.json'))) {
        Object.assign(plano, flattenMessages(arquivo.replace(/\.json$/, ''), JSON.parse(readFileSync(join(RAIZ, locale, arquivo), 'utf8'))))
    }
    return plano
}

/** Nomes dos argumentos ICU de primeiro nível (`{n, plural, one {# x}}` conta só `n`) e das tags (`<b>`, `<link>`). */
export function variaveis(texto: string): string {
    const nomes: string[] = []
    let nivel = 0
    for (let i = 0; i < texto.length; i++) {
        const c = texto[i]
        if (c === '{') {
            if (nivel === 0) nomes.push(texto.slice(i + 1).match(/^\s*([A-Za-z_]\w*)/)?.[1] ?? '')
            nivel++
        } else if (c === '}') nivel--
    }
    const tags = [...texto.matchAll(/<\/?([a-z][\w-]*)/gi)].map((m) => `<${m[1]}>`)
    return [...new Set([...nomes.filter(Boolean), ...tags])].sort().join(' ')
}

// Tradução vazia (`''`) é chave deliberadamente sem uso naquele idioma (ex.: en quiz.sobre.p3) e não entra.
describe('variáveis e tags iguais ao português, em todo idioma que tem catálogo', () => {
    const pt = carregar(DEFAULT_LOCALE)
    for (const locale of LOCALES.filter((l) => l !== DEFAULT_LOCALE)) {
        it(locale, () => {
            const outro = carregar(locale)
            const diferentes = Object.keys(pt)
                .filter((k) => typeof pt[k] === 'string' && typeof outro[k] === 'string' && outro[k] !== '' && variaveis(pt[k] as string) !== variaveis(outro[k] as string))
                .map((k) => `${k}: «${variaveis(pt[k] as string)}» × «${variaveis(outro[k] as string)}»`)
            expect(diferentes).toEqual([])
        })
    }

    it('lê argumentos de primeiro nível e ignora o texto dos ramos do plural', () => {
        expect(variaveis('{count, plural, one {# obra} other {# obras}}')).toBe('count')
        expect(variaveis('Em {a} e {b}: <b>x</b> <b>y</b>')).toBe('<b> a b')
    })
})
