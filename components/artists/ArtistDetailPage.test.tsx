// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config'

// Cobre o que a ficha do artista decide: perguntas do FAQ (quais entram, em que ordem, limite de 6), abas
// de navegação, ficha magra sem anúncio, vitrine da loja (de onde vem o produto e o título), JSON-LD da pessoa,
// guias só em português, marcas associadas e o rodapé de leitura com ou sem artistas relacionados.
const m = vi.hoisted(() => ({
    locale: 'pt',
    model: {} as Record<string, unknown>,
    entries: [] as Record<string, unknown>[],
    entriesArgs: null as null | Record<string, unknown>,
    fichaC: null as null | Record<string, unknown>,
    reading: null as null | Record<string, unknown>,
    lojas: {} as Record<string, Record<string, unknown>>,
}))

vi.mock('next-intl', () => ({
    useTranslations: (ns?: string) => (key: string, values?: Record<string, unknown>) =>
        `${ns ? `${ns}.` : ''}${key}${values ? `~${JSON.stringify(values)}` : ''}`,
    useLocale: () => m.locale,
}))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children }: { href: string; children?: ReactNode }) => <a href={href}>{children}</a>,
}))
vi.mock('@/lib/profiles/artistProfile', () => ({ buildArtistProfileModel: () => m.model }))
vi.mock('@/components/profiles/ArtistProfileBlocks', () => ({
    buildArtistProfileEntries: (args: Record<string, unknown>) => { m.entriesArgs = args; return m.entries },
}))
vi.mock('@/components/profiles/ProfileSection', async () => {
    const real = await vi.importActual<typeof import('@/lib/profiles/entries')>('@/lib/profiles/entries')
    return {
        isInterstitial: real.isInterstitial,
        CHAVE_DE_ANUNCIO: real.CHAVE_DE_ANUNCIO,
        renderProfileEntries: (entries: Record<string, unknown>[]) => ({ nodes: entries.map((e) => `no:${String(e.id ?? e.key)}`) }),
    }
})
vi.mock('@/components/profiles/ProfileProseStyles', () => ({ ProfileProseStyles: () => null }))
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: (p: { data: { '@type': string } }) => <script data-jsonld={p.data['@type']}>{JSON.stringify(p.data)}</script> }))
vi.mock('@/components/ui/ScrollToTop', () => ({ ScrollToTop: () => <div data-scroll-top /> }))
vi.mock('@/components/ui/ReadingBar', () => ({ ReadingBar: (p: Record<string, unknown>) => { m.reading = p; return <div data-reading /> } }))
vi.mock('@/components/ui/QuizWidget', () => ({ QuizWidget: () => <div data-quiz /> }))
vi.mock('@/components/ui/QuizFacts', () => ({ QuizFacts: () => <div data-quiz-facts /> }))
vi.mock('@/components/artists/ArtistFichaC', () => ({
    ArtistFichaC: (p: Record<string, unknown>) => {
        m.fichaC = p
        return <div data-ficha-c>{p.lojaMeio as ReactNode}{p.lojaLateral as ReactNode}{p.lojaPremios as ReactNode}</div>
    },
}))
vi.mock('@/components/artists/lista/ListaNavegacao', () => ({ ListaBarra: () => <div data-lista-barra />, ListaProxima: () => <div data-lista-proxima /> }))
vi.mock('@/components/artists/lista/RegistrarVisita', () => ({ RegistrarVisita: (p: { item: unknown }) => <div data-visita={JSON.stringify(p.item)} /> }))
vi.mock('@/components/artists/ArtistColophon', () => ({ ArtistColophon: () => <div data-colophon /> }))
vi.mock('@/components/artists/ArtistNextRead', () => ({ ArtistNextRead: (p: { artists: unknown[] }) => <div data-next-read data-n={p.artists.length} /> }))
vi.mock('@/components/ui/LojaDestaque', () => ({ LojaDestaque: (p: Record<string, unknown>) => { m.lojas.destaque = p; return <div data-loja-destaque /> } }))
vi.mock('@/components/ui/LojaLateral', () => ({ LojaLateral: (p: Record<string, unknown>) => { m.lojas.lateral = p; return <div data-loja-lateral /> } }))
vi.mock('@/components/ui/LojaDeslizante', () => ({ LojaDeslizante: (p: Record<string, unknown>) => { m.lojas.deslizante = p; return <div data-loja-deslizante /> } }))
vi.mock('@/components/ui/LojaEmLinha', () => ({ LojaEmLinha: (p: Record<string, unknown>) => { m.lojas.meio = p; return <div data-loja-meio /> } }))
vi.mock('@/components/ui/ShopRelatedSection', () => ({ ShopRelatedSection: (p: Record<string, unknown>) => { m.lojas.secao = p; return <div data-loja-secao /> } }))
vi.mock('@/components/companies/MencionadoAcervo', () => ({ MencionadoAcervo: (p: { mentions: unknown[] }) => <div data-marcas data-n={p.mentions.length} /> }))

