// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config'

// Cobre o que a ficha do grupo decide: perguntas do FAQ (quais entram, ordem, limite de 5, nomes só com a
// formação inteira carregada), abas, ficha magra, vitrine da loja, JSON-LD do grupo com integrantes,
// guias só em português e marcas associadas.
const m = vi.hoisted(() => ({
    locale: 'pt',
    model: {} as Record<string, unknown>,
    entries: [] as Record<string, unknown>[],
    entriesArgs: null as null | Record<string, unknown>,
    fichaC: null as null | Record<string, unknown>,
    reading: null as null | Record<string, unknown>,
    hero: null as null | Record<string, unknown>,
    lojas: [] as Record<string, unknown>[],
    secao: null as null | Record<string, unknown>,
}))

vi.mock('next-intl', async (importOriginal) => ({
    // `labelsFor` (usado no papel da visita) precisa do `createTranslator` verdadeiro.
    ...(await importOriginal<typeof import('next-intl')>()),
    useTranslations: (ns?: string) => (key: string, values?: Record<string, unknown>) =>
        `${ns ? `${ns}.` : ''}${key}${values ? `~${JSON.stringify(values)}` : ''}`,
    useLocale: () => m.locale,
}))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children }: { href: string; children?: ReactNode }) => <a href={href}>{children}</a>,
}))
vi.mock('@/lib/profiles/groupProfile', async () => {
    const real = await vi.importActual<typeof import('@/lib/profiles/groupProfile')>('@/lib/profiles/groupProfile')
    return { countActiveMembers: real.countActiveMembers, buildGroupProfileModel: () => m.model }
})
vi.mock('@/components/profiles/GroupProfileBlocks', () => ({
    buildGroupProfileEntries: (args: Record<string, unknown>) => { m.entriesArgs = args; return m.entries },
}))
vi.mock('@/components/profiles/ProfileSection', async () => {
    const real = await vi.importActual<typeof import('@/lib/profiles/entries')>('@/lib/profiles/entries')
    return {
        isInterstitial: real.isInterstitial,
        renderProfileEntries: (entries: Record<string, unknown>[]) => ({ nodes: entries.map((e) => `no:${String(e.id ?? e.key)}`) }),
    }
})
vi.mock('@/components/profiles/ProfileProseStyles', () => ({ ProfileProseStyles: () => null }))
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: (p: { data: { '@type': string } }) => <script data-jsonld={p.data['@type']}>{JSON.stringify(p.data)}</script> }))
vi.mock('@/components/ui/ScrollToTop', () => ({ ScrollToTop: () => <div data-scroll-top /> }))
vi.mock('@/components/ui/ReadingBar', () => ({ ReadingBar: (p: Record<string, unknown>) => { m.reading = p; return <div data-reading /> } }))
vi.mock('@/components/ui/QuizWidget', () => ({ QuizWidget: () => <div data-quiz /> }))
vi.mock('@/components/ui/QuizFacts', () => ({ QuizFacts: () => <div data-quiz-facts /> }))
vi.mock('@/components/groups/GroupHero', () => ({ GroupHero: (p: Record<string, unknown>) => { m.hero = p; return <div data-hero /> } }))
vi.mock('@/components/groups/GroupFichaC', () => ({
    GroupFichaC: (p: Record<string, unknown>) => {
        m.fichaC = p
        return <div data-ficha-c>{p.lojaLateral as ReactNode}</div>
    },
}))
vi.mock('@/components/artists/lista/RegistrarVisita', () => ({ RegistrarVisita: (p: { item: unknown }) => <div data-visita={JSON.stringify(p.item)} /> }))
vi.mock('@/components/ui/LojaDestaque', () => ({ LojaDestaque: (p: Record<string, unknown>) => { m.lojas.push(p); return <div data-loja-destaque /> } }))
vi.mock('@/components/ui/ShopRelatedSection', () => ({ ShopRelatedSection: (p: Record<string, unknown>) => { m.secao = p; return <div data-loja-secao /> } }))
vi.mock('@/components/companies/MencionadoAcervo', () => ({ MencionadoAcervo: (p: { mentions: unknown[] }) => <div data-marcas data-n={p.mentions.length} /> }))

import { GroupDetailPage } from './GroupDetailPage'

