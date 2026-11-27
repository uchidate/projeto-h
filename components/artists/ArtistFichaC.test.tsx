// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'

// Traduções devolvem a chave (com o count/valores ao lado) para o teste conferir qual texto entrou.
vi.mock('next-intl', () => ({
    useLocale: () => 'pt-BR',
    useTranslations: () => (key: string, vals?: Record<string, unknown>) => (vals ? `${key}|${JSON.stringify(vals)}` : key),
}))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element -- stub de next/image: o teste só precisa do src
    default: (p: { src: string; alt?: string }) => <img src={p.src} alt={p.alt ?? ''} />,
}))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: (p: { href: string; children?: ReactNode }) => <a href={p.href}>{p.children}</a>,
}))
vi.mock('@/lib/config/ads', () => ({ ADSENSE: { slots: { leaderboard: 'LB', inline: 'IN' } } }))
vi.mock('@/components/ui/AdSlotInline', () => ({
    AdSlotInline: (p: { analyticsPlacement: string }) => <div data-ad={p.analyticsPlacement} />,
}))
vi.mock('@/components/features/ContentStateButton', () => ({ ContentStateButton: () => <button data-follow /> }))
vi.mock('@/components/profiles/CollapsibleProse', () => ({
    CollapsibleProse: (p: { children?: ReactNode }) => <div data-collapsible>{p.children}</div>,
}))
vi.mock('@/lib/profiles/highlightProse', () => ({ highlightProse: (html: string) => html }))
vi.mock('@/components/artists/MapaConexoes', () => ({
    MapaConexoes: (p: { nos: { tipo: string; label: string }[] }) => <div data-mapa={p.nos.map(n => `${n.tipo}:${n.label}`).join('|')} />,
}))
vi.mock('@/components/groups/GroupMVPlayer', () => ({ GroupMVPlayer: () => <div data-mv /> }))
vi.mock('@/components/groups/GroupDiscography', () => ({ GroupDiscography: () => <div data-disco /> }))
vi.mock('@/components/groups/GroupSpotifyEmbed', () => ({ GroupSpotifyEmbed: () => <div data-spotify /> }))
vi.mock('@/components/artists/ArtistCarreira', () => ({ ArtistCarreira: () => <div data-carreira-completa /> }))
vi.mock('@/components/artists/PremiosSelos', () => ({
    PremiosSelos: (p: { awards: unknown[]; preencher?: ReactNode }) => <div data-premios={p.awards.length}>{p.preencher}</div>,
}))
vi.mock('@/components/artists/MarcosFaixa', async importOriginal => {
    const real = await importOriginal<typeof import('@/components/artists/MarcosFaixa')>()
    return {
        ...real,
        MarcosFaixa: (p: { marcos: { tipo: string; ano: number }[] }) => <div data-marcos={p.marcos.map(m => `${m.tipo}${m.ano}`).join(',')} />,
    }
})
vi.mock('@/components/artists/ArtistAtalhos', () => ({
    ArtistAtalhos: (p: { destinos: { id: string; tipo: string; detalhe?: string }[] }) => (
        <div data-atalhos={p.destinos.map(d => `${d.id}:${d.tipo}:${d.detalhe ?? ''}`).join(' ; ')} />
    ),
}))

import { ArtistFichaC } from './ArtistFichaC'

afterEach(cleanup)

type Props = Parameters<typeof ArtistFichaC>[0]

const poster = (src: string) => ({ featured_image_url: src })
const prod = (id: number, slug: string, titulo: string, ano: number, rating: number, img = true) => ({
    id, slug, title: { rendered: titulo }, date: `${ano}-01-01`,
    acf: { year: ano, rating }, ...(img ? poster(`/p/${slug}.jpg`) : {}),
})
const artista = (id: number, slug: string, nome: string) => ({ id, slug, title: { rendered: nome }, featured_image_url: `/a/${slug}.jpg` })

