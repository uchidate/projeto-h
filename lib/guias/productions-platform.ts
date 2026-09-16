import { SITE_NAME } from '@/lib/constants/site'
import type { ArchiveHub } from './types'

export const productionsPlatformHubs: ArchiveHub[] = [
    {
        slug: 'doramas-coreanos-netflix',
        kind: 'productions',
        filter: { platform: 'netflix' },
        title: 'Doramas coreanos na Netflix',
        shortTitle: 'Doramas na Netflix',
        description: 'Descubra doramas coreanos disponíveis ou associados à Netflix, com sinopse, elenco, avaliação e links para artistas.',
        intro: [
            'A Netflix ajudou muitos doramas coreanos a chegarem a públicos que antes não acompanhavam K-Drama de perto.',
            'Este guia reúne produções coreanas ligadas à plataforma, com páginas em português para entender elenco, sinopse e contexto de cada título.',
        ],
        keywords: ['doramas netflix', 'kdramas netflix', 'doramas coreanos netflix', 'séries coreanas netflix'],
        faq: [
            { question: 'Todos os doramas deste guia estão disponíveis na Netflix?', answer: 'A disponibilidade pode variar por país e data. O guia reúne produções coreanas associadas à Netflix ou marcadas no catálogo com presença na plataforma.' },
            { question: `A ${SITE_NAME} informa onde assistir?`, answer: 'Quando há dados disponíveis, as páginas de produção mostram plataformas, elenco, sinopse e contexto editorial para ajudar na descoberta.' },
        ],
    },
    {
        slug: 'doramas-amazon-prime',
        kind: 'productions',
        filter: { platform: 'amazon-prime-video' },
        title: 'Doramas Coreanos na Amazon Prime Video',
        shortTitle: 'Doramas Prime',
        description: 'Lista dos melhores doramas coreanos disponíveis na Amazon Prime Video com perfis, sinopse e elenco em português.',
        intro: [
            'A Amazon Prime Video expandiu significativamente seu catálogo de dramas coreanos, trazendo títulos exclusivos e coproduzidos que chegam ao Brasil com legendas e dublagem.',
            `Este guia reúne as produções coreanas cadastradas na ${SITE_NAME} disponíveis na Prime Video para que você encontre facilmente o próximo dorama a assistir.`,
        ],
        keywords: ['doramas amazon prime', 'kdramas prime video', 'dorama coreano prime', 'amazon prime korea', 'doramas prime brasil'],
        faq: [
            { question: 'Amazon Prime tem doramas coreanos?', answer: 'Sim. A Amazon Prime Video tem investido em dramas coreanos originais e licenciados, disponíveis para assinantes no Brasil com legendas em português.' },
            { question: 'Quais são os melhores doramas na Amazon Prime?', answer: 'O catálogo inclui títulos variados de romance, thriller e histórico. As produções disponíveis variam por região — confira o guia para os títulos cadastrados.' },
        ],
    },
    {
        slug: 'doramas-disney-plus',
        kind: 'productions',
        filter: { platform: 'disney-plus' },
        title: 'Doramas coreanos no Disney+',
        shortTitle: 'Doramas Disney+',
        description: 'Descubra doramas coreanos disponíveis no Disney+ com sinopse, elenco, avaliação e links para artistas.',
        intro: [
            'O Disney+ entrou forte no mercado de K-Dramas com produções originais de alto orçamento e licenciamentos exclusivos que não aparecem em outras plataformas.',
            `Este guia reúne produções coreanas associadas ao Disney+ cadastradas na ${SITE_NAME}, com páginas em português para entender elenco, sinopse e contexto de cada título.`,
        ],
        keywords: ['doramas disney plus', 'kdramas disney+', 'doramas coreanos disney', 'k-drama disney plus brasil'],
        faq: [
            { question: 'O Disney+ tem doramas coreanos originais?', answer: 'Sim. O Disney+ tem investido em K-Dramas originais e exclusivos, com produções de alto orçamento que competem diretamente com as originais da Netflix.' },
            { question: `A ${SITE_NAME} informa sobre o Disney+?`, answer: 'Quando há dados disponíveis, as páginas de produção mostram plataformas, elenco, sinopse e contexto editorial para ajudar na descoberta.' },
        ],
    },
    {
        slug: 'doramas-apple-tv-plus',
        kind: 'productions',
        filter: { platform: 'apple-tv' },
        title: 'Doramas coreanos no Apple TV+',
        shortTitle: 'Doramas Apple TV+',
        description: 'Descubra doramas coreanos disponíveis no Apple TV+ com sinopse, elenco, avaliação e links para artistas.',
        intro: [
            'O Apple TV+ é uma das plataformas que tem apostado em coproduzir e licenciar K-Dramas de alta qualidade, com foco em narrativas mais maduras e produções cinematográficas.',
            `Este guia reúne produções coreanas associadas ao Apple TV+ cadastradas na ${SITE_NAME}, com páginas em português para entender elenco, sinopse e onde assistir.`,
        ],
        keywords: ['doramas apple tv plus', 'kdramas apple tv', 'doramas coreanos apple tv', 'k-drama apple tv+'],
        faq: [
            { question: 'Apple TV+ tem doramas coreanos?', answer: 'Sim. O Apple TV+ tem se associado a produções coreanas de qualidade cinematográfica, geralmente focadas em thriller, drama e narrativas com apelo global.' },
        ],
    },
    {
        slug: 'doramas-viki',
        kind: 'productions',
        filter: { platform: 'viki' },
        title: 'Doramas coreanos no Viki',
        shortTitle: 'Doramas Viki',
        description: 'Encontre doramas coreanos disponíveis no Viki com sinopse, elenco, avaliação e páginas relacionadas em português.',
        intro: [
            'O Viki é uma das plataformas mais conhecidas por fãs de K-Drama, com catálogo forte em romances, dramas históricos, comédias românticas e séries clássicas que nem sempre aparecem nos streamings generalistas.',
            `Este guia reúne produções coreanas associadas ao Viki cadastradas na ${SITE_NAME} para facilitar a descoberta de elenco, sinopse, avaliação e conteúdos relacionados.`,
        ],
        keywords: ['doramas viki', 'kdramas viki', 'doramas coreanos viki', 'onde assistir doramas viki'],
        faq: [
            { question: 'O Viki tem doramas coreanos legendados?', answer: 'Sim. O Viki é conhecido pelo catálogo de dramas asiáticos com legendas em vários idiomas, incluindo português em muitos títulos.' },
        ],
    },
    {
        slug: 'doramas-kocowa',
        kind: 'productions',
        filter: { platform: 'kocowa' },
        title: 'Doramas coreanos no Kocowa',
        shortTitle: 'Doramas Kocowa',
        description: 'Veja doramas coreanos disponíveis no Kocowa com sinopse, elenco, avaliação e contexto em português.',
        intro: [
            'O Kocowa reúne conteúdos das principais emissoras coreanas e é uma referência para quem acompanha K-Dramas, variedades e lançamentos próximos da exibição original.',
            `Este guia organiza produções coreanas associadas ao Kocowa dentro da ${SITE_NAME}, conectando páginas de doramas, elenco e artistas relacionados.`,
        ],
        keywords: ['doramas kocowa', 'kdramas kocowa', 'kocowa brasil', 'onde assistir kdramas kocowa'],
        faq: [
            { question: 'O Kocowa tem doramas coreanos?', answer: 'Sim. O Kocowa é focado em entretenimento coreano e reúne dramas, programas de variedade e outros conteúdos das principais emissoras da Coreia.' },
        ],
    },
]