import { ArtistDetailPage } from './ArtistDetailPage'

const OUTRO = ACTIVE_LOCALES.find((l) => l !== DEFAULT_LOCALE)

type Props = ComponentProps<typeof ArtistDetailPage>
const titulo = (t: string) => ({ title: { rendered: t } })
const artista = (extra: Record<string, unknown> = {}) => ({ id: 1, slug: 'iu', content: { rendered: '<p>IU é cantora. Estreou em 2008.</p>' }, featured_image_url: null, ...extra }) as unknown as Props['artist']
const grupo = (slug: string, t = slug.toUpperCase()) => ({ id: slug.length, slug, ...titulo(t) }) as unknown as NonNullable<Props['groups']>[number]
const prod = (id: number) => ({ id, slug: `p-${id}`, ...titulo(`Obra ${id}`) }) as unknown as NonNullable<Props['productions']>[number]
const produto = (id: number) => ({ id }) as unknown as NonNullable<Props['shopProducts']>[number]
const produtos = (n: number) => Array.from({ length: n }, (_, i) => produto(i + 1))

const modeloBase = () => ({
    name: 'IU', acf: {}, age: 33, roleLabels: [], socialEntries: [], accent: '#f0f',
    storyChapters: [], hasStoryChapters: false, awards: [], editorialAnalysis: null, videoList: [],
})

const montar = (extra: Partial<Props> = {}) => render(<ArtistDetailPage artist={artista()} {...extra} />)
const faq = () => (m.entriesArgs!.faqItems as { question: string; answer: string }[])
const jsonLd = (c: Element, tipo: string) => JSON.parse(c.querySelector(`[data-jsonld="${tipo}"]`)!.textContent!)
const abas = () => (m.reading!.pageAnchors as { href: string }[]).map((a) => a.href)

beforeEach(() => {
    vi.clearAllMocks()
    m.locale = 'pt'
    m.model = modeloBase()
    m.entries = []
    m.entriesArgs = null
    m.fichaC = null
    m.reading = null
    m.lojas = {}
})
afterEach(cleanup)