function props(over: Record<string, unknown> = {}, modelOver: Record<string, unknown> = {}) {
    const base = {
        artist: { id: 1, slug: 'jisoo', title: { rendered: 'Jisoo' }, acf: { roles: ['singer'] } },
        name: 'Jisoo',
        image: { src: '/jisoo.jpg', alt: 'Jisoo' },
        roleLabels: ['Cantora'],
        groups: [],
        productions: [],
        relatedPosts: [],
        relatedArtists: [],
        discography: [],
        model: {
            storyChapters: [], awards: [], keyMetrics: [], careerStatement: '', contentBefore: '<p>Bio curta</p>',
            contentAfter: '', videoList: [], age: null, ...modelOver,
        },
        magra: false,
        nodes: {},
        resto: [],
        titulos: { dossier: 'Dossiê', story: 'História', awards: 'Prêmios' },
        ...over,
    }
    return base as unknown as Props
}

const cap = (period: string, title: string) => ({ period, title, description: `texto ${title}` })

describe('ArtistFichaC · topo', () => {
    it('mostra o nome, o papel com o grupo e a frase de carreira', () => {
        const { container } = render(<ArtistFichaC {...props(
            { groups: [{ id: 9, slug: 'blackpink', title: { rendered: 'BLACKPINK' } }] },
            { careerStatement: 'Voz do BLACKPINK' },
        )} />)
        expect(container.querySelector('h1')?.textContent).toBe('Jisoo.')
        expect(container.textContent).toContain('Cantora · BLACKPINK')
        expect(container.textContent).toContain('Voz do BLACKPINK')
    })

    it('sem foto mostra o aviso e não renderiza imagem do herói', () => {
        const { container } = render(<ArtistFichaC {...props({ image: null })} />)
        expect(container.querySelector('img')).toBeNull()
        expect(container.textContent).toContain('noPhoto')
    })

    it('idade, lugar, estreia e grupo entram na linha de fatos do topo', () => {
        const { container } = render(<ArtistFichaC {...props(
            {
                artist: { id: 1, slug: 'jisoo', title: { rendered: 'Jisoo' }, acf: { debut_date: '2016-08-08', birth_place: 'Gunpo, South Korea' } },
                groups: [{ id: 9, slug: 'blackpink', title: { rendered: 'BLACKPINK' } }],
            },
            { age: 31 },
        )} />)
        const texto = container.querySelector('header')!.textContent!
        expect(texto).toContain('ageYears|{"count":31}')
        expect(texto).toContain('Gunpo')
        expect(texto).toContain('2016')
        expect(texto).toContain('BLACKPINK')
    })

    it('ficha rápida: "Cidade" só aparece quando o lugar tem cidade, não só o país', () => {
        const comCidade = render(<ArtistFichaC {...props({ artist: { id: 1, slug: 'a', title: { rendered: 'A' }, acf: { birth_place: 'Gunpo, South Korea' } } })} />)
        expect(comCidade.container.querySelector('dl')?.textContent).toContain('city')
        cleanup()
        const soPais = render(<ArtistFichaC {...props({ artist: { id: 1, slug: 'a', title: { rendered: 'A' }, acf: { birth_place: 'South Korea' } } })} />)
        expect(soPais.container.querySelector('dl')).toBeNull()
    })

    it('agência e grupo entram na ficha rápida', () => {
        const { container } = render(<ArtistFichaC {...props({
            agency: { id: 5, slug: 'yg', title: { rendered: 'YG Entertainment' } },
            groups: [{ id: 9, slug: 'blackpink', title: { rendered: 'BLACKPINK' } }],
        })} />)
        const dl = container.querySelector('dl')!.textContent!
        expect(dl).toContain('YG Entertainment')
        expect(dl).toContain('BLACKPINK')
    })
})