const OUTRO = ACTIVE_LOCALES.find((l) => l !== DEFAULT_LOCALE)

type Props = ComponentProps<typeof GroupDetailPage>
const titulo = (t: string) => ({ title: { rendered: t } })
const grupo = (extra: Record<string, unknown> = {}) =>
    ({ id: 7, slug: 'twice', content: { rendered: '<p>Twice é um grupo.</p>' }, featured_image_url: null, ...extra }) as unknown as Props['group']
const integrante = (slug: string, nome = slug.toUpperCase()) => ({ id: slug.length, slug, ...titulo(nome) }) as unknown as NonNullable<Props['members']>[number]
const produto = (id: number) => ({ id }) as unknown as NonNullable<Props['shopProducts']>[number]

const modeloBase = () => ({
    name: 'TWICE', acf: {}, memberCount: 0, year: null, disbandYear: null, accent: '#f0f',
    yearsActive: null, generation: null, socialEntries: [], hasBio: false, formerEntries: [], videoList: [],
})

const montar = (extra: Partial<Props> = {}) => render(<GroupDetailPage group={grupo()} {...extra} />)
const faq = () => (m.entriesArgs!.faqItems as { question: string; answer: string }[])
const perguntas = () => faq().map((f) => f.question.split('~')[0])
const jsonLd = (c: Element) => JSON.parse(c.querySelector('[data-jsonld="MusicGroup"]')!.textContent!)
const abas = () => (m.reading!.pageAnchors as { href: string }[]).map((a) => a.href)

beforeEach(() => {
    vi.clearAllMocks()
    m.locale = 'pt'
    m.model = modeloBase()
    m.entries = []
    m.entriesArgs = null
    m.fichaC = null
    m.reading = null
    m.hero = null
    m.lojas = []
    m.secao = null
})
afterEach(cleanup)