describe('ArtistDetailPage — FAQ', () => {
    it('só tem a pergunta "quem é" quando falta tudo, com a primeira frase da bio como resposta', () => {
        const frase = 'IU é uma cantora e atriz sul-coreana que estreou em 2008.'
        montar({ artist: artista({ content: { rendered: `<p>${frase} Outra frase.</p>` } }) })
        expect(faq()).toHaveLength(1)
        expect(faq()[0].question).toBe('profile.artist.faq.whoQ~{"name":"IU"}')
        expect(faq()[0].answer).toBe(frase)
    })

    it('frase de abertura curta demais não serve de resposta: cai no texto padrão', () => {
        montar()
        expect(faq()[0].answer).toBe('profile.artist.faq.whoA~{"name":"IU","extra":""}')
    })

    it('sem bio, a resposta de "quem é" cita os papéis e o grupo', () => {
        m.model = { ...modeloBase(), roleLabels: ['Cantora', 'Atriz'] }
        montar({ artist: artista({ content: { rendered: '' } }), groups: [grupo('bts')] })
        expect(faq()[0].answer).toContain('profile.artist.faq.whoA~')
        expect(faq()[0].answer).toContain('whoARoles')
        expect(faq()[0].answer).toContain('whoAGroup')
    })

    it('ordem e presença: nascimento, grupo, agência e filmografia entram quando existem', () => {
        m.model = { ...modeloBase(), acf: { birth_place: 'Seul, Coreia do Sul', birth_date: '1993-05-16' } }
        montar({ groups: [grupo('a'), grupo('b')], agency: { ...titulo('EDAM') } as never, productions: [prod(1), prod(2)] })
        const perguntas = faq().map((f) => f.question.split('~')[0])
        expect(perguntas).toEqual([
            'profile.artist.faq.whoQ', 'profile.artist.faq.birthPlaceQ', 'profile.artist.faq.birthQ',
            'profile.artist.faq.groupQ', 'profile.artist.faq.agencyQ', 'profile.artist.faq.filmographyQ',
        ])
        expect(faq()[3].answer).toContain('"groups":"A, B"')
        expect(faq()[5].answer).toContain('"count":2')
    })

    it('a pergunta "mais recente" usa o último capítulo da trajetória', () => {
        m.model = { ...modeloBase(), hasStoryChapters: true, storyChapters: [{ period: '2008', title: 'Estreia', description: 'a' }, { period: '2024', title: 'Turnê', description: 'b' }] }
        montar()
        const recente = faq().find((f) => f.question.startsWith('profile.artist.faq.latestQ'))!
        expect(recente.answer).toContain('"title":"Turnê"')
    })

    it('com data de falecimento, a resposta é a de nascimento e morte, com a idade na morte', () => {
        m.model = { ...modeloBase(), age: 40, acf: { birth_date: '1980-01-01', death_date: '2020-01-01' } }
        montar()
        const nasc = faq().find((f) => f.question.startsWith('profile.artist.faq.birthQ'))!
        expect(nasc.answer).toContain('birthDeathA')
        expect(nasc.answer).toContain('ageAtDeath')
    })

    it('sem idade calculável, a resposta de nascimento omite a idade', () => {
        m.model = { ...modeloBase(), age: null, acf: { birth_date: '1980-01-01' } }
        montar()
        const nasc = faq().find((f) => f.question.startsWith('profile.artist.faq.birthQ'))!
        expect(nasc.answer).toContain('"age":""')
    })

    it('limita a 6 perguntas', () => {
        m.model = { ...modeloBase(), hasStoryChapters: true, storyChapters: [{ period: 'x', title: 'y', description: 'z' }], acf: { birth_place: 'Seul', birth_date: '1993-05-16' } }
        montar({ groups: [grupo('a')], agency: { ...titulo('E') } as never, productions: [prod(1)] })
        expect(faq()).toHaveLength(6)
        expect(faq().some((f) => f.question.startsWith('profile.artist.faq.filmographyQ'))).toBe(false)
    })
})

describe('ArtistDetailPage — abas e ficha magra', () => {
    it('só a "visão" quando não há mais nada', () => {
        montar()
        expect(abas()).toEqual(['#visao'])
    })

    it('cada aba aparece com o seu motivo', () => {
        m.model = { ...modeloBase(), hasStoryChapters: true, videoList: [{}] }
        montar({ productions: [prod(1)], groups: [grupo('a')], relatedPosts: [{ id: 5 } as never] })
        expect(abas()).toEqual(['#visao', '#carreira', '#musica', '#obras', '#universo', '#ler'])
    })

    it('"carreira" também vale só com prêmios; "música" com discografia ou Spotify', () => {
        m.model = { ...modeloBase(), awards: [{}], acf: { spotify: 'x' } }
        montar()
        expect(abas()).toEqual(['#visao', '#carreira', '#musica'])
        cleanup()
        m.model = modeloBase()
        montar({ discography: [{} as never] })
        expect(abas()).toContain('#musica')
    })

    it('"universo" ignora o próprio artista entre os relacionados', () => {
        montar({ relatedArtists: [artista({ id: 1 })] })
        expect(abas()).not.toContain('#universo')
        cleanup()
        montar({ relatedArtists: [artista({ id: 2 })] })
        expect(abas()).toContain('#universo')
    })

    it('ficha magra (sem trajetória, análise, obras e com bio curta) pede entradas sem anúncio e remove os anúncios', () => {
        m.entries = [{ id: 'biografia', present: true }, { key: 'leaderboard', interstitial: true }, { key: 'sobre', interstitial: true }]
        montar()
        expect(m.entriesArgs!.semAnuncio).toBe(true)
        expect(m.fichaC!.magra).toBe(true)
    })

    it('com obras, a ficha não é magra', () => {
        montar({ productions: [prod(1)] })
        expect(m.entriesArgs!.semAnuncio).toBe(false)
        expect(m.fichaC!.magra).toBe(false)
    })

    it('com bio longa, a ficha não é magra', () => {
        montar({ artist: artista({ content: { rendered: `<p>${'x'.repeat(700)}</p>` } }) })
        expect(m.fichaC!.magra).toBe(false)
    })

    it('a ficha C recebe filmografia, FAQ e grupos por id, e o resto recolhido sem repetir o que ela já desenha', () => {
        m.entries = [
            { id: 'biografia', present: true }, { id: 'filmografia', present: true }, { id: 'faq', present: true },
            { id: 'grupos', present: true }, { id: 'curiosidades', present: true }, { id: 'ausente', present: false },
            { key: 'meio-ficha', interstitial: true },
        ]
        montar({ productions: [prod(1)] })
        const nodes = m.fichaC!.nodes as Record<string, string>
        expect(Object.keys(nodes).sort()).toEqual(['faq', 'filmografia', 'grupos'])
        // "grupos" já é desenhado pela ficha C, mas com obras volta ao fim do resto para a navegação
        expect(m.fichaC!.resto).toEqual(['no:curiosidades', 'no:grupos'])
    })

    it('sem obras, "grupos" não entra no resto', () => {
        m.entries = [{ id: 'grupos', present: true }]
        montar()
        expect(m.fichaC!.resto).toEqual([])
    })
})

