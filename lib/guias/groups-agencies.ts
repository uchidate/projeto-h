import { SITE_NAME } from '@/lib/constants/site'
import type { ArchiveHub } from './types'

export const groupsAgenciesHubs: ArchiveHub[] = [
    {
        slug: 'grupos-jyp-entertainment',
        kind: 'groups',
        filter: { agencyName: 'JYP Entertainment' },
        title: 'Grupos da JYP Entertainment: TWICE, Stray Kids, ITZY e mais',
        shortTitle: 'Grupos JYP',
        description: 'Os grupos da JYP Entertainment, de Wonder Girls e 2PM a TWICE, Stray Kids, ITZY e NMIXX, com integrantes, carreira e discografia em português.',
        intro: [
            'A JYP Entertainment revelou alguns dos grupos mais populares do K-Pop, com forte presença em girl groups, boy groups e bandas que alcançaram públicos internacionais.',
            `Este guia reúne grupos da JYP cadastrados na ${SITE_NAME} para facilitar a navegação por integrantes, carreira, músicas e conteúdos relacionados.`,
        ],
        keywords: ['grupos jyp entertainment', 'jyp grupos kpop', 'twice stray kids itzy', 'grupos da jyp'],
        faq: [
            { question: 'Quais grupos são da JYP Entertainment?', answer: 'A JYP é conhecida por grupos como TWICE, Stray Kids, ITZY, 2PM, Wonder Girls, miss A, GOT7 e Day6, entre outros.' },
        ],
    },
    {
        slug: 'grupos-sm-entertainment',
        kind: 'groups',
        filter: { agencyName: 'SM Entertainment' },
        title: 'Grupos da SM Entertainment',
        shortTitle: 'Grupos SM',
        description: 'Explore grupos da SM Entertainment com integrantes, carreira, discografia e perfis completos em português.',
        intro: [
            'A SM Entertainment é uma das empresas que moldaram o K-Pop moderno, com grupos que marcaram diferentes gerações e expandiram o gênero para fora da Coreia.',
            `Este guia organiza grupos da SM na ${SITE_NAME} para conectar páginas de integrantes, músicas, vídeos e contexto histórico.`,
        ],
        keywords: ['grupos sm entertainment', 'sm grupos kpop', 'exo nct aespa red velvet', 'grupos da sm'],
        faq: [
            { question: 'Quais são os grupos mais conhecidos da SM?', answer: 'EXO, NCT, aespa, Red Velvet, SHINee, Girls\' Generation, Super Junior e TVXQ estão entre os nomes mais conhecidos da SM.' },
        ],
    },
    {
        slug: 'grupos-yg-entertainment',
        kind: 'groups',
        filter: { agencyName: 'YG Entertainment' },
        title: 'Grupos da YG Entertainment',
        shortTitle: 'Grupos YG',
        description: 'Veja grupos da YG Entertainment com integrantes, carreira, hits, vídeos e perfis em português.',
        intro: [
            'A YG Entertainment é associada a um estilo mais urbano e hip-hop dentro do K-Pop, com grupos que ajudaram a definir a presença global do gênero.',
            `Este guia reúne grupos da YG cadastrados na ${SITE_NAME}, conectando páginas de integrantes, discografia e conteúdos relacionados.`,
        ],
        keywords: ['grupos yg entertainment', 'yg grupos kpop', 'blackpink bigbang 2ne1 treasure', 'grupos da yg'],
        faq: [
            { question: 'Quais grupos são da YG Entertainment?', answer: 'BLACKPINK, BIGBANG, 2NE1, WINNER, iKON, TREASURE e BABYMONSTER estão entre os principais grupos associados à YG.' },
        ],
    },
    {
        slug: 'grupos-hybe',
        kind: 'groups',
        filter: { agencyName: 'BIGHIT MUSIC' },
        title: 'Grupos da HYBE e Big Hit Music',
        shortTitle: 'Grupos HYBE',
        description: 'Conheça grupos da HYBE e Big Hit Music com integrantes, carreira, discografia e perfis em português.',
        intro: [
            'A HYBE transformou o K-Pop globalmente a partir do sucesso do BTS e expandiu seu ecossistema com labels e grupos voltados para públicos internacionais.',
            `Este guia reúne grupos ligados à Big Hit Music cadastrados na ${SITE_NAME}, com navegação para integrantes, músicas e páginas relacionadas.`,
        ],
        keywords: ['grupos hybe', 'grupos big hit music', 'bts txt hybe', 'hybe kpop grupos'],
        faq: [
            { question: 'HYBE e Big Hit Music são a mesma coisa?', answer: 'A Big Hit Entertainment virou HYBE como grupo corporativo; Big Hit Music segue como label responsável por artistas como BTS e TXT.' },
        ],
    },
    {
        slug: 'grupos-starship-entertainment',
        kind: 'groups',
        filter: { agencyName: 'Starship Entertainment' },
        title: 'Grupos da Starship Entertainment',
        shortTitle: 'Grupos Starship',
        description: 'Descubra grupos da Starship Entertainment com integrantes, carreira, músicas e perfis em português.',
        intro: [
            'A Starship Entertainment construiu uma identidade forte no K-Pop com grupos femininos e masculinos reconhecidos por performance, vocais e hits de grande alcance.',
            `Este guia reúne grupos da Starship cadastrados na ${SITE_NAME} para facilitar a descoberta de integrantes, discografia e conteúdos relacionados.`,
        ],
        keywords: ['grupos starship entertainment', 'starship grupos kpop', 'ive monsta x sistar cravity', 'grupos da starship'],
        faq: [
            { question: 'Quais grupos são da Starship?', answer: 'IVE, MONSTA X, SISTAR, WJSN e CRAVITY estão entre os grupos mais conhecidos associados à Starship Entertainment.' },
        ],
    },
    {
        slug: 'grupos-cube-entertainment',
        kind: 'groups',
        filter: { agencyName: 'Cube Entertainment' },
        title: 'Grupos da Cube Entertainment',
        shortTitle: 'Grupos Cube',
        description: 'Veja grupos da Cube Entertainment com integrantes, carreira, discografia, vídeos e perfis em português.',
        intro: [
            'A Cube Entertainment revelou grupos com forte identidade criativa, de idols produtores a girl groups que marcaram tendências no K-Pop.',
            `Este guia organiza grupos da Cube cadastrados na ${SITE_NAME}, conectando páginas de integrantes, músicas e histórico de carreira.`,
        ],
        keywords: ['grupos cube entertainment', 'cube grupos kpop', 'gidle btob clc pentagon', 'grupos da cube'],
        faq: [
            { question: 'Quais grupos são da Cube Entertainment?', answer: '(G)I-DLE, BTOB, PENTAGON, CLC e 4Minute estão entre os nomes mais conhecidos da Cube.' },
        ],
    },
]