describe('GroupDetailPage — FAQ', () => {
    it('só tem "quem é" quando falta tudo, com a primeira frase da bio como resposta', () => {
        const frase = 'Twice é um grupo feminino sul-coreano formado pela JYP Entertainment.'
        montar({ group: grupo({ content: { rendered: `<p>${frase} Outra frase.</p>` } }) })
        expect(faq()).toHaveLength(1)
        expect(faq()[0].question).toBe('profile.group.faq.whoQ~{"name":"TWICE"}')
        expect(faq()[0].answer).toBe(frase)
    })

    it('sem frase de abertura utilizável, a resposta depende de haver bio', () => {
        montar()
        expect(faq()[0].answer).toBe('profile.group.faq.whoANoBio~{"name":"TWICE"}')
        cleanup()
        m.model = { ...modeloBase(), hasBio: true }
        montar()
        expect(faq()[0].answer).toBe('profile.group.faq.whoABio~{"name":"TWICE"}')
    })

    it('ordem e presença: estreia, integrantes, agência e fandom entram quando existem', () => {
        m.model = { ...modeloBase(), year: 2015, memberCount: 9, acf: { fandom_name: 'ONCE' } }
        montar({ agency: { ...titulo('JYP') } as never })
        expect(perguntas()).toEqual([
            'profile.group.faq.whoQ', 'profile.group.faq.debutQ', 'profile.group.faq.membersQ',
            'profile.group.faq.agencyQ', 'profile.group.faq.fandomQ',
        ])
        expect(faq()[1].answer).toContain('"year":"2015"')
        expect(faq()[1].answer).toContain('debutAgency')
        expect(faq()[3].answer).toContain('"agency":"JYP"')
        expect(faq()[4].answer).toContain('"fandom":"ONCE"')
    })

    it('a estreia sem agência não cita a agência', () => {
        m.model = { ...modeloBase(), year: 2015 }
        montar()
        expect(faq()[1].answer).toContain('"agency":""')
    })

    it('a data completa de estreia (AAAAMMDD ou AAAA-MM-DD) substitui o ano; data torta cai no ano', () => {
        m.model = { ...modeloBase(), year: 2015, acf: { debut_date: '20151020' } }
        montar()
        expect(faq()[1].answer).not.toContain('"year":"2015"')
        cleanup()
        m.model = { ...modeloBase(), year: 2015, acf: { debut_date: '2015-10-20' } }
        montar()
        expect(faq()[1].answer).not.toContain('"year":"2015"')
        cleanup()
        m.model = { ...modeloBase(), year: 2015, acf: { debut_date: '2015' } }
        montar()
        expect(faq()[1].answer).toContain('"year":"2015"')
    })

    it('com todas as integrantes ativas carregadas, a resposta lista os nomes', () => {
        m.model = { ...modeloBase(), memberCount: 2 }
        montar({ members: [integrante('nayeon', 'Nayeon'), integrante('jihyo', 'Jihyo')] })
        const resposta = faq().find((f) => f.question.startsWith('profile.group.faq.membersQ'))!.answer
        expect(resposta).toContain('membersANames')
        expect(resposta).toContain('"count":2')
        expect(resposta).toContain('"names":"Nayeon, Jihyo"')
    })

    it('ex-integrante sem ficha não some com ninguém da contagem ativa', () => {
        m.model = { ...modeloBase(), memberCount: 3, formerEntries: [{ slug: 'ex', name: 'Ex' }] }
        montar({ members: [integrante('a'), integrante('b')] })
        const resposta = faq().find((f) => f.question.startsWith('profile.group.faq.membersQ'))!.answer
        expect(resposta).toContain('membersANames')
        expect(resposta).toContain('"count":2')
    })

    it('sem fichas carregadas, usa a contagem do modelo e não lista ninguém', () => {
        m.model = { ...modeloBase(), memberCount: 5 }
        montar()
        const resposta = faq().find((f) => f.question.startsWith('profile.group.faq.membersQ'))!.answer
        expect(resposta).toContain('profile.group.faq.membersA~')
        expect(resposta).toContain('"count":5')
        expect(resposta).toContain('"former":""')
    })

    it('sem fichas carregadas, as saídas aparecem na resposta', () => {
        m.model = { ...modeloBase(), memberCount: 5, formerEntries: [{ slug: 'ex', name: 'Ex' }] }
        montar()
        const resposta = faq().find((f) => f.question.startsWith('profile.group.faq.membersQ'))!.answer
        expect(resposta).toContain('membersFormer')
    })

    it('o ex-integrante que tem ficha sai da contagem ativa', () => {
        m.model = { ...modeloBase(), memberCount: 3, formerEntries: [{ slug: 'ex', name: 'Ex' }] }
        montar({ members: [integrante('a'), integrante('b'), integrante('ex')] })
        const resposta = faq().find((f) => f.question.startsWith('profile.group.faq.membersQ'))!.answer
        expect(resposta).toContain('"count":2')
        expect(resposta).toContain('"names":"A, B"')
        expect(m.entriesArgs!.formerMembers).toHaveLength(1)
        expect(m.entriesArgs!.activeMembers).toHaveLength(2)
        expect(m.entriesArgs!.formerSemFicha).toEqual([])
    })

    it('ex-integrante sem ficha vai como nome, sem card', () => {
        m.model = { ...modeloBase(), formerEntries: [{ slug: 'ex', name: 'Ex' }] }
        montar({ members: [integrante('a')] })
        expect(m.entriesArgs!.formerSemFicha).toEqual([{ slug: 'ex', name: 'Ex' }])
    })
})

describe('GroupDetailPage — abas e ficha magra', () => {
    it('sem nada para mostrar, não há aba', () => {
        montar()
        expect(abas()).toEqual([])
    })

    it('cada aba aparece com o seu motivo', () => {
        m.model = { ...modeloBase(), videoList: [{}], acf: { story_chapters: [{}], color: '#fff' } }
        montar({ members: [integrante('a')], relatedPosts: [{ id: 5 } as never] })
        expect(abas()).toEqual(['#membros', '#musica', '#carreira', '#fandom', '#ler'])
    })

    it('"música" vale com discografia ou Spotify, mesmo sem vídeos', () => {
        m.model = { ...modeloBase(), acf: { spotify: 'x' } }
        montar()
        expect(abas()).toEqual(['#musica'])
        cleanup()
        m.model = modeloBase()
        montar({ discography: [{} as never] })
        expect(abas()).toEqual(['#musica'])
    })

    it('"fandom" aparece com mais de um integrante, mas não com um só', () => {
        montar({ members: [integrante('a')] })
        expect(abas()).not.toContain('#fandom')
        cleanup()
        montar({ members: [integrante('a'), integrante('b')] })
        expect(abas()).toContain('#fandom')
    })

    it('"membros" só conta quem não saiu', () => {
        m.model = { ...modeloBase(), formerEntries: [{ slug: 'a', name: 'A' }] }
        montar({ members: [integrante('a')] })
        expect(abas()).not.toContain('#membros')
    })

    it('sem integrantes nem bio, a ficha é magra', () => {
        montar()
        expect(m.fichaC!.magra).toBe(true)
    })

    it('com bio ou com integrantes, a ficha não é magra', () => {
        m.model = { ...modeloBase(), hasBio: true }
        montar()
        expect(m.fichaC!.magra).toBe(false)
        cleanup()
        m.model = modeloBase()
        montar({ members: [integrante('a')] })
        expect(m.fichaC!.magra).toBe(false)
    })
})