describe('ArtistDetailPage — loja', () => {
    it('sem produto algum, a vitrine do meio e as demais não têm o que mostrar', () => {
        montar()
        expect(m.lojas.lateral).toBeUndefined()
        expect(m.lojas.destaque).toBeUndefined()
        expect(m.fichaC!.lojaLateral).toBeNull()
        expect(m.fichaC!.lojaPremios).toBeNull()
    })

    it('com produtos do artista, o título cita o artista e o link vai à loja dele', () => {
        montar({ shopProducts: produtos(8) })
        expect(m.lojas.secao.title).toBe('Curtiu IU? Leva pra casa')
        expect(m.lojas.secao.href).toBe('/loja/artista/iu')
        expect(m.lojas.secao.contexto).toBe('artista:iu')
    })

    it('a lateral reúne até 3 produtos (4º, 5º e 7º) com contextos estáveis', () => {
        montar({ shopProducts: produtos(8) })
        const itens = m.lojas.lateral.itens as { product: { id: number }; contexto: string }[]
        expect(itens.map((i) => [i.product.id, i.contexto])).toEqual([[4, 'artista:iu:lateral'], [5, 'artista:iu:lateral2'], [7, 'artista:iu:lateral3']])
    })

    it('com poucos produtos, a lateral cai nos primeiros sem repetir o mesmo produto', () => {
        montar({ shopProducts: produtos(1) })
        const itens = m.lojas.lateral.itens as { product: { id: number } }[]
        expect(itens).toHaveLength(1)
    })

    it('o destaque dos prêmios é o 6º produto ou, faltando, o 3º', () => {
        montar({ shopProducts: produtos(6) })
        expect((m.lojas.destaque.product as { id: number }).id).toBe(6)
        cleanup()
        montar({ shopProducts: produtos(3) })
        expect((m.lojas.destaque.product as { id: number }).id).toBe(3)
    })

    it('sem produto do artista, usa o do grupo e o meio diz de quem é o merch', () => {
        montar({ groupShopProducts: produtos(3), connectionGroup: grupo('bts', 'BTS') })
        expect(m.lojas.meio.title).toBe('Merch do BTS')
        expect((m.lojas.meio.products as unknown[]).length).toBe(3)
        const secundaria = m.lojas.secao.secondary as { title: string; href: string }
        expect(secundaria.title).toContain('Também é do BTS')
        expect(secundaria.href).toBe('/loja/grupo/bts')
    })

    it('sem grupo de conexão, a seção não tem faixa secundária', () => {
        montar({ shopProducts: produtos(2) })
        expect(m.lojas.secao.secondary).toBeUndefined()
    })

    it('reserva da loja geral: títulos e links gerais, por tipo', () => {
        montar({ shopProducts: produtos(3), shopFallback: true, shopFallbackTipo: 'merch' })
        expect(m.lojas.meio.title).toBe('Achados de K-pop')
        expect(m.lojas.meio.href).toBe('/loja')
        expect(m.lojas.meio.contexto).toBe('artista:fallback:meio')
        expect(m.lojas.secao.title).toBe('Recomendados pra você')
        cleanup()
        montar({ shopProducts: produtos(3), shopFallback: true, shopFallbackTipo: 'drama' })
        expect(m.lojas.meio.title).toBe('Achados da loja')
    })

    it('o deslizante usa o 3º produto e a mensagem cita o artista', () => {
        montar({ shopProducts: produtos(4) })
        expect((m.lojas.deslizante.product as { id: number }).id).toBe(3)
        expect(m.lojas.deslizante.mensagem).toContain('IU')
    })
})

