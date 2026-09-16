import { SITE_NAME } from '@/lib/constants/site'
import type { ArchiveHub } from './types'

export const artistsCategoriesHubs: ArchiveHub[] = [
    {
        slug: 'cantoras-kpop',
        kind: 'artists',
        filter: { role: 'singer', gender: 'female' },
        title: 'Cantoras de K-Pop',
        shortTitle: 'Cantoras K-Pop',
        description: 'Conheça cantoras de K-Pop, idols e solistas coreanas com perfis em português, carreira, grupos, músicas e curiosidades.',
        intro: [
            'As cantoras de K-Pop movimentam boa parte da cultura Hallyu: de vocalistas de grupos femininos a solistas com discografias próprias, elas conectam música, performance, moda e fandom.',
            'Este guia reúne perfis em português para descobrir artistas, navegar por grupos relacionados e encontrar trajetórias que merecem uma leitura mais profunda.',
        ],
        keywords: ['cantoras kpop', 'idols femininas', 'solistas kpop', 'cantora coreana'],
        faq: [
            { question: 'O que define uma cantora de K-Pop?', answer: `Na ${SITE_NAME}, consideramos cantoras de K-Pop artistas coreanas ou ligadas à indústria coreana que atuam como vocalistas, idols, rappers ou solistas em carreiras musicais.` },
            { question: 'Esta lista inclui integrantes de grupos?', answer: 'Sim. O guia pode incluir vocalistas e idols de grupos femininos, além de artistas com carreira solo ou atividades musicais individuais.' },
        ],
    },
    {
        slug: 'cantores-kpop',
        kind: 'artists',
        filter: { role: 'singer', gender: 'male' },
        title: 'Cantores de K-Pop',
        shortTitle: 'Cantores K-Pop',
        description: 'Conheça cantores de K-Pop, idols e solistas coreanos com perfis em português, carreira, grupos, músicas e curiosidades.',
        intro: [
            'Os cantores de K-Pop — de vocalistas a rappers, de idols a solistas — representam uma diversidade enorme de estilos, trajetórias e histórias.',
            'Este guia reúne perfis em português para descobrir artistas masculinos do K-Pop, navegar por grupos relacionados e encontrar trajetórias que merecem atenção.',
        ],
        keywords: ['cantores kpop', 'idols masculinos', 'solistas kpop masculino', 'cantor coreano'],
        faq: [
            { question: 'O guia inclui integrantes de grupos?', answer: 'Sim. O guia pode incluir vocalistas, rappers e idols de grupos masculinos, além de artistas com carreira solo ou atividades musicais individuais.' },
        ],
    },
    {
        slug: 'atrizes-coreanas',
        kind: 'artists',
        filter: { role: 'actress', gender: 'female' },
        title: 'Atrizes coreanas',
        shortTitle: 'Atrizes coreanas',
        description: 'Conheça atrizes coreanas com perfis em português, filmografia, doramas, músicas e carreira no entretenimento coreano.',
        intro: [
            'As atrizes coreanas estão no centro do fenômeno dos K-Dramas: de protagonistas de romances a vilãs complexas, elas definem boa parte da cultura Hallyu.',
            'Este guia reúne perfis em português de atrizes que aparecem em produções coreanas — incluindo idols que também atuam — para facilitar a descoberta e navegação.',
        ],
        keywords: ['atrizes coreanas', 'atriz kdrama', 'atrizes kdrama', 'atrizes k-drama'],
        faq: [
            { question: 'O guia inclui idols que atuam?', answer: 'Sim. Muitas idols do K-Pop também têm carreiras como atrizes em doramas, filmes ou produções especiais, e podem aparecer neste guia.' },
        ],
    },
    {
        slug: 'atores-coreanos',
        kind: 'artists',
        filter: { role: 'actor', gender: 'male' },
        title: 'Atores coreanos',
        shortTitle: 'Atores coreanos',
        description: 'Conheça atores coreanos com perfis em português, filmografia, doramas, carreira e curiosidades sobre o entretenimento coreano.',
        intro: [
            'Os atores coreanos conquistaram o mundo não apenas pelos K-Dramas, mas por um nível de craft que vai do romance à ação e ao drama psicológico.',
            'Este guia reúne perfis em português de atores do entretenimento coreano para facilitar a descoberta, navegação por produções e histórico de carreira.',
        ],
        keywords: ['atores coreanos', 'ator kdrama', 'atores kdrama', 'atores coreanos famosos'],
        faq: [
            { question: 'O guia inclui idols que atuam?', answer: 'Sim. Vários idols do K-Pop também atuam em doramas e filmes. Quando há perfil com produções vinculadas, eles podem aparecer neste guia.' },
        ],
    },
    {
        slug: 'kpop-idols-famosos',
        kind: 'artists',
        filter: { role: 'idol' },
        title: 'Idols de K-Pop mais famosos',
        shortTitle: 'Idols famosos',
        description: 'Conheça os idols de K-Pop mais famosos do mundo com perfis em português, carreira, grupos, músicas e curiosidades.',
        intro: [
            'O fenômeno idol coreano vai além da música: envolve treinamento rigoroso, conceitos visuais únicos, fandoms globais e uma indústria que gera bilhões por ano.',
            `Este guia reúne os idols com maior destaque na ${SITE_NAME} para facilitar a descoberta de perfis, grupos relacionados e conteúdos editoriais.`,
        ],
        keywords: ['idols kpop famosos', 'idols coreanos', 'kpop idols mais famosos', 'kpop artistas'],
        faq: [
            { question: 'O que é um idol coreano?', answer: 'Um idol coreano é um artista formado por uma agência de entretenimento que passou por anos de treinamento em canto, dança e performance antes de debutar em um grupo ou solo.' },
            { question: 'Quais são os idols mais famosos do mundo?', answer: 'Internacionalmente, os membros do BTS têm o maior alcance global, mas outros como Jennie (BLACKPINK), Karina (aespa), IU e Lisa também estão entre os mais reconhecidos fora da Coreia.' },
        ],
    },
    {
        slug: 'artistas-solo-kpop',
        kind: 'artists',
        filter: { role: 'singer' },
        title: 'Artistas solo de K-Pop',
        shortTitle: 'Solistas K-Pop',
        description: 'Explore artistas solo de K-Pop com perfis, carreira musical, discografia, vídeos e conexões com grupos coreanos.',
        intro: [
            'Carreiras solo no K-Pop ajudam fãs a acompanhar uma faceta mais autoral de idols, vocalistas, rappers e performers.',
            `Nesta seleção, a ${SITE_NAME} destaca artistas com presença musical individual, facilitando a descoberta de perfis, músicas e trajetórias fora ou além dos grupos.`,
        ],
        keywords: ['artistas solo kpop', 'solistas kpop', 'idol solo', 'cantores solo coreanos'],
        faq: [
            { question: 'O que é um artista solo de K-Pop?', answer: 'É um artista com lançamentos ou presença musical individual, seja como solista principal ou como idol que também desenvolve trabalhos fora do grupo.' },
        ],
    },
    {
        slug: 'idols-que-atuam-em-doramas',
        kind: 'artists',
        filter: { role: 'idol' },
        title: 'Idols que atuam em doramas',
        shortTitle: 'Idols atores',
        description: 'Lista de idols do K-Pop que também aparecem em doramas, filmes e séries coreanas, com perfis e filmografia em português.',
        intro: [
            'Muitos idols constroem carreiras paralelas em doramas e filmes, aproximando fãs de K-Pop do universo dos K-Dramas.',
            'Este guia organiza artistas com atividade musical e atuação, conectando perfis, grupos e produções para facilitar a navegação entre música e dramaturgia coreana.',
        ],
        keywords: ['idols atores', 'idols em doramas', 'kpop kdrama', 'cantores coreanos atores'],
        faq: [
            { question: 'Por que idols atuam em doramas?', answer: 'Muitos idols expandem a carreira para atuação por meio de dramas, filmes e séries, aproximando fandoms de K-Pop do público de K-Drama.' },
        ],
    },
    {
        slug: 'modelos-coreanas',
        kind: 'artists',
        filter: { role: 'model', gender: 'female' },
        title: 'Modelos coreanas',
        shortTitle: 'Modelos coreanas',
        description: 'Conheça modelos coreanas com perfis em português, carreira, moda, campanhas e conexões com o entretenimento coreano.',
        intro: [
            'Modelos coreanas estão cada vez mais presentes no cenário internacional, combinando beleza, estilo e influência cultural que vai além da passarela.',
            `Este guia reúne perfis de modelos com presença no catálogo da ${SITE_NAME}.`,
        ],
        keywords: ['modelos coreanas', 'modelo coreana moda', 'kpop modelo', 'modelo coreia'],
        faq: [
            { question: 'O guia inclui modelos que também são idols?', answer: 'Sim. Muitas idols do K-Pop atuam como modelos e embaixadoras de marcas de moda internacionais.' },
        ],
    },
    {
        slug: 'modelos-coreanos',
        kind: 'artists',
        filter: { role: 'model', gender: 'male' },
        title: 'Modelos coreanos',
        shortTitle: 'Modelos coreanos',
        description: 'Conheça modelos coreanos com perfis em português, carreira, moda, campanhas e conexões com o entretenimento coreano.',
        intro: [
            'Modelos coreanos conquistaram espaço em marcas de luxo internacionais, muitas vezes combinando carreira de modelo com atividades de idol ou ator.',
            `Este guia reúne perfis de modelos masculinos com presença no catálogo da ${SITE_NAME}.`,
        ],
        keywords: ['modelos coreanos', 'modelo coreano moda', 'kpop modelo masculino', 'modelo coreia homem'],
        faq: [
            { question: 'O guia inclui idols que são modelos?', answer: 'Sim. Vários idols masculinos são embaixadores de marcas de moda de luxo e podem aparecer neste guia quando têm perfil no catálogo.' },
        ],
    },
]