describe('GroupDetailPage — ficha C', () => {
    it('as seções desenhadas vão por id; o resto, para a lista de recolhidos', () => {
        m.entries = [
            { id: 'sobre', present: true },
            { key: 'leaderboard', interstitial: true },
            { id: 'analise', present: true },
            { id: 'curiosidades', present: true },
            { id: 'faq', present: false },
            { id: 'contato', present: true },
        ]
        montar()
        expect(Object.keys(m.fichaC!.nodes as object)).toEqual(['sobre', 'analise', 'curiosidades', 'contato'])
        expect(m.fichaC!.resto).toEqual(['no:curiosidades', 'no:contato'])
    })

    it('a faixa lateral da loja usa o primeiro produto e, havendo, o segundo', () => {
        montar({ group: grupo({ slug: 'twice' }), shopProducts: [produto(1), produto(2), produto(3)] })
        expect(m.lojas).toHaveLength(2)
        expect(m.lojas[0].title).toBe('Para quem curte TWICE')
        expect(m.lojas[0].contexto).toBe('grupo:twice:lateral')
        expect(m.lojas[1].title).toBe('Mais da loja')
    })

    it('com um só produto, só um destaque; sem produto, nenhum', () => {
        montar({ shopProducts: [produto(1)] })
        expect(m.lojas).toHaveLength(1)
        cleanup()
        m.lojas = []
        montar()
        expect(m.lojas).toHaveLength(0)
        expect(m.fichaC!.lojaLateral).toBeNull()
    })

    it('vitrine geral (fallback) muda os títulos e leva à loja toda', () => {
        montar({ shopProducts: [produto(1)], shopFallback: true })
        expect(m.lojas[0].title).toBe('Achado da loja')
        expect(m.secao!.title).toBe('Recomendados pra você')
        expect(m.secao!.href).toBe('/loja')
        expect(m.secao!.contexto).toBe('grupo:fallback')
    })

    it('vitrine do grupo leva à loja do grupo', () => {
        montar({ shopProducts: [produto(1)] })
        expect(m.secao!.title).toBe('Curtiu TWICE? Leva pra casa')
        expect(m.secao!.href).toBe('/loja/grupo/twice')
        expect(m.secao!.verTudoLabel).toBe('Ver tudo de TWICE')
        expect(m.secao!.contexto).toBe('grupo:twice')
    })
})