describe('ArtistDetailPage — dados estruturados e rodapé', () => {
    it('Person: nome, URL, grupos, agência, filmografia e descrição curta', () => {
        m.model = { ...modeloBase(), roleLabels: ['Cantora'], acf: { birth_date: '19930516', name_hangul: '아이유', birth_place: 'Seul' } }
        const { container } = montar({ groups: [grupo('bts', 'BTS')], agency: { ...titulo('EDAM') } as never, productions: [prod(1)] })
        const p = jsonLd(container, 'Person')
        expect(p.name).toBe('IU')
        expect(p.url).toMatch(/\/artists\/iu$/)
        expect(p.birthDate).toBe('1993-05-16')
        expect(p.jobTitle).toBe('Cantora')
        expect(p.memberOf[0]).toMatchObject({ '@type': 'MusicGroup', name: 'BTS' })
        expect(p.affiliation).toEqual({ '@type': 'Organization', name: 'EDAM' })
        expect(p.description).toBe('IU é cantora. Estreou em 2008.')
        expect(p.performerIn).toBeDefined()
        expect(p.nationality).toBeUndefined()
    })

    it('Person sem grupo, agência, imagem e papel omite esses campos', () => {
        const { container } = montar()
        const p = jsonLd(container, 'Person')
        for (const k of ['memberOf', 'affiliation', 'image', 'jobTitle']) expect(p[k]).toBeUndefined()
    })

    it('a descrição do Person é cortada em 200 caracteres', () => {
        const { container } = montar({ artist: artista({ content: { rendered: `<p>${'x'.repeat(500)}</p>` } }) })
        expect(jsonLd(container, 'Person').description).toHaveLength(200)
    })

    it('BreadcrumbList com a lista de artistas e o artista', () => {
        const { container } = montar()
        const b = jsonLd(container, 'BreadcrumbList')
        expect(b.itemListElement).toHaveLength(2)
        expect(b.itemListElement[1].name).toBe('IU')
    })

    it('registra a visita com nome, foto e o primeiro papel', () => {
        m.model = { ...modeloBase(), roleLabels: ['Cantora', 'Atriz'] }
        const { container } = montar({ artist: artista({ featured_image_url: 'https://x/f.jpg' }) })
        const visita = JSON.parse(container.querySelector('[data-visita]')!.getAttribute('data-visita')!)
        expect(visita).toMatchObject({ slug: 'iu', nome: 'IU', papel: 'Cantora' })
    })

    it('marcas associadas só aparecem quando há', () => {
        const sem = montar()
        expect(sem.container.querySelector('[data-marcas]')).toBeNull()
        cleanup()
        const com = montar({ companyMentions: [{} as never, {} as never] })
        expect(com.container.querySelector('[data-marcas]')?.getAttribute('data-n')).toBe('2')
    })

    it('guias relacionados em português, com link para cada guia', () => {
        const { container } = montar({ relatedHubs: [{ slug: 'k-pop', shortTitle: 'K-pop', description: 'd' } as never] })
        expect(container.querySelector('a[href="/guias/k-pop"]')).not.toBeNull()
    })

    it('com artistas relacionados mostra a próxima leitura; sem eles, os atalhos para listas', () => {
        const com = montar({ relatedArtists: [artista({ id: 2 }), artista({ id: 3 })] })
        expect(com.container.querySelector('[data-next-read]')?.getAttribute('data-n')).toBe('2')
        cleanup()
        const sem = montar()
        expect(sem.container.querySelector('[data-next-read]')).toBeNull()
        expect([...sem.container.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(expect.arrayContaining(['/artists', '/groups']))
    })

    it('sempre fecha com quiz, "voltar ao topo" e a barra de leitura apontando para a lista', () => {
        const { container } = montar()
        expect(container.querySelector('[data-quiz]')).not.toBeNull()
        expect(container.querySelector('[data-scroll-top]')).not.toBeNull()
        expect(m.reading!.backHref).toBe('/artists')
    })
})

describe.skipIf(!OUTRO)('ArtistDetailPage — outro idioma', () => {
    it('não mostra os guias (só existem em português) e os links seguem o idioma', () => {
        m.locale = OUTRO!
        const { container } = montar({ relatedHubs: [{ slug: 'k-pop', shortTitle: 'K-pop', description: 'd' } as never] })
        expect(container.querySelector('a[href="/guias/k-pop"]')).toBeNull()
        expect(m.reading!.backHref).toContain(`/${OUTRO}`)
    })
})
