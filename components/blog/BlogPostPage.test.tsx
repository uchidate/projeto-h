// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { WPPost } from '@/lib/wordpress/types'
import type { StoreProduct } from '@/lib/wordpress/store'

// Cobre o template de todo artigo: JSON-LD (tipo, autor, vídeos), ids e índice dos títulos, markdown solto,
// blocos "Conteúdo relacionado" (prévia ou link simples), mídia por orientação, embed do Spotify, lide,
// card de perfis citados, categorias e a vitrine de loja. Os filhos pesados viram stubs.
// eslint-disable-next-line @next/next/no-img-element -- stub de next/image: o teste só precisa do src
vi.mock('next/image', () => ({ default: (p: { src: string; alt?: string }) => <img src={p.src} alt={p.alt ?? ''} /> }))
vi.mock('@/components/i18n/LocalizedLink', () => ({ default: (p: { href: string; children?: ReactNode }) => <a href={p.href}>{p.children}</a> }))
vi.mock('@/components/ui/BrandDot', () => ({ BrandDot: () => null }))
vi.mock('@/components/ui/QuizWidget', () => ({ QuizWidget: () => null }))
vi.mock('@/components/blog/QuizEmbedLoader', () => ({ QuizEmbedLoader: () => null }))
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: (p: { data: unknown }) => <script data-jsonld="">{JSON.stringify(p.data)}</script> }))
vi.mock('@/components/ui/CompartilharBotao', () => ({ CompartilharBotao: () => null }))
vi.mock('@/components/ui/EntityActionBar', () => ({ EntityActionBar: () => null }))
vi.mock('@/components/ui/AdSlotInline', () => ({ AdSlotInline: () => null }))
vi.mock('@/components/blog/BlogReadingProgress', () => ({ BlogReadingProgress: () => null }))
vi.mock('@/components/blog/BlogToc', () => ({ BlogToc: (p: { headings: { id: string }[] }) => <nav data-toc={p.headings.map(h => h.id).join(',')} /> }))
vi.mock('@/components/blog/BlogEntityCard', () => ({ BlogEntityCard: (p: { titulo: string; itens: unknown[] }) => <aside data-entidades={p.itens.length}>{p.titulo}</aside> }))
vi.mock('@/components/blog/BlogPerfilPrincipal', () => ({ BlogPerfilPrincipal: () => <div data-perfil-principal="" /> }))
vi.mock('@/components/artists/lista/RegistrarVisita', () => ({ RegistrarVisita: () => null }))
vi.mock('@/components/features/ContentStateButton', () => ({ ContentStateButton: () => null }))
vi.mock('@/components/blog/BlogBackToTop', () => ({ BlogBackToTop: () => null }))
vi.mock('@/components/blog/BlogSuggestedNext', () => ({ BlogSuggestedNext: () => null }))
vi.mock('@/components/ui/ShopRelatedSection', () => ({ ShopRelatedSection: () => null }))
vi.mock('@/components/ui/LojaDeslizante', () => ({ LojaDeslizante: () => null }))
vi.mock('@/components/ui/LojaEmLinha', () => ({ LojaEmLinha: (p: { title: string }) => <section data-loja-meio="">{p.title}</section> }))
vi.mock('@/components/ui/StoreCard', () => ({ StoreCard: (p: { product: { id: number } }) => <div data-card={p.product.id} /> }))
vi.mock('@/components/blog/BlogContinuar', () => ({ BlogContinuar: () => null }))
vi.mock('@/components/blog/BlogTextShare', () => ({ BlogTextShare: () => null }))
vi.mock('@/components/blog/BlogMobileReadMore', () => ({ BlogMobileReadMore: (p: { children?: ReactNode }) => <>{p.children}</> }))
vi.mock('@/components/blog/BlogDaysUntil', () => ({ BlogDaysUntil: () => null }))
vi.mock('@/components/blog/GutenbergArticleRenderer', () => ({ GutenbergArticleRenderer: () => null }))
vi.mock('@/components/blog/ArticleSidebarAd', () => ({ ArticleSidebarAd: () => null }))