describe('ArtistFichaC · botões e abas', () => {
    it('cantor: "ouvir" é o botão principal e as abas seguem o conteúdo', () => {
        const { container } = render(<ArtistFichaC {...props({
            discography: [{ title: 'Me' }],
            productions: [prod(1, 'obra-a', 'Obra A', 2022, 8)],
            relatedPosts: [{ id: 3, slug: 'post', title: { rendered: 'Post' } }],
        })} />)
        const botoes = [...container.querySelectorAll('header a')].map(a => a.getAttribute('href'))
        expect(botoes.indexOf('#musica')).toBeLessThan(botoes.indexOf('#obras'))
        const abas = [...container.querySelectorAll('nav a')].map(a => a.getAttribute('href'))
        expect(abas).toEqual(['#visao', '#musica', '#obras', '#ler'])
    })

    it('ator: "ver obras" vem antes de "ouvir"', () => {
        const { container } = render(<ArtistFichaC {...props({
            artist: { id: 1, slug: 'a', title: { rendered: 'A' }, acf: { roles: ['actor'] } },
            discography: [{ title: 'Trilha' }],
            productions: [prod(1, 'obra-a', 'Obra A', 2022, 8)],
        })} />)
        const botoes = [...container.querySelectorAll('header a')].map(a => a.getAttribute('href'))
        expect(botoes.indexOf('#obras')).toBeLessThan(botoes.indexOf('#musica'))
    })

    it('sem música, o botão de obras vira o principal e "ouvir" some', () => {
        const { container } = render(<ArtistFichaC {...props({ productions: [prod(1, 'obra-a', 'Obra A', 2022, 8)] })} />)
        const botoes = [...container.querySelectorAll('header a')].map(a => a.getAttribute('href'))
        expect(botoes).toContain('#obras')
        expect(botoes).not.toContain('#musica')
    })

    it('ficha vazia só tem a aba de visão geral e nenhuma seção opcional', () => {
        const { container } = render(<ArtistFichaC {...props()} />)
        expect([...container.querySelectorAll('nav a')].map(a => a.getAttribute('href'))).toEqual(['#visao'])
        for (const id of ['musica', 'obras', 'universo', 'ler', 'carreira', 'marcos', 'mapa']) {
            expect(container.querySelector(`#${id}`)).toBeNull()
        }
    })

    it('atalhos por intenção usam o primeiro álbum, a obra de maior nota e o primeiro artigo', () => {
        const { container } = render(<ArtistFichaC {...props({
            discography: [{ title: 'Álbum Um' }, { title: 'Álbum Dois' }],
            productions: [prod(1, 'baixa', 'Nota Baixa', 2020, 5), prod(2, 'alta', 'Nota Alta', 2019, 9)],
            relatedPosts: [{ id: 3, slug: 'post', title: { rendered: 'Primeiro Post' } }],
        }, { storyChapters: [cap('2016', 'Estreia')] })} />)
        const atalhos = container.querySelector('[data-atalhos]')!.getAttribute('data-atalhos')!.split(' ; ')
        expect(atalhos).toEqual([
            'musica:listen:Álbum Um',
            'obras:watch:Nota Alta',
            'ler:read:Primeiro Post',
            'carreira:understand:understandDetail|{"count":1}',
        ])
    })
})

describe('ArtistFichaC · destaque do topo', () => {
    it('mostra a obra de maior nota (empate resolvido pelo ano) e o primeiro prêmio', () => {
        const { container } = render(<ArtistFichaC {...props(
            { productions: [prod(1, 'velha', 'Velha', 2015, 9), prod(2, 'nova', 'Nova', 2023, 9), prod(3, 'fraca', 'Fraca', 2024, 4)] },
            { awards: [{ title: 'Daesang', category: 'Melhor Atriz', year: '2023' }] },
        )} />)
        const compacto = container.querySelector('[data-bloco="ficha-destaque-compacto"]')!
        expect(compacto.querySelector('a')?.getAttribute('href')).toBe('/productions/nova')
        expect(compacto.textContent).toContain('Daesang · Melhor Atriz (2023)')
        expect(container.querySelector('[data-bloco="ficha-destaque"]')).not.toBeNull()
    })

    it('sem obra com pôster nem prêmio, o destaque não existe', () => {
        const { container } = render(<ArtistFichaC {...props({ productions: [prod(1, 'sem-foto', 'Sem Foto', 2020, 9, false)] })} />)
        expect(container.querySelector('[data-bloco="ficha-destaque-compacto"]')).toBeNull()
        expect(container.querySelector('[data-bloco="ficha-destaque"]')).toBeNull()
    })
})

