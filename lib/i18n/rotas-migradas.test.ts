import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ROTAS_MIGRADAS, rewritesDasRotasMigradas } from './rotas-migradas.mjs'
import { href } from './routes'

const RAIZ = process.cwd()
const pagina = (grupo: string, caminho: string) => join(RAIZ, 'app', grupo, caminho, 'page.tsx')

describe('rotas migradas para a árvore única', () => {
    it('não repete rota', () => {
        expect(new Set(ROTAS_MIGRADAS.map((r) => r.pt)).size).toBe(ROTAS_MIGRADAS.length)
    })

    it.each(ROTAS_MIGRADAS)('$pt: página única em (intl) que serve o português, sem cópia em (site)', ({ pt, interno }) => {
        const emIntl = pagina('(intl)/[locale]', interno)
        expect(existsSync(emIntl), `falta ${emIntl}`).toBe(true)
        expect(readFileSync(emIntl, 'utf8'), `${interno} precisa de servePt: true`).toContain('servePt: true')
        expect(existsSync(pagina('(site)', pt)), `sobrou cópia em app/(site)${pt}`).toBe(false)
    })

    it.each(ROTAS_MIGRADAS)('$pt: bate com o registro de caminhos por idioma', ({ pt, interno }) => {
        // O caminho em inglês de ROUTES é o nome da pasta; o em português é a URL pública.
        const rotas = ['about', 'contact', 'ethics', 'editorialStandards', 'corrections'] as const
        const achada = rotas.find((r) => href(r, undefined, 'pt') === pt)
        expect(achada, `${pt} não está em ROUTES`).toBeDefined()
        expect(href(achada!, undefined, 'en')).toBe(`/en${interno}`)
    })

    it('gera um rewrite por rota, para /pt/<pasta>', () => {
        expect(rewritesDasRotasMigradas()).toContainEqual({ source: '/contato', destination: '/pt/contact' })
        expect(rewritesDasRotasMigradas()).toHaveLength(ROTAS_MIGRADAS.length)
    })
})