import { BlogPostPage } from './BlogPostPage'

const LONGO = 'Um parágrafo de abertura bem longo, com mais de oitenta caracteres, para virar o lide do artigo no template.'

type Extra = Record<string, unknown>
function post(content: string, extra: Extra = {}): WPPost {
    return {
        id: 5, slug: 'artigo', date: '2026-11-20T10:00:00', modified: '2026-11-20T10:00:00',
        title: { rendered: 'Título do artigo' }, excerpt: { rendered: '<p>Resumo curto.</p>' },
        content: { rendered: content }, acf: {}, _embedded: {}, related_entities: { groups: [], artists: [] },
        ...extra,
    } as unknown as WPPost
}
const termos = (...slugs: string[]) => ({ 'wp:term': [slugs.map((slug, i) => ({ id: i + 1, name: slug.toUpperCase(), slug, taxonomy: 'category' }))] })
const produto = (id: number) => ({ id, name: `p${id}` }) as unknown as StoreProduct

function pagina(p: WPPost, props: { shopProducts?: StoreProduct[]; origemLoja?: string | null } = {}) {
    return render(<BlogPostPage post={p} {...props} />).container
}
const jsonld = (c: HTMLElement) => Array.from(c.querySelectorAll('script[data-jsonld]')).map(s => s.textContent ?? '')

describe('BlogPostPage — JSON-LD', () => {
    it('post comum é BlogPosting; categoria de notícia vira NewsArticle', () => {
        expect(jsonld(pagina(post(`<p>${LONGO}</p>`)))[0]).toContain('BlogPosting')
        const noticia = post(`<p>${LONGO}</p>`, { _embedded: termos('noticias-k-pop') })
        expect(jsonld(pagina(noticia))[0]).toContain('NewsArticle')
    })

    it('datas no JSON-LD e nas tags <time> levam o fuso de São Paulo; a data visível não muda', () => {
        const c = pagina(post(`<p>${LONGO}</p>`, { date: '2026-11-26T23:17:15', modified: '2026-11-28T00:30:00' }))
        expect(jsonld(c)[0]).toContain('"datePublished":"2026-11-26T23:17:15-03:00"')
        expect(jsonld(c)[0]).toContain('"dateModified":"2026-11-28T00:30:00-03:00"')
        const tempos = Array.from(c.querySelectorAll('time'))
        expect(new Set(tempos.map(t => t.getAttribute('dateTime')))).toEqual(new Set(['2026-11-26T23:17:15-03:00', '2026-11-28T00:30:00-03:00']))
        expect(tempos[0].textContent).toMatch(/26 de novembro de 2026.*23:17/)
    })

    it('autor "Redação" vira organização; autor com nome vira pessoa', () => {
        const comAutor = (name: string) => post(`<p>${LONGO}</p>`, { _embedded: { author: [{ name }] } })
        expect(jsonld(pagina(comAutor('Redação HallyuHub')))[0]).toContain('Organization')
        expect(jsonld(pagina(comAutor('Ana Silva')))[0]).toContain('"Person"')
    })

    it('vídeos do YouTube no texto viram no máximo 3 esquemas de vídeo', () => {
        const ids = ['aaaaaaaaaaa', 'bbbbbbbbbbb', 'ccccccccccc', 'ddddddddddd']
        const html = ids.map(id => `<iframe src="https://www.youtube-nocookie.com/embed/${id}"></iframe>`).join('')
        const blocos = jsonld(pagina(post(`<p>${LONGO}</p>${html}`)))
        expect(blocos.filter(b => b.includes('VideoObject'))).toHaveLength(3)
    })
})