describe('ArtistFichaC · visão geral', () => {
    it('bio antes do anúncio direto; continuação vai no bloco recolhível', () => {
        const { container } = render(<ArtistFichaC {...props({}, { contentAfter: '<p>Resto da bio</p>' })} />)
        const sec = container.querySelector('#visao')!
        expect(sec.textContent).toContain('Bio curta')
        expect(sec.querySelector('[data-collapsible]')?.textContent).toContain('Resto da bio')
    })

    it('sem continuação não cria o bloco recolhível', () => {
        const { container } = render(<ArtistFichaC {...props()} />)
        expect(container.querySelector('[data-collapsible]')).toBeNull()
    })

    it('loja lateral e do meio só entram quando recebidas', () => {
        const sem = render(<ArtistFichaC {...props()} />)
        expect(sem.container.querySelector('[data-loja]')).toBeNull()
        cleanup()
        const com = render(<ArtistFichaC {...props({
            lojaLateral: <i data-loja="lateral" />, lojaMeio: <i data-loja="meio" />, lojaPremios: <i data-loja="premios" />,
        })} />)
        expect([...com.container.querySelectorAll('[data-loja]')].map(e => e.getAttribute('data-loja')).sort()).toEqual(['lateral', 'meio', 'premios'])
    })
})

describe('ArtistFichaC · carreira e marcos', () => {
    it('reparte os capítulos em até 3 fases com período min–max', () => {
        const caps = [cap('2010', 'A'), cap('2012', 'B'), cap('2014', 'C'), cap('2016', 'D'), cap('2018–2020', 'E')]
        const { container } = render(<ArtistFichaC {...props({}, { storyChapters: caps })} />)
        const fases = [...container.querySelectorAll('#carreira ol > li')]
        expect(fases).toHaveLength(3)
        // 5 capítulos → 2 + 2 + 1; o período usa menor e maior ano dos capítulos da fase.
        expect(fases[0].textContent).toContain('2010–2012')
        expect(fases[1].textContent).toContain('2014–2016')
        expect(fases[2].textContent).toContain('2018–2020')
        expect(fases[0].textContent).toContain('A')
        expect(container.querySelector('[data-carreira-completa]')).not.toBeNull()
    })

    it('um capítulo só vira uma fase; ano único não repete o intervalo', () => {
        const { container } = render(<ArtistFichaC {...props({}, { storyChapters: [cap('2016', 'Estreia')] })} />)
        const fases = container.querySelectorAll('#carreira ol > li')
        expect(fases).toHaveLength(1)
        expect(fases[0].textContent).toContain('2016')
        expect(fases[0].textContent).not.toContain('2016–2016')
    })

    it('sem capítulos mas com prêmios, mostra a grade de prêmios e fatos', () => {
        const { container } = render(<ArtistFichaC {...props({}, { awards: [{ year: '2022', category: 'Revelação', title: 'Baeksang', event: 'Gala' }] })} />)
        const sec = container.querySelector('#carreira')!
        expect(sec.querySelector('ol')).toBeNull()
        expect(sec.textContent).toContain('Revelação · Baeksang')
        expect(sec.textContent).toContain('Gala')
    })

    it('linha do tempo exige ao menos 4 marcos em 2 anos distintos', () => {
        const poucos = render(<ArtistFichaC {...props({}, { storyChapters: [cap('2016', 'Estreia')] })} />)
        expect(poucos.container.querySelector('#marcos')).toBeNull()
        cleanup()
        const muitos = render(<ArtistFichaC {...props(
            {
                artist: { id: 1, slug: 'a', title: { rendered: 'A' }, acf: { debut_date: '2016-01-01' } },
                productions: [prod(1, 'o1', 'O1', 2018, 7)],
            },
            { storyChapters: [cap('2016', 'Fase')], awards: [{ year: '2019', category: 'Cat', title: 'Prêmio' }] },
        )} />)
        const marcos = muitos.container.querySelector('[data-marcos]')!.getAttribute('data-marcos')!
        expect(marcos.split(',').sort()).toEqual(['estreia2016', 'fase2016', 'obra2018', 'premio2019'])
        expect(muitos.container.querySelector('#marcos')?.textContent).toContain('marcosStatObras|{"count":1}')
        expect(muitos.container.querySelector('#marcos')?.textContent).toContain('marcosStatPremios|{"count":1}')
    })

    it('prêmio sem ano legível não entra nos marcos', () => {
        const { container } = render(<ArtistFichaC {...props(
            {
                artist: { id: 1, slug: 'a', title: { rendered: 'A' }, acf: { debut_date: '2016-01-01' } },
                productions: [prod(1, 'o1', 'O1', 2018, 7), prod(2, 'o2', 'O2', 2020, 7)],
            },
            { storyChapters: [cap('2017', 'Fase')], awards: [{ year: 'sem ano', category: 'Cat', title: 'X' }] },
        )} />)
        expect(container.querySelector('[data-marcos]')!.getAttribute('data-marcos')).not.toContain('premio')
    })
})

