// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'

vi.mock('next-intl', () => ({
    useLocale: () => 'pt-BR',
    useTranslations: () => (key: string, vals?: Record<string, unknown>) => (vals ? `${key}~${JSON.stringify(vals)}` : key),
}))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element -- stub de next/image: o teste só precisa do src
    default: (p: { src: string; alt?: string }) => <img src={p.src} alt={p.alt ?? ''} />,
}))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: (p: { href: string; children?: ReactNode }) => <a href={p.href}>{p.children}</a>,
}))
vi.mock('@/lib/i18n/labels', () => ({ labelsFor: () => ({ groupType: (t: string) => `tipo:${t}` }) }))
vi.mock('@/lib/config/ads', () => ({ ADSENSE: { slots: { leaderboard: 'LB', inline: 'IN' } } }))
vi.mock('@/components/ui/AdSlotInline', () => ({
    AdSlotInline: (p: { analyticsPlacement: string }) => <div data-ad={p.analyticsPlacement} />,
}))
vi.mock('@/components/profiles/ProfileSidebarAd', () => ({
    ProfileSidebarAd: (p: { analyticsPlacement: string }) => <div data-ad={p.analyticsPlacement} />,
}))
vi.mock('@/components/profiles/CollapsibleProse', () => ({
    CollapsibleProse: (p: { children?: ReactNode }) => <div data-collapsible>{p.children}</div>,
}))
vi.mock('@/lib/profiles/highlightProse', () => ({ highlightProse: (html: string) => html }))
vi.mock('@/components/artists/MapaConexoes', () => ({
    MapaConexoes: (p: { nos: { tipo: string; label: string }[] }) => <div data-mapa={p.nos.map(n => `${n.tipo}:${n.label}`).join(',')} />,
}))
vi.mock('@/lib/constants/rotulo-posicao', () => ({ rotuloDaPosicao: (_t: unknown, p: string) => `pos:${p}` }))
vi.mock('@/components/groups/GroupMVPlayer', () => ({ GroupMVPlayer: () => <div data-mv /> }))
vi.mock('@/components/groups/GroupDiscography', () => ({ GroupDiscography: () => <div data-disco /> }))
vi.mock('@/components/groups/GroupSpotifyEmbed', () => ({ GroupSpotifyEmbed: () => <div data-spotify /> }))
vi.mock('@/components/groups/GroupMembersTable', () => ({ GroupMembersTable: () => <div data-tabela /> }))
vi.mock('@/lib/artists/memberSummary', () => ({ toMemberSummary: (m: unknown) => m }))
vi.mock('@/lib/seo/integrantes', () => ({
    linhasIntegrantes: (ms: { slug: string }[]) => ms.map(m => ({ slug: m.slug, idade: 25 })),
}))

import { GroupFichaC } from './GroupFichaC'

afterEach(cleanup)

type Props = Parameters<typeof GroupFichaC>[0]

const membro = (id: number, slug: string, nome: string, foto = true) => ({
    id, slug, title: { rendered: nome }, acf: { name_hangul: `한${nome}` }, ...(foto ? { featured_image_url: `/m/${slug}.jpg` } : {}),
})
const grupoRel = (id: number, slug: string, nome: string, acf: Record<string, unknown> = {}) => ({ id, slug, title: { rendered: nome }, acf })
// O ID do YouTube tem 11 caracteres; completa o nome curto para a URL ser válida.
const yt = (id: string) => id.padEnd(11, '_')
const video = (id: string, title = `Clipe ${id}`) => ({ url: `https://www.youtube.com/watch?v=${yt(id)}`, title, context: 'Ctx' })
const album = (id: number, title: string) => ({ id, title, releaseYear: 2022, coverUrl: `/c/${id}.jpg` })

function props(over: Record<string, unknown> = {}, acf: Record<string, unknown> = {}, modelOver: Record<string, unknown> = {}) {
    return {
        group: { id: 1, slug: 'blackpink', title: { rendered: 'BLACKPINK' } },
        model: {
            accent: '#ff2d95', name: 'BLACKPINK', acf, contentBefore: '<p>Bio do grupo</p>', contentAfter: '',
            videoList: [], hasBio: true, ...modelOver,
        },
        activeMembers: [],
        formerMembers: [],
        formerSemFicha: [],
        memberPositions: {},
        relatedGroups: [],
        relatedPosts: [],
        discography: [],
        soloReleases: {},
        agencyName: null,
        generation: null,
        magra: false,
        nodes: {},
        resto: [],
        ...over,
    } as unknown as Props
}