describe('BlogPostPage — títulos e índice', () => {
    it('H2/H3 ganham id; repetidos recebem sufixo, id existente é mantido e título vazio vira secao-N', () => {
        const html = `<p>${LONGO}</p><h2>Título Um</h2><h2>Título Um</h2><h3 id="meu-id">Outro</h3><h2></h2>`
        const c = pagina(post(html))
        expect(Array.from(c.querySelectorAll('h2, h3')).map(h => h.id)).toEqual(['titulo-um', 'titulo-um-2', 'meu-id', 'secao-4'])
        expect(c.querySelector('[data-toc]')?.getAttribute('data-toc')).toBe('titulo-um,titulo-um-2,meu-id,secao-4')
    })

    it('acentos saem do id', () => {
        const c = pagina(post(`<p>${LONGO}</p><h2>Cronologia: Estreia &amp; Ação</h2>`))
        expect(c.querySelector('h2')?.id).toBe('cronologia-estreia-acao')
    })
})

describe('BlogPostPage — conteúdo', () => {
    it('**negrito** e *itálico* soltos viram tags; asterisco de conta (2*3) fica como está', () => {
        const c = pagina(post(`<p>${LONGO} **forte** e *leve* e 2*3 apenas</p>`))
        expect(c.querySelector('strong')?.textContent).toBe('forte')
        expect(c.querySelector('em')?.textContent).toBe('leve')
        expect(c.textContent).toContain('2*3')
    })

    it('o primeiro parágrafo longo vira o lide; parágrafo curto não', () => {
        const c = pagina(post(`<p>Curto.</p><p>${LONGO}</p><p>${LONGO} segundo</p>`))
        expect(c.querySelectorAll('.oc-article-lead')).toHaveLength(1)
        expect(c.querySelector('.oc-article-lead')?.textContent).toContain('abertura bem longo')
    })

    it('parágrafos vazios do Gutenberg são removidos', () => {
        const c = pagina(post(`<p>${LONGO}</p><p>&nbsp;</p><p> </p><p>Fim.</p>`))
        expect(Array.from(c.querySelectorAll('p')).filter(p => p.textContent?.trim() === '' || p.textContent === ' ')).toHaveLength(0)
    })

    it('figura e imagem solta ganham classe de orientação', () => {
        const html = `<p>${LONGO}</p><figure class="wp-block-image"><img width="800" height="400" src="a.jpg"></figure><p><img width="300" height="600" src="b.jpg"></p><figure><img src="c.jpg"></figure>`
        const c = pagina(post(html))
        const fig = c.querySelectorAll('figure')
        expect(fig[0].className).toContain('oc-article-media--landscape')
        expect(fig[0].className).toContain('wp-block-image')
        expect(c.querySelector('p.oc-article-media--portrait')).not.toBeNull()
        expect(fig[1].className).toContain('oc-article-media')
        expect(fig[1].className).not.toContain('--')
    })

    it('link solto do Spotify vira embed', () => {
        const html = `<p>${LONGO}</p><p><a href="https://open.spotify.com/album/ABC123?si=x">Ouvir</a></p>`
        const iframe = pagina(post(html)).querySelector('.oc-spotify-embed iframe')
        expect(iframe?.getAttribute('src')).toBe('https://open.spotify.com/embed/album/ABC123?si=x?utm_source=generator&theme=0')
    })
})

describe('BlogPostPage — conteúdo relacionado', () => {
    const iu = { id: 1, name: 'IU', slug: 'iu', image: 'iu.jpg', roles: [], aliases: ['Lee Ji-eun'], gender: 'female' }
    const relacionado = (links: string) => `<p>${LONGO}</p><p><strong>Conteúdo relacionado:</strong> ${links}</p><p>${LONGO} depois</p>`

    it('link para ficha conhecida vira prévia com imagem e chamada', () => {
        const c = pagina(post(relacionado('<a href="/artists/iu">IU</a>'), { related_entities: { groups: [], artists: [iu] } }))
        const previa = c.querySelector('.oc-related-content--preview')
        expect(previa?.textContent).toContain('IU')
        expect(previa?.textContent).toContain('Ver perfil')
        expect(previa?.querySelector('img')?.getAttribute('src')).toBe('iu.jpg')
    })

    it('o apelido do artista também casa com a ficha', () => {
        const c = pagina(post(relacionado('<a href="/artists/Lee%20Ji-eun">IU</a>'), { related_entities: { groups: [], artists: [iu] } }))
        expect(c.querySelector('.oc-related-content--preview')).not.toBeNull()
    })

    it('link desconhecido vira "Explore também"', () => {
        const c = pagina(post(relacionado('<a href="/blog/outro">Outro artigo</a>')))
        expect(c.querySelector('.oc-related-content--preview')).toBeNull()
        expect(c.querySelector('p.oc-related-content')?.textContent).toContain('Explore também')
    })

    it('vários links formam um grupo', () => {
        const c = pagina(post(relacionado('<a href="/blog/a">A</a> <a href="/blog/b">B</a>')))
        expect(c.querySelector('.oc-related-content-group')?.querySelectorAll('.oc-related-content')).toHaveLength(2)
    })

    it('bloco que abre o texto desce para depois do primeiro parágrafo', () => {
        const html = `<p><strong>Conteúdo relacionado:</strong> <a href="/blog/a">A</a></p><p>${LONGO}</p><p>Segundo.</p>`
        const c = pagina(post(html))
        const filhos = Array.from(c.querySelectorAll('.oc-article-lead, p.oc-related-content'))
        expect(filhos[0].className).toContain('oc-article-lead')
        expect(filhos[1].className).toContain('oc-related-content')
    })
})

