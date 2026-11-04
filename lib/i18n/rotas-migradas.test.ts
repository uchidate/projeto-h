import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ROTAS_MIGRADAS, rewritesDasRotasMigradas } from './rotas-migradas.mjs'
import { href } from './routes'

const RAIZ = process.cwd()
const pagina = (grupo: string, caminho: string) => join(RAIZ, 'app', grupo, caminho, 'page.tsx')

describe('rotas migradas para a árvore única', () => {
    it('toda página de (intl) que serve o português está registrada (senão /<rota> dá 404, sem rewrite para /pt/...)', () => {
        const base = join(RAIZ, 'app', '(intl)', '[locale]')
        const servemPt = readdirSync(base, { withFileTypes: true })
            .filter((d) => d.isDirectory() && !d.name.startsWith('['))
            .map((d) => d.name)
            .filter((nome) => {
                const arquivo = join(base, nome, 'page.tsx')
                return existsSync(arquivo) && readFileSync(arquivo, 'utf8').includes('servePt: true')
            })
        const registradas = ROTAS_MIGRADAS.map((r) => r.interno.slice(1))
        expect(servemPt.filter((n) => !registradas.includes(n))).toEqual([])
    })

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
        const rotas = ['about', 'contact', 'ethics', 'editorialStandards', 'corrections', 'groups', 'artists', 'productions', 'blog', 'foods', 'guides', 'positions', 'trending', 'agencies', 'companies', 'fandoms', 'calendar'] as const
        const achada = rotas.find((r) => href(r, undefined, 'pt') === pt)
        expect(achada, `${pt} não está em ROUTES`).toBeDefined()
        expect(href(achada!, undefined, 'en')).toBe(`/en${interno}`)
    })

    it.each(ROTAS_MIGRADAS.filter((r) => r.filtrado))('$pt: a variante filtrado existe, serve o português e não sobrou cópia em (site)', ({ pt, interno }) => {
        const emIntl = pagina('(intl)/[locale]', `${interno}/filtrado`)
        expect(existsSync(emIntl), `falta ${emIntl}`).toBe(true)
        expect(readFileSync(emIntl, 'utf8')).toContain('servePt: true')
        expect(existsSync(pagina('(site)', `${pt}/filtrado`))).toBe(false)
    })

    it('gera um rewrite simples por rota, para /pt/<pasta>', () => {
        const simples = rewritesDasRotasMigradas().filter((r) => !('has' in r))
        expect(simples).toContainEqual({ source: '/contato', destination: '/pt/contact' })
        expect(simples).toHaveLength(ROTAS_MIGRADAS.length)
    })

    it('os desvios por query vêm ANTES dos rewrites simples (o primeiro que casa vale)', () => {
        const todos = rewritesDasRotasMigradas()
        const ultimoDesvio = todos.map((r) => 'has' in r).lastIndexOf(true)
        const primeiroSimples = todos.findIndex((r) => !('has' in r))
        expect(ultimoDesvio).toBeGreaterThanOrEqual(0)
        expect(ultimoDesvio).toBeLessThan(primeiroSimples)
    })

    it('/groups desvia por query nos dois idiomas, para o filtrado do idioma certo', () => {
        const todos = rewritesDasRotasMigradas()
        expect(todos).toContainEqual({ source: '/groups', has: [{ type: 'query', key: 'type' }], destination: '/pt/groups/filtrado' })
        expect(todos).toContainEqual({ source: '/en/groups', has: [{ type: 'query', key: 'page' }], destination: '/en/groups/filtrado' })
        // Chaves do português não desviam o inglês: o catálogo traduzido só pagina.
        expect(todos).not.toContainEqual({ source: '/en/groups', has: [{ type: 'query', key: 'type' }], destination: '/en/groups/filtrado' })
    })
})
