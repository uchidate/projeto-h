import { describe, expect, it } from 'vitest'
import type { WPPost } from '@/lib/wordpress/types'
import { buildRelatedPreviewMap, enhanceArticleHtml } from './htmlDoArtigo'

const entidades = (related_entities: unknown) => ({ related_entities }) as unknown as WPPost
const html = (fonte: string) => enhanceArticleHtml(fonte).html
const longo = 'Um parágrafo de abertura com mais de oitenta caracteres para virar o destaque do texto publicado.'

describe('buildRelatedPreviewMap', () => {
    it('post sem entidades devolve mapa vazio', () => {
        expect(buildRelatedPreviewMap(entidades(undefined))).toEqual({})
    })

    it('artista responde pelo slug e pelos apelidos, apontando para o slug oficial', () => {
        const mapa = buildRelatedPreviewMap(entidades({
            artists: [{ slug: 'IU', name: 'IU', image: null, aliases: ['lee-ji-eun'], roles: [] }],
        }))
        expect(Object.keys(mapa)).toEqual(['artists/iu', 'artists/lee-ji-eun'])
        expect(mapa['artists/lee-ji-eun']).toMatchObject({ href: '/artists/IU', description: 'Perfil', cta: 'Ver perfil' })
    })

    it('produção, grupo, comida e empresa ganham a própria chave', () => {
        const mapa = buildRelatedPreviewMap(entidades({
            productions: [{ slug: 'p', title: 'P', image: null }],
            groups: [{ slug: 'g', name: 'G', image: null }],
            foods: [{ slug: 'c', title: 'C', image: null, category: 'inexistente', spicy_level: 5 }],
            companies: [{ slug: 'e', title: 'E', image: null, is_chaebol: true }],
        }))
        expect(Object.keys(mapa)).toEqual(['productions/p', 'groups/g', 'comidas/c', 'empresas/e'])
        expect(mapa['comidas/c'].description).toBe('🍽️ inexistente · 🌶🌶🌶')
        expect(mapa['empresas/e']).toMatchObject({ label: 'Chaebol', description: '🏢 Empresa coreana' })
    })
})

describe('enhanceArticleHtml: texto', () => {
    it('converte negrito e itálico só no texto, não nos atributos', () => {
        expect(html('<p title="**a**">**forte** e *leve*</p>')).toBe('<p title="**a**"><strong>forte</strong> e <em>leve</em></p>')
    })

    it('remove parágrafo vazio', () => {
        expect(html('<p> </p><p>&nbsp;</p><h2>A</h2>')).toBe('<h2 id="a">A</h2>')
    })

    it('marca como destaque apenas o primeiro parágrafo longo', () => {
        const saida = html(`<p>Curto.</p><p class="x">${longo}</p><p>${longo}</p>`)
        expect(saida).toBe(`<p>Curto.</p><p class="x oc-article-lead">${longo}</p><p>${longo}</p>`)
    })
})

describe('enhanceArticleHtml: intertítulos', () => {
    it('gera id sem acento, numera repetidos e respeita id existente', () => {
        const r = enhanceArticleHtml('<h2>Estréia</h2><h3>Estréia</h3><h2 id="fim">Fim</h2><h2>…</h2>')
        expect(r.headings.map(h => [h.id, h.level])).toEqual([['estreia', 2], ['estreia-2', 3], ['fim', 2], ['secao-4', 2]])
        expect(r.html).toContain('<h2 id="fim">Fim</h2>')
    })
})

describe('enhanceArticleHtml: imagens', () => {
    it.each([
        ['600', '900', 'portrait'],
        ['900', '600', 'landscape'],
        ['800', '800', 'square'],
    ])('figura %sx%s recebe a classe %s', (w, h, forma) => {
        expect(html(`<figure><img width="${w}" height="${h}"></figure>`))
            .toContain(`<figure class="oc-article-media oc-article-media--${forma}">`)
    })

    it('sem dimensões só marca como mídia; vale para imagem solta em parágrafo', () => {
        expect(html('<p><img src="a.jpg"></p>')).toBe('<p class="oc-article-media"><img src="a.jpg"></p>')
    })
})

describe('enhanceArticleHtml: conteúdo relacionado', () => {
    const bloco = '<p><strong>Conteúdo relacionado:</strong> <a href="/groups/g">G</a> <a href="/blog/x">X</a></p>'

    it('vira cartão quando há prévia e link simples quando não há, depois do primeiro parágrafo', () => {
        const previas = buildRelatedPreviewMap(entidades({ groups: [{ slug: 'g', name: 'G <b>', image: 'i.jpg' }] }))
        const saida = enhanceArticleHtml(`${bloco}<p>Primeiro.</p><p>Segundo.</p>`, previas).html
        expect(saida.startsWith('<p>Primeiro.</p>')).toBe(true)
        expect(saida.indexOf('oc-related-content-group')).toBeLessThan(saida.indexOf('Segundo.'))
        expect(saida).toContain('<strong>G &lt;b&gt;</strong>')
        expect(saida).toContain('<span>Explore também</span><a href="/blog/x">X</a>')
    })

    it('sem link o parágrafo fica como está', () => {
        const fonte = '<p><strong>Perfil relacionado:</strong> nenhum</p>'
        expect(html(fonte)).toBe(fonte)
    })
})

describe('enhanceArticleHtml: Spotify', () => {
    const paragrafo = (url: string) => `<p><a href="${url}">ouvir</a></p>`

    it('link sozinho vira player', () => {
        expect(html(paragrafo('https://open.spotify.com/album/abc123')))
            .toContain('src="https://open.spotify.com/embed/album/abc123?utm_source=generator&theme=0"')
    })

    it('link copiado do app (com ?si=) não gera endereço com duas interrogações', () => {
        expect(html(paragrafo('https://open.spotify.com/track/abc123?si=XyZ')))
            .toContain('src="https://open.spotify.com/embed/track/abc123?utm_source=generator&theme=0"')
    })

    it('link no meio de uma frase continua link', () => {
        const fonte = '<p>Ouça <a href="https://open.spotify.com/track/abc123">aqui</a>.</p>'
        expect(html(fonte)).toBe(fonte)
    })
})
