import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ROTAS_MIGRADAS, rewritesDasRotasMigradas } from './rotas-migradas.mjs'
import { href } from './routes'

// `href` tipa os params por rota; aqui a rota vem de uma lista, então usamos uma assinatura solta.
const hrefSolto = href as unknown as (rota: string, params: Record<string, string> | undefined, locale: 'pt' | 'en') => string

const RAIZ = process.cwd()
// `:slug` (rewrite do Next) e `[slug]` (pasta do App Router) descrevem o mesmo segmento.
const comoPasta = (caminho: string) => caminho.replace(/:(\w+)/g, '[$1]')
const comoRewrite = (caminho: string) => caminho.replace(/\[(\w+)\]/g, ':$1')
const pagina = (grupo: string, caminho: string) => join(RAIZ, 'app', grupo, comoPasta(caminho), 'page.tsx')

describe('rotas migradas para a árvore única', () => {
    it('toda página de (intl) que serve o português está registrada (senão /<rota> dá 404, sem rewrite para /pt/...)', () => {
        const base = join(RAIZ, 'app', '(intl)', '[locale]')
        const servemPt: string[] = []
        const varrer = (dir: string, prefixo: string) => {
            for (const d of readdirSync(dir, { withFileTypes: true })) {
                if (!d.isDirectory() || d.name === '[locale]' || d.name === 'filtrado') continue
                const arquivo = join(dir, d.name, 'page.tsx')
                const caminho = `${prefixo}${comoRewrite(d.name)}`
                if (existsSync(arquivo) && readFileSync(arquivo, 'utf8').includes('servePt: true')) servemPt.push(caminho)
                varrer(join(dir, d.name), `${caminho}/`)
            }
        }
        varrer(base, '')
        const registradas = ROTAS_MIGRADAS.map((r) => r.interno.slice(1))
        expect(servemPt.filter((n) => !registradas.includes(n))).toEqual([])
    })

    it('fichas pré-geradas devolvem { locale, ... } completo (senão o Next desiste de pré-gerar todos os slugs)', () => {
        const base = join(RAIZ, 'app', '(intl)', '[locale]')
        const ruins: string[] = []
        const varrer = (dir: string) => {
            for (const d of readdirSync(dir, { withFileTypes: true })) {
                if (!d.isDirectory()) continue
                const arquivo = join(dir, d.name, 'page.tsx')
                if (d.name.startsWith('[') && d.name !== '[locale]' && existsSync(arquivo)) {
                    const texto = readFileSync(arquivo, 'utf8')
                    if (texto.includes('servePt: true') && /generateStaticParams/.test(texto) && !texto.includes('locale: DEFAULT_LOCALE')) ruins.push(arquivo.replace(RAIZ, ''))
                }
                varrer(join(dir, d.name))
            }
        }
        varrer(base)
        expect(ruins).toEqual([])
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
        const rotas = ['about', 'contact', 'ethics', 'editorialStandards', 'corrections', 'groups', 'artists', 'productions', 'blog', 'foods', 'guides', 'positions', 'trending', 'agencies', 'companies', 'fandoms', 'calendar', 'quiz', 'search', 'birthdays', 'artist', 'production', 'fandom', 'position', 'group', 'agency', 'company', 'food', 'guide', 'post', 'quizCategory'] as const
        // Rotas com parâmetro: `/artists/:slug` vira `/artists/X` dos dois lados antes de comparar.
        // O nome do parâmetro pode diferir entre ROUTES e o registro (quiz: categoria/category); passamos os dois.
        const params = Object.fromEntries([...pt.matchAll(/:(\w+)/g), ...interno.matchAll(/:(\w+)/g), ...['categoria', 'category'].map((n) => [0, n])].map((m) => [m[1], 'X']))
        const esperado = pt.replace(/:(\w+)/g, 'X')
        const achada = rotas.find((r) => {
            try { return hrefSolto(r, params, 'pt') === esperado } catch { return false }
        })
        expect(achada, `${pt} não está em ROUTES`).toBeDefined()
        expect(hrefSolto(achada!, params, 'en')).toBe(`/en${interno}`.replace(/:(\w+)/g, 'X'))
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

    it('rotas fixas vêm antes das com parâmetro (/artists/birthdays antes de /artists/:slug)', () => {
        const simples = rewritesDasRotasMigradas().filter((r) => !('has' in r)).map((r) => r.source)
        expect(simples.indexOf('/artists/birthdays')).toBeGreaterThanOrEqual(0)
        expect(simples.indexOf('/artists/birthdays')).toBeLessThan(simples.indexOf('/artists/:slug'))
        const primeiraDinamica = simples.findIndex((x) => x.includes(':'))
        expect(simples.slice(primeiraDinamica).every((x) => x.includes(':'))).toBe(true)
    })

    it('/groups desvia por query nos dois idiomas, para o filtrado do idioma certo', () => {
        const todos = rewritesDasRotasMigradas()
        expect(todos).toContainEqual({ source: '/groups', has: [{ type: 'query', key: 'type' }], destination: '/pt/groups/filtrado' })
        expect(todos).toContainEqual({ source: '/en/groups', has: [{ type: 'query', key: 'page' }], destination: '/en/groups/filtrado' })
        // Chaves do português não desviam o inglês: o catálogo traduzido só pagina.
        expect(todos).not.toContainEqual({ source: '/en/groups', has: [{ type: 'query', key: 'type' }], destination: '/en/groups/filtrado' })
    })
})