describe('ArtistFichaC · música, obras, universo e leitura', () => {
    it('música: player e Spotify lado a lado; discografia abaixo', () => {
        const { container } = render(<ArtistFichaC {...props(
            { artist: { id: 1, slug: 'a', title: { rendered: 'A' }, acf: { spotify: 'https://open.spotify.com/artist/x' } }, discography: [{ title: 'Álbum' }] },
            { videoList: [{ id: 'v1', title: 'MV' }] },
        )} />)
        const sec = container.querySelector('#musica')!
        expect(sec.querySelector('[data-mv]')).not.toBeNull()
        expect(sec.querySelector('[data-spotify]')).not.toBeNull()
        expect(sec.querySelector('[data-disco]')).not.toBeNull()
        expect(sec.querySelector('.lg\\:grid-cols-\\[minmax\\(0\\,1\\.5fr\\)_minmax\\(0\\,1fr\\)\\]')).not.toBeNull()
    })

    it('só Spotify já abre a seção de música, sem player de vídeo', () => {
        const { container } = render(<ArtistFichaC {...props({ artist: { id: 1, slug: 'a', title: { rendered: 'A' }, acf: { spotify: 'https://x' } } })} />)
        const sec = container.querySelector('#musica')!
        expect(sec.querySelector('[data-spotify]')).not.toBeNull()
        expect(sec.querySelector('[data-mv]')).toBeNull()
    })

    it('obras: 3 destaques numerados por nota + cartão da filmografia completa', () => {
        const { container } = render(<ArtistFichaC {...props({
            productions: [prod(1, 'a', 'A', 2020, 5), prod(2, 'b', 'B', 2021, 9), prod(3, 'c', 'C', 2022, 7), prod(4, 'd', 'D', 2023, 6)],
            nodes: { filmografia: <p data-filmografia /> },
        })} />)
        const sec = container.querySelector('#obras')!
        const links = [...sec.querySelectorAll('ul a[href^="/productions/"]')].map(a => a.getAttribute('href'))
        expect(links).toEqual(['/productions/b', '/productions/c', '/productions/d'])
        expect(sec.textContent).toContain('seeFilmography|{"count":4}')
        expect(sec.querySelector('[data-filmografia]')).not.toBeNull()
    })

    it('universo com grupo: integrantes (sem o próprio artista) + cartão do grupo', () => {
        const { container } = render(<ArtistFichaC {...props({
            groups: [{ id: 9, slug: 'blackpink', title: { rendered: 'BLACKPINK' } }],
            relatedArtists: [artista(1, 'jisoo', 'Jisoo'), artista(2, 'lisa', 'Lisa'), artista(3, 'rose', 'Rosé')],
        })} />)
        const hrefs = [...container.querySelectorAll('#universo a')].map(a => a.getAttribute('href'))
        expect(hrefs).toEqual(['/artists/lisa', '/artists/rose', '/groups/blackpink', '/groups/blackpink'])
    })

    it('universo sem grupo mostra no máximo 3 colegas', () => {
        const { container } = render(<ArtistFichaC {...props({
            relatedArtists: [artista(2, 'a', 'A'), artista(3, 'b', 'B'), artista(4, 'c', 'C'), artista(5, 'd', 'D')],
        })} />)
        expect(container.querySelectorAll('#universo ul > li')).toHaveLength(3)
        expect(container.querySelector('#universo a[href^="/groups/"]')).toBeNull()
    })

    it('só o próprio artista como relacionado não abre o universo', () => {
        const { container } = render(<ArtistFichaC {...props({ relatedArtists: [artista(1, 'jisoo', 'Jisoo')] })} />)
        expect(container.querySelector('#universo')).toBeNull()
    })

    it('leitura: até 3 artigos e link de busca com o nome codificado', () => {
        const { container } = render(<ArtistFichaC {...props({
            name: 'Kim Ji-soo',
            relatedPosts: [1, 2, 3, 4].map(i => ({ id: i, slug: `p${i}`, title: { rendered: `Post ${i}` } })),
        })} />)
        const hrefs = [...container.querySelectorAll('#ler a')].map(a => a.getAttribute('href'))
        expect(hrefs).toEqual(['/blog/p1', '/blog/p2', '/blog/p3', '/blog?search=Kim%20Ji-soo'])
    })
})