describe('GroupDetailPage — cabeçalho e dados estruturados', () => {
    it('o herói recebe a contagem ativa quando há, e a de cadastrados quando não há', () => {
        montar({ members: [integrante('a'), integrante('b')] })
        expect(m.hero!.totalMembers).toBe(2)
        cleanup()
        m.model = { ...modeloBase(), formerEntries: [{ slug: 'a', name: 'A' }] }
        montar({ members: [integrante('a')] })
        expect(m.hero!.totalMembers).toBe(1)
    })

    it('agência chega ao herói com nome e slug', () => {
        montar({ agency: { slug: 'jyp', ...titulo('JYP') } as never })
        expect(m.hero!.agencyName).toBe('JYP')
        expect(m.hero!.agencySlug).toBe('jyp')
        cleanup()
        montar()
        expect(m.hero!.agencyName).toBeNull()
        expect(m.hero!.agencySlug).toBeNull()
    })

    it('a barra de leitura volta para a lista de grupos', () => {
        montar()
        expect(m.reading!.backHref).toBe('/groups')
        expect(m.reading!.title).toBe('TWICE')
    })

    it('JSON-LD do MusicGroup com ano, nome em hangul e integrantes com cargo', () => {
        m.model = { ...modeloBase(), year: 2015, acf: { name_hangul: '트와이스', website: 'https://twice.jype.com' } }
        const { container } = montar({
            members: [integrante('nayeon', 'Nayeon')],
            group: grupo({ member_positions: { nayeon: ['zzz-livre', 'yyy-livre'] } }),
        })
        const ld = jsonLd(container)
        expect(ld.name).toBe('TWICE')
        expect(ld.alternateName).toBe('트와이스')
        expect(ld.foundingDate).toBe('2015')
        expect(ld.url).toMatch(/\/groups\/twice$/)
        expect(ld.sameAs).toContain('https://twice.jype.com')
        expect(ld.member).toHaveLength(1)
        expect(ld.member[0]).toMatchObject({ '@type': 'Person', name: 'Nayeon', jobTitle: 'zzz-livre, yyy-livre' })
        expect(ld.member[0].url).toMatch(/\/artists\/nayeon$/)
    })

    it('sem integrantes ou posições, o JSON-LD não inventa membros nem cargo', () => {
        const { container } = montar()
        expect(jsonLd(container).member).toBeUndefined()
        cleanup()
        const outra = montar({ members: [integrante('a')] })
        expect(jsonLd(outra.container).member[0].jobTitle).toBeUndefined()
    })

    it('ex-integrante não entra como membro no JSON-LD', () => {
        m.model = { ...modeloBase(), formerEntries: [{ slug: 'ex', name: 'Ex' }] }
        const { container } = montar({ members: [integrante('a'), integrante('ex')] })
        expect(jsonLd(container).member).toHaveLength(1)
    })

    it('registra a visita do grupo com o tipo de grupo no papel', () => {
        m.model = { ...modeloBase(), acf: { type: 'girl-group' } }
        const { container } = montar()
        const visita = JSON.parse(container.querySelector('[data-visita]')!.getAttribute('data-visita')!)
        expect(visita).toMatchObject({ slug: 'twice', nome: 'TWICE', tipo: 'grupo', foto: null })
        expect(visita.papel).toBeTruthy()
    })

    it('sem tipo, o papel da visita é nulo', () => {
        const { container } = montar()
        expect(JSON.parse(container.querySelector('[data-visita]')!.getAttribute('data-visita')!).papel).toBeNull()
    })
})

describe('GroupDetailPage — marcas e guias', () => {
    it('as marcas associadas aparecem só quando há', () => {
        const { container } = montar()
        expect(container.querySelector('[data-marcas]')).toBeNull()
        cleanup()
        const com = montar({ companyMentions: [{} as never, {} as never] })
        expect(com.container.querySelector('[data-marcas]')!.getAttribute('data-n')).toBe('2')
    })

    it('guias relacionados aparecem em português, com link para cada um', () => {
        const hubs = [
            { slug: 'g1', shortTitle: 'Guia 1', description: 'd1' },
            { slug: 'g2', shortTitle: 'Guia 2', description: 'd2' },
        ] as never
        const { container } = montar({ relatedHubs: hubs })
        const links = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'))
        expect(links).toEqual(['/guias/g1', '/guias/g2'])
        expect(container.textContent).toContain('Guia 1')
        expect(container.textContent).toContain('profile.relatedGuides')
    })

    it('sem guias, a seção não existe', () => {
        const { container } = montar()
        expect(container.textContent).not.toContain('profile.relatedGuides')
    })

    it('o quiz e o botão de voltar ao topo sempre aparecem', () => {
        const { container } = montar()
        expect(container.querySelector('[data-quiz]')).not.toBeNull()
        expect(container.querySelector('[data-scroll-top]')).not.toBeNull()
    })
})

describe.skipIf(!OUTRO)('GroupDetailPage — outro idioma', () => {
    it('os guias só existem em português', () => {
        m.locale = OUTRO as string
        const { container } = montar({ relatedHubs: [{ slug: 'g1', shortTitle: 'Guia 1', description: 'd1' }] as never })
        expect(container.textContent).not.toContain('Guia 1')
    })

    it('os links apontam para o idioma da página', () => {
        m.locale = OUTRO as string
        const { container } = montar()
        expect(jsonLd(container).url).toContain(`/${OUTRO}/`)
    })
})