const cap = (period: string, title: string, extra: Record<string, unknown> = {}) => ({ period, title, description: '', ...extra })
const trio = () => [membro(1, 'jisoo', 'Jisoo'), membro(2, 'jennie', 'Jennie'), membro(3, 'rose', 'Rosé')]
const anuncios = (c: HTMLElement) => [...c.querySelectorAll('[data-ad]')].map(e => e.getAttribute('data-ad'))

describe('GroupFichaC · abas', () => {
    it('com uma só aba (ou nenhuma), a navegação não aparece', () => {
        const { container } = render(<GroupFichaC {...props({ activeMembers: [membro(1, 'a', 'A')] })} />)
        // 1 integrante: aba "membros"; fandom exige >1 integrante ou cor.
        expect(container.querySelector('nav')).toBeNull()
    })

    it('abas seguem o conteúdo, na ordem membros, música, carreira, fandom, ler', () => {
        const { container } = render(<GroupFichaC {...props(
            { activeMembers: trio(), discography: [album(1, 'A')], relatedPosts: [{ id: 1, slug: 'p', title: { rendered: 'P' } }] },
            { story_chapters: [cap('2016', 'Estreia')] },
        )} />)
        expect([...container.querySelectorAll('nav a')].map(a => a.getAttribute('href'))).toEqual(['#membros', '#musica', '#carreira', '#fandom', '#ler'])
    })

    it('fandom também abre com a cor do grupo, mesmo com poucos integrantes', () => {
        const { container } = render(<GroupFichaC {...props({ activeMembers: [membro(1, 'a', 'A')] }, { color: '#fff' })} />)
        expect(container.querySelector('#fandom')).not.toBeNull()
    })
})

describe('GroupFichaC · integrantes', () => {
    it('lista os integrantes com posição, idade e hangul', () => {
        const { container } = render(<GroupFichaC {...props({
            activeMembers: trio(), memberPositions: { jisoo: ['vocal', 'visual'] },
        })} />)
        const lista = container.querySelectorAll('#membros ul > li')
        expect(lista).toHaveLength(3)
        const jisoo = lista[0].textContent!
        expect(jisoo).toContain('Jisoo')
        expect(jisoo).toContain('한Jisoo')
        expect(jisoo).toContain('pos:vocal')
        expect(jisoo).toContain('pos:visual')
        expect(jisoo).toContain('years~{"count":25}')
        expect(lista[0].querySelector('a')?.getAttribute('href')).toBe('/artists/jisoo')
    })

    it('tabela de idade e posição é recolhida e só existe com integrantes', () => {
        const com = render(<GroupFichaC {...props({ activeMembers: trio() })} />)
        expect(com.container.querySelector('#membros details [data-tabela]')).not.toBeNull()
        cleanup()
        const sem = render(<GroupFichaC {...props()} />)
        expect(sem.container.querySelector('#membros')).toBeNull()
    })

    it('integrante sem foto fica sem imagem, sem quebrar', () => {
        const { container } = render(<GroupFichaC {...props({ activeMembers: [membro(1, 'a', 'A', false)] })} />)
        expect(container.querySelector('#membros img')).toBeNull()
        expect(container.querySelector('#membros')?.textContent).toContain('A')
    })
})

