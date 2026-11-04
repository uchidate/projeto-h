import { describe, expect, it } from 'vitest'
import { comparar, extrair, hreflangRecíproco, textoDoMain } from './retrato.mjs'
import { PARES, todasAsUrls } from './urls.mjs'

const HTML = `<!doctype html><html lang="pt-BR" data-dpl-id="abc"><head>
<title>Sobre | HallyuHub</title>
<meta name="description" content="Quem &amp; como"/><meta name="robots" content="index, follow"/>
<meta property="og:locale" content="pt_BR"/>
<link rel="canonical" href="https://www.hallyuhub.com.br/about"/>
<link rel="alternate" hrefLang="en" href="https://www.hallyuhub.com.br/en/about"/>
<link rel="alternate" hrefLang="pt-BR" href="https://www.hallyuhub.com.br/about"/>
</head><body><header>menu</header><main><h1>Sobre <b>nós</b></h1><h2>A</h2><p>Texto <a href="/x">link</a></p>
<script>var x=1</script><svg><title>ícone</title></svg></main></body></html>`

describe('extrair', () => {
    const r = extrair(HTML)
    it('lê os sinais de SEO sem a origem', () => {
        expect(r).toMatchObject({
            lang: 'pt-BR', title: 'Sobre | HallyuHub', description: 'Quem & como', robots: 'index, follow',
            canonical: '/about', ogLocale: 'pt_BR', h1: 'Sobre nós', h2: 1, links: 1,
        })
        expect(r.hreflang).toEqual({ 'pt-BR': '/about', en: '/en/about' })
    })
    it('o texto do main ignora script, svg e o cabeçalho fora do main', () => {
        expect(textoDoMain(HTML)).toBe('Sobre nós A Texto link')
    })
})

describe('comparar', () => {
    const base = { '/a': { status: 200, title: 'T', h1: 'H', canonical: '/a', hreflang: { en: '/en/a' }, texto: 'x', cache: 's-maxage=1' } }
    it('capturas iguais não têm erro nem aviso', () => {
        expect(comparar(base, structuredClone(base))).toEqual({ erros: [], avisos: [] })
    })
    it('mudança de canonical ou hreflang é erro; de texto e cache é aviso', () => {
        const d = structuredClone(base)
        d['/a'].canonical = '/b'; d['/a'].hreflang = { en: '/en/b' }; d['/a'].texto = 'y'; d['/a'].cache = 'no-store'
        const r = comparar(base, d)
        expect(r.erros).toHaveLength(2)
        expect(r.avisos).toHaveLength(2)
        expect(comparar(base, d, { semCache: true }).avisos).toHaveLength(1)
    })
    it('página ausente na segunda captura é erro', () => {
        expect(comparar(base, {}).erros).toEqual(['/a: ausente na segunda captura'])
    })
})

describe('hreflangRecíproco', () => {
    it('acusa quem aponta sem ser apontado de volta', () => {
        const p = {
            '/a': { status: 200, hreflang: { en: '/en/a' } },
            '/en/a': { status: 200, hreflang: {} },
        }
        expect(hreflangRecíproco(p)).toHaveLength(1)
        p['/en/a'].hreflang = { 'pt-BR': '/a' }
        expect(hreflangRecíproco(p)).toEqual([])
    })
})

describe('urls', () => {
    it('não repete URL e todo par tem os dois lados', () => {
        const urls = todasAsUrls()
        expect(new Set(urls).size).toBe(urls.length)
        for (const par of PARES) expect(par.en === '/en' || par.en.startsWith('/en/')).toBe(true)
    })
})
