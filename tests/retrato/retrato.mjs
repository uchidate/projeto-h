#!/usr/bin/env node
/**
 * Retrato de i18n: captura os sinais de SEO e de estrutura de cada URL e compara duas capturas.
 *
 * Existe para a migração para `app/[locale]` (ver o plano de i18n): cada etapa tem de dar diferença
 * ZERO entre o antes (produção, ou a `main`) e o depois (o código novo). Não há baseline commitado de
 * propósito: conteúdo muda todo dia, então compara-se duas capturas feitas na mesma hora.
 *
 *   node tests/retrato/retrato.mjs capturar https://www.hallyuhub.com.br --saida /tmp/antes.json
 *   node tests/retrato/retrato.mjs capturar http://localhost:3101        --saida /tmp/depois.json --concorrencia 1
 *   node tests/retrato/retrato.mjs comparar /tmp/antes.json /tmp/depois.json [--sem-cache]
 *
 * Em `next dev` use `--concorrencia 1`: compilações paralelas corrompem o cache e geram 500 falsos.
 * Sem dependências além do Node (fetch nativo). Sai com código 1 se houver ERRO na comparação; AVISO
 * (texto da página, contagem de links, cache) não reprova, porque muda com o conteúdo e com o modo do servidor.
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { todasAsUrls } from './urls.mjs'

const args = process.argv.slice(2)
const opt = (nome, padrao) => (args.includes(nome) ? args[args.indexOf(nome) + 1] : padrao)
const comando = args[0]

// ---------------------------------------------------------------- extração (pura, testável)

const ENTIDADES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' }
const decodificar = (s) => s.replace(/&(?:amp|lt|gt|quot|nbsp|#39);/g, (m) => ENTIDADES[m])

function atributos(tag) {
    const out = {}
    for (const m of tag.matchAll(/([a-zA-Z:-]+)=(?:"([^"]*)"|'([^']*)')/g)) out[m[1].toLowerCase()] = decodificar(m[2] ?? m[3])
    return out
}

const semOrigem = (url) => {
    if (!url) return url
    try { const u = new URL(url, 'https://origem.invalida'); return u.pathname + u.search } catch { return url }
}

/** Texto visível do `<main>`: sem scripts, estilos, SVG e marcação, com espaços colapsados. */
export function textoDoMain(html) {
    const ini = html.search(/<main[\s>]/)
    const fim = html.lastIndexOf('</main>')
    const trecho = ini >= 0 ? html.slice(ini, fim > ini ? fim : undefined) : html
    return decodificar(
        trecho.replace(/<(script|style|svg|noscript)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' '),
    ).replace(/\s+/g, ' ').trim()
}

export function extrair(html) {
    const metas = [...html.matchAll(/<meta\s[^>]*>/gi)].map((m) => atributos(m[0]))
    const meta = (chave, valor) => metas.find((a) => a[chave] === valor)?.content ?? null
    const links = [...html.matchAll(/<link\s[^>]*>/gi)].map((m) => atributos(m[0]))
    const hreflang = Object.fromEntries(
        links.filter((l) => l.rel === 'alternate' && l.hreflang).map((l) => [l.hreflang, semOrigem(l.href)]).sort(),
    )
    const canonical = semOrigem(links.find((l) => l.rel === 'canonical')?.href ?? null)
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    const main = textoDoMain(html)
    return {
        lang: html.match(/<html[^>]*\blang="([^"]*)"/i)?.[1] ?? null,
        title: decodificar(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '').trim() || null,
        description: meta('name', 'description'),
        robots: meta('name', 'robots'),
        googlebot: meta('name', 'googlebot'),
        canonical,
        hreflang,
        ogLocale: meta('property', 'og:locale'),
        ogUrl: semOrigem(meta('property', 'og:url')),
        ogTitle: meta('property', 'og:title'),
        ogDescription: meta('property', 'og:description'),
        ogImage: semOrigem(meta('property', 'og:image')),
        twitterCard: meta('name', 'twitter:card'),
        h1: h1 ? decodificar(h1.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() : null,
        h2: (html.match(/<h2[\s>]/gi) ?? []).length,
        links: (html.match(/<a\s/gi) ?? []).length,
        texto: createHash('sha1').update(main).digest('hex').slice(0, 12),
        textoTamanho: main.length,
    }
}

// ---------------------------------------------------------------- captura

async function capturarUrl(origem, caminho, timeoutMs) {
    const t0 = Date.now()
    try {
        const r = await fetch(origem + caminho, {
            redirect: 'manual',
            headers: { 'user-agent': 'hh-retrato/1', 'accept-language': 'pt-BR,pt;q=0.9' },
            signal: AbortSignal.timeout(timeoutMs),
        })
        const base = {
            status: r.status,
            location: semOrigem(r.headers.get('location')),
            cache: r.headers.get('cache-control'),
            ms: Date.now() - t0,
        }
        const tipo = r.headers.get('content-type') ?? ''
        return r.status === 200 && tipo.includes('text/html') ? { ...base, ...extrair(await r.text()) } : base
    } catch (e) {
        return { status: 0, erro: String(e?.message ?? e).slice(0, 80) }
    }
}