describe('GroupFichaC · "comece por aqui"', () => {
    it('precisa de pelo menos 2 trilhas', () => {
        const { container } = render(<GroupFichaC {...props({ activeMembers: trio() })} />)
        // só a trilha "por integrante" (3 com foto): 1 trilha < 2
        expect(container.querySelector('#comece')).toBeNull()
    })

    it('hits + integrantes + clipes: três colunas; hits não repetem clipes', () => {
        const { container } = render(<GroupFichaC {...props(
            { activeMembers: trio() },
            { hits: [video('h1'), video('h2')] },
            { videoList: [video('h1'), video('c1'), video('c2'), video('c3')] },
        )} />)
        const sec = container.querySelector('#comece')!
        expect(sec.querySelector('.lg\\:grid-cols-3')).not.toBeNull()
        const links = [...sec.querySelectorAll('a[href^="https://www.youtube.com"]')].map(a => a.getAttribute('href')!.split('=')[1])
        // Os clipes são cortados em 3 (h1, c1, c2) e só depois perdem os que já são hits.
        expect(links).toEqual(['h1', 'h2', 'c1', 'c2'].map(yt))
    })

    it('clipes são limitados a 3 e URL inválida não conta', () => {
        const { container } = render(<GroupFichaC {...props(
            { activeMembers: trio() },
            {},
            { videoList: [video('a1'), { url: 'https://exemplo.com/x', title: 'Inválido' }, video('a2'), video('a3'), video('a4')] },
        )} />)
        const links = [...container.querySelectorAll('#comece a[href^="https://www.youtube.com"]')].map(a => a.getAttribute('href')!.split('=')[1])
        expect(links).toEqual(['a1', 'a2', 'a3'].map(yt))
    })

    it('com duas trilhas usa duas colunas', () => {
        const { container } = render(<GroupFichaC {...props(
            { activeMembers: trio() },
            {},
            { videoList: [video('a1'), video('a2')] },
        )} />)
        const sec = container.querySelector('#comece')!
        expect(sec.querySelector('.md\\:grid-cols-2')).not.toBeNull()
        expect(sec.querySelector('.lg\\:grid-cols-3')).toBeNull()
    })
})

describe('GroupFichaC · conexões', () => {
    it('mapa: até 7 integrantes + até 3 grupos relacionados ativos', () => {
        const ativos = [1, 2, 3, 4].map(i => grupoRel(i, `g${i}`, `G${i}`))
        const { container } = render(<GroupFichaC {...props({
            activeMembers: Array.from({ length: 9 }, (_, i) => membro(i + 1, `m${i}`, `M${i}`)),
            relatedGroups: [grupoRel(9, 'velho', 'Velho', { active: false }), grupoRel(10, 'extinto', 'Extinto', { disbandment_date: '2020-01-01' }), ...ativos],
        })} />)
        const nos = container.querySelector('[data-mapa]')!.getAttribute('data-mapa')!.split(',')
        expect(nos.filter(n => n.startsWith('artista:'))).toHaveLength(7)
        expect(nos.filter(n => n.startsWith('grupo:'))).toEqual(['grupo:G1', 'grupo:G2', 'grupo:G3'])
    })

    it('menos de 4 nós: sem mapa', () => {
        const { container } = render(<GroupFichaC {...props({ activeMembers: [membro(1, 'a', 'A'), membro(2, 'b', 'B')] })} />)
        expect(container.querySelector('#conexoes')).toBeNull()
    })
})

describe('GroupFichaC · música e solo', () => {
    it('música: vídeo, Spotify e discografia', () => {
        const { container } = render(<GroupFichaC {...props(
            { discography: [album(1, 'A')] },
            { spotify: 'https://open.spotify.com/artist/x' },
            { videoList: [video('v1')] },
        )} />)
        const sec = container.querySelector('#musica')!
        expect(sec.querySelector('[data-mv]')).not.toBeNull()
        expect(sec.querySelector('[data-spotify]')).not.toBeNull()
        expect(sec.querySelector('[data-disco]')).not.toBeNull()
    })

    it('sem vídeo, Spotify nem discografia não há seção de música', () => {
        const { container } = render(<GroupFichaC {...props()} />)
        expect(container.querySelector('#musica')).toBeNull()
    })

    it('lançamentos solo: até 5 integrantes com solo, até 5 álbuns cada', () => {
        const solo = Array.from({ length: 7 }, (_, i) => album(i + 1, `S${i}`))
        const { container } = render(<GroupFichaC {...props({
            activeMembers: [membro(1, 'jisoo', 'Jisoo'), membro(2, 'lisa', 'Lisa')],
            soloReleases: { jisoo: solo },
        })} />)
        const sec = container.querySelector('#solo')!
        expect(sec.querySelectorAll(':scope > div > ul > li')).toHaveLength(1)
        expect(sec.textContent).toContain('soloCount~{"count":7}')
        expect(sec.querySelectorAll('li li')).toHaveLength(5)
    })

    it('sem solo de ninguém, a seção não aparece', () => {
        const { container } = render(<GroupFichaC {...props({ activeMembers: trio() })} />)
        expect(container.querySelector('#solo')).toBeNull()
    })
})