describe('ArtistFichaC · mapa de conexões', () => {
    const grupo = { id: 9, slug: 'blackpink', title: { rendered: 'BLACKPINK' } }

    it('com grupo: grupo + até 5 integrantes + obras em destaque; só aparece com 4+ nós', () => {
        const { container } = render(<ArtistFichaC {...props({
            groups: [grupo],
            relatedArtists: [2, 3, 4, 5, 6, 7, 8].map(i => artista(i, `m${i}`, `M${i}`)),
            productions: [prod(1, 'o1', 'O1', 2022, 8)],
        })} />)
        const nos = container.querySelector('[data-mapa]')!.getAttribute('data-mapa')!.split('|')
        expect(nos[0]).toBe('grupo:BLACKPINK')
        expect(nos.filter(n => n.startsWith('artista:'))).toHaveLength(5)
        expect(nos.filter(n => n.startsWith('obra:'))).toEqual(['obra:O1'])
    })

    it('sem grupo: no máximo 3 colegas', () => {
        const { container } = render(<ArtistFichaC {...props({
            relatedArtists: [2, 3, 4, 5, 6].map(i => artista(i, `m${i}`, `M${i}`)),
            productions: [prod(1, 'o1', 'O1', 2022, 8)],
        })} />)
        const nos = container.querySelector('[data-mapa]')!.getAttribute('data-mapa')!.split('|')
        expect(nos.filter(n => n.startsWith('artista:'))).toHaveLength(3)
    })

    it('menos de 4 nós: sem mapa', () => {
        const { container } = render(<ArtistFichaC {...props({ groups: [grupo], relatedArtists: [artista(2, 'm2', 'M2')] })} />)
        expect(container.querySelector('#mapa')).toBeNull()
    })
})

describe('ArtistFichaC · anúncios e recolhidos', () => {
    const completo = () => props({
        discography: [{ title: 'Álbum' }],
        groups: [{ id: 9, slug: 'g', title: { rendered: 'G' } }],
        nodes: { faq: <section data-faq /> },
    })
    const anuncios = (c: HTMLElement) => [...c.querySelectorAll('[data-ad]')].map(e => e.getAttribute('data-ad'))

    it('ficha cheia tem anúncio após visão, música, universo e antes do FAQ', () => {
        const { container } = render(<ArtistFichaC {...completo()} />)
        expect(anuncios(container)).toEqual(['artist_apos_visao', 'artist_apos_musica', 'artist_apos_universo', 'artist_pre_faq'])
    })

    it('ficha magra não carrega nenhum anúncio', () => {
        const { container } = render(<ArtistFichaC {...{ ...completo(), magra: true } as Props} />)
        expect(anuncios(container)).toEqual([])
    })

    it('blocos sem lugar na ficha ficam recolhidos em "ficha completa" e só existem se houver', () => {
        const sem = render(<ArtistFichaC {...props()} />)
        expect(sem.container.textContent).not.toContain('completeSheet')
        cleanup()
        const com = render(<ArtistFichaC {...props({ resto: [<p key="1" data-resto />] })} />)
        expect(com.container.querySelector('details [data-resto]')).not.toBeNull()
        expect(com.container.textContent).toContain('completeSheet')
    })
})