async function capturar(origem, saida, timeoutMs, concorrencia) {
    const urls = todasAsUrls()
    const resultado = {}
    const fila = [...urls]
    await Promise.all(Array.from({ length: concorrencia }, async () => {
        for (let u = fila.shift(); u !== undefined; u = fila.shift()) {
            resultado[u] = await capturarUrl(origem, u, timeoutMs)
            process.stderr.write(`${resultado[u].status} ${u}\n`)
        }
    }))
    const ordenado = Object.fromEntries(Object.entries(resultado).sort(([a], [b]) => a.localeCompare(b)))
    writeFileSync(saida, JSON.stringify({ origem, capturadoEm: new Date().toISOString(), paginas: ordenado }, null, 2))
    const falhas = Object.values(ordenado).filter((p) => p.status === 0).length
    console.log(`${urls.length} URLs capturadas de ${origem} -> ${saida}${falhas ? ` (${falhas} sem resposta)` : ''}`)
}

// ---------------------------------------------------------------- comparação

const CAMPOS_ERRO = ['status', 'location', 'lang', 'title', 'description', 'robots', 'googlebot', 'canonical', 'ogLocale', 'ogUrl', 'ogTitle', 'ogDescription', 'ogImage', 'twitterCard', 'h1']
const CAMPOS_AVISO = ['h2', 'links', 'texto', 'cache']

export function comparar(antes, depois, { semCache = false } = {}) {
    const erros = []
    const avisos = []
    for (const caminho of Object.keys(antes)) {
        const a = antes[caminho]
        const d = depois[caminho]
        if (!d) { erros.push(`${caminho}: ausente na segunda captura`); continue }
        for (const campo of CAMPOS_ERRO) {
            if (JSON.stringify(a[campo] ?? null) !== JSON.stringify(d[campo] ?? null)) {
                erros.push(`${caminho}: ${campo}\n      antes:  ${JSON.stringify(a[campo] ?? null)}\n      depois: ${JSON.stringify(d[campo] ?? null)}`)
            }
        }
        if (JSON.stringify(a.hreflang ?? {}) !== JSON.stringify(d.hreflang ?? {})) {
            erros.push(`${caminho}: hreflang\n      antes:  ${JSON.stringify(a.hreflang ?? {})}\n      depois: ${JSON.stringify(d.hreflang ?? {})}`)
        }
        for (const campo of CAMPOS_AVISO) {
            if (campo === 'cache' && semCache) continue
            if (JSON.stringify(a[campo] ?? null) !== JSON.stringify(d[campo] ?? null)) {
                avisos.push(`${caminho}: ${campo} (${JSON.stringify(a[campo] ?? null)} -> ${JSON.stringify(d[campo] ?? null)})`)
            }
        }
    }
    return { erros, avisos }
}

/** Reciprocidade: se A declara hreflang para B, B tem de declarar A. Vale por captura, não entre capturas. */
export function hreflangRecíproco(paginas) {
    const problemas = []
    for (const [caminho, p] of Object.entries(paginas)) {
        for (const [idioma, alvo] of Object.entries(p.hreflang ?? {})) {
            if (idioma === 'x-default' || alvo === caminho) continue
            const outra = paginas[alvo]
            if (!outra || outra.status !== 200) continue // fora da amostra
            if (!Object.values(outra.hreflang ?? {}).includes(caminho)) problemas.push(`${caminho} aponta para ${alvo} (${idioma}), que não aponta de volta`)
        }
    }
    return problemas
}

function lerCaptura(arquivo) { return JSON.parse(readFileSync(arquivo, 'utf8')).paginas }

if (process.argv[1]?.endsWith('retrato.mjs')) {
    if (comando === 'capturar') {
        const origem = args[1]?.replace(/\/$/, '')
        if (!origem) { console.error('uso: retrato.mjs capturar <origem> --saida arquivo.json [--timeout 60] [--concorrencia 6]'); process.exit(2) }
        await capturar(origem, opt('--saida', 'retrato.json'), Number(opt('--timeout', 60)) * 1000, Number(opt('--concorrencia', 6)))
    } else if (comando === 'comparar') {
        const [a, d] = [args[1], args[2]]
        if (!a || !d) { console.error('uso: retrato.mjs comparar antes.json depois.json [--sem-cache]'); process.exit(2) }
        const antes = lerCaptura(a)
        const depois = lerCaptura(d)
        const { erros, avisos } = comparar(antes, depois, { semCache: args.includes('--sem-cache') })
        const reciprocidade = hreflangRecíproco(depois)
        for (const e of [...erros, ...reciprocidade.map((r) => `hreflang: ${r}`)]) console.log(`ERRO   ${e}`)
        for (const w of avisos) console.log(`AVISO  ${w}`)
        console.log(`\n${Object.keys(antes).length} URLs | ${erros.length + reciprocidade.length} erro(s) | ${avisos.length} aviso(s)`)
        process.exit(erros.length + reciprocidade.length ? 1 : 0)
    } else {
        console.error('uso: retrato.mjs capturar <origem> --saida f.json | comparar antes.json depois.json')
        process.exit(2)
    }
}