describe('GroupFichaC · carreira', () => {
    it('capítulos encadeados: cada um diz o que veio depois; o último é "latest"', () => {
        const { container } = render(<GroupFichaC {...props({}, { story_chapters: [cap('2016', 'Estreia'), cap('2019', 'Auge'), cap('2023', 'Agora')] })} />)
        const itens = [...container.querySelectorAll('#carreira ol > li')].map(li => li.textContent!)
        expect(itens).toHaveLength(3)
        expect(itens[0]).toContain('after~{"title":"Auge"}')
        expect(itens[1]).toContain('after~{"title":"Agora"}')
        expect(itens[2]).toContain('latest')
    })

    it('mostra no máximo 6 capítulos', () => {
        const caps = Array.from({ length: 8 }, (_, i) => cap(String(2010 + i), `C${i}`))
        const { container } = render(<GroupFichaC {...props({}, { story_chapters: caps })} />)
        expect(container.querySelectorAll('#carreira ol > li')).toHaveLength(6)
    })

    it('números só entram com 3+ métricas completas, e no máximo 4', () => {
        const poucos = render(<GroupFichaC {...props({}, { key_metrics: [{ label: 'A', value: '1' }, { label: 'B', value: '2' }, { label: 'C', value: '' }] })} />)
        expect(poucos.container.querySelector('#carreira')).toBeNull()
        cleanup()
        const muitos = render(<GroupFichaC {...props({}, { key_metrics: ['A', 'B', 'C', 'D', 'E'].map(l => ({ label: l, value: '9' })) })} />)
        expect(muitos.container.querySelectorAll('#carreira dl > div')).toHaveLength(4)
    })

    it('citação vem do primeiro capítulo com texto e autor', () => {
        const { container } = render(<GroupFichaC {...props({}, { story_chapters: [
            cap('2016', 'Sem citação'),
            cap('2018', 'Com citação', { quote_text: 'Frase', quote_author: 'Jennie', quote_context: 'Show' }),
        ] })} />)
        const fig = container.querySelector('#carreira figure')!
        expect(fig.textContent).toContain('“Frase”')
        expect(fig.textContent).toContain('Jennie · Show')
    })

    it('capítulo só com texto da citação, sem autor, não gera citação', () => {
        const { container } = render(<GroupFichaC {...props({}, { story_chapters: [cap('2016', 'X', { quote_text: 'Frase' })] })} />)
        expect(container.querySelector('#carreira figure')).toBeNull()
    })

    it('a análise completa fica recolhida, com os blocos originais', () => {
        const { container } = render(<GroupFichaC {...props(
            { nodes: { analise: <i data-n="analise" />, trajetoria: <i data-n="trajetoria" />, recordes: <i data-n="recordes" /> } },
            { story_chapters: [cap('2016', 'X')] },
        )} />)
        const det = container.querySelector('#carreira details')!
        expect([...det.querySelectorAll('[data-n]')].map(e => e.getAttribute('data-n'))).toEqual(['analise', 'trajetoria', 'recordes'])
    })
})

describe('GroupFichaC · formação', () => {
    it('só aparece com ex-integrantes; ex ficam marcados e os sem ficha entram sem link', () => {
        const sem = render(<GroupFichaC {...props({ activeMembers: trio() })} />)
        expect(sem.container.querySelector('#formacao')).toBeNull()
        cleanup()
        const { container } = render(<GroupFichaC {...props({
            activeMembers: [membro(1, 'a', 'A')],
            formerMembers: [membro(2, 'ex', 'Ex')],
            formerSemFicha: [{ slug: 'sem-ficha', name: 'Sem Ficha' }],
        })} />)
        const itens = [...container.querySelectorAll('#formacao ul > li')]
        expect(itens).toHaveLength(3)
        expect(itens[0].textContent).toContain('lineupActive')
        expect(itens[1].textContent).toContain('lineupFormer')
        expect(itens[1].className).toContain('opacity-60')
        expect(itens[2].textContent).toContain('Sem Ficha')
        expect(itens[2].querySelector('a')).toBeNull()
    })
})