describe('BlogPostPage — perfis, categorias e loja', () => {
    const grupo = { id: 1, name: 'aespa', slug: 'aespa', image: 'a.jpg', color: '#112233' }

    it('card de perfis citados só com entidade que tem foto; só produções muda o título', () => {
        expect(pagina(post(`<p>${LONGO}</p>`)).querySelector('[data-entidades]')).toBeNull()
        const comGrupo = pagina(post(`<p>${LONGO}</p>`, { related_entities: { groups: [grupo], artists: [{ id: 2, name: 'X', slug: 'x', image: null }] } }))
        expect(comGrupo.querySelector('[data-entidades]')?.textContent).toBe('Perfis citados no texto')
        expect(comGrupo.querySelector('[data-entidades]')?.getAttribute('data-entidades')).toBe('1')
        const soProducao = pagina(post(`<p>${LONGO}</p>`, { related_entities: { groups: [], artists: [], productions: [{ id: 3, title: 'Série', slug: 'serie', image: 's.jpg' }] } }))
        expect(soProducao.querySelector('[data-entidades]')?.textContent).toBe('Produções citadas no texto')
    })

    it('perfil principal só quando o texto cita até 2 entidades', () => {
        const poucas = pagina(post(`<p>${LONGO}</p>`, { related_entities: { groups: [grupo], artists: [] } }))
        expect(poucas.querySelector('[data-perfil-principal]')).not.toBeNull()
        const muitas = pagina(post(`<p>${LONGO}</p>`, { related_entities: { groups: [grupo, { ...grupo, id: 9, slug: 'ive' }], artists: [{ id: 2, name: 'X', slug: 'x', image: 'x.jpg' }] } }))
        expect(muitas.querySelector('[data-perfil-principal]')).toBeNull()
    })

    it('a lista de categorias só aparece com mais de uma, com links para o blog', () => {
        const uma = pagina(post(`<p>${LONGO}</p>`, { _embedded: termos('k-pop') }))
        expect(uma.textContent).not.toContain('Categorias')
        const duas = pagina(post(`<p>${LONGO}</p>`, { _embedded: termos('k-pop', 'k-drama') }))
        expect(duas.textContent).toContain('Categorias')
        expect(Array.from(duas.querySelectorAll('a')).map(a => a.getAttribute('href'))).toContain('/blog?category=k-drama')
    })

    it('vitrine: 3 produtos com aviso de afiliado; sem produto não aparece', () => {
        const c = pagina(post(`<p>${LONGO}</p>`), { shopProducts: [1, 2, 3, 4, 5].map(produto) })
        expect(c.querySelectorAll('[data-card]')).toHaveLength(3)
        expect(c.textContent).toContain('Publicidade afiliada')
        const vazio = pagina(post(`<p>${LONGO}</p>`))
        expect(vazio.querySelectorAll('[data-card]')).toHaveLength(0)
        expect(vazio.textContent).not.toContain('Publicidade afiliada')
    })
})