describe('GroupFichaC · sobre e ficha lateral', () => {
    it('ficha traz tipo, fandom, geração, agência e significado do nome na ordem', () => {
        const { container } = render(<GroupFichaC {...props(
            { generation: '4ª geração', agencyName: 'YG' },
            { type: 'girl_group', fandom_name: 'BLINK', name_meaning: 'Rosa e preto' },
        )} />)
        const dd = [...container.querySelectorAll('#sobre aside dd')].map(e => e.textContent)
        expect(dd).toEqual(['tipo:girl_group', 'BLINK', '4ª geração', 'YG', 'Rosa e preto'])
    })

    it('sem bio nem ficha, a seção sobre não existe', () => {
        const { container } = render(<GroupFichaC {...props({}, {}, { hasBio: false })} />)
        expect(container.querySelector('#sobre')).toBeNull()
    })

    it('continuação da bio fica no bloco recolhível; loja lateral só quando recebida', () => {
        const { container } = render(<GroupFichaC {...props({ lojaLateral: <i data-loja /> }, {}, { contentAfter: '<p>Mais</p>' })} />)
        expect(container.querySelector('#sobre [data-collapsible]')?.textContent).toContain('Mais')
        expect(container.querySelector('#sobre [data-loja]')).not.toBeNull()
    })
})

describe('GroupFichaC · fandom, leitura, recolhidos e anúncios', () => {
    it('fandom: título com o nome do fã-clube quando existe', () => {
        const nomeado = render(<GroupFichaC {...props({ nodes: { votacao: <i data-n="votacao" /> } }, { fandom_name: 'BLINK', color: '#f0f' })} />)
        expect(nomeado.container.querySelector('#fandom h2')?.textContent).toContain('fandom~{"fandom":"BLINK"}')
        expect(nomeado.container.querySelector('#fandom [data-n="votacao"]')).not.toBeNull()
        cleanup()
        const simples = render(<GroupFichaC {...props({}, { color: '#f0f' })} />)
        expect(simples.container.querySelector('#fandom h2')?.textContent).toBe('fandomPlain')
    })

    it('leitura e relacionados só com posts/grupos', () => {
        const sem = render(<GroupFichaC {...props({ nodes: { artigos: <i data-n="artigos" />, relacionados: <i data-n="rel" /> } })} />)
        expect(sem.container.querySelector('[data-n]')).toBeNull()
        cleanup()
        const com = render(<GroupFichaC {...props({
            relatedPosts: [{ id: 1, slug: 'p', title: { rendered: 'P' } }],
            relatedGroups: [grupoRel(1, 'g', 'G')],
            nodes: { artigos: <i data-n="artigos" />, relacionados: <i data-n="rel" /> },
        })} />)
        expect([...com.container.querySelectorAll('[data-n]')].map(e => e.getAttribute('data-n'))).toEqual(['artigos', 'rel'])
    })

    it('anúncios: integrantes, carreira, lateral e antes do FAQ; magra não leva nenhum', () => {
        const base = {
            activeMembers: trio(), nodes: { faq: <i data-n="faq" /> },
        }
        const cheia = render(<GroupFichaC {...props(base, { story_chapters: [cap('2016', 'X')] })} />)
        expect(anuncios(cheia.container)).toEqual(['group_apos_integrantes', 'group_apos_carreira', 'group_lateral_fixa', 'group_pre_faq'])
        cleanup()
        const magra = render(<GroupFichaC {...props({ ...base, magra: true }, { story_chapters: [cap('2016', 'X')] })} />)
        expect(anuncios(magra.container)).toEqual([])
    })

    it('blocos sem lugar ficam recolhidos em "ficha completa"', () => {
        const sem = render(<GroupFichaC {...props()} />)
        expect(sem.container.textContent).not.toContain('fullSheet')
        cleanup()
        const com = render(<GroupFichaC {...props({ resto: [<p key="1" data-resto />] })} />)
        expect(com.container.querySelector('details [data-resto]')).not.toBeNull()
    })
})
