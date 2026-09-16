import { SITE_NAME } from '@/lib/constants/site'
import type { ArchiveHub } from './types'

export const groupsCategoriesHubs: ArchiveHub[] = [
    {
        slug: 'grupos-femininos-kpop',
        kind: 'groups',
        filter: { role: 'girl_group' },
        title: 'Grupos femininos de K-Pop',
        shortTitle: 'Girl groups',
        description: 'Conheça girl groups de K-Pop com integrantes, discografia, carreira, vídeos e perfis completos em português.',
        intro: [
            'Girl groups são um dos motores do K-Pop global, combinando conceitos visuais, coreografias, vocais e fandoms muito ativos.',
            `Aqui você encontra grupos femininos com links para integrantes, músicas, vídeos e páginas relacionadas dentro da ${SITE_NAME}.`,
        ],
        keywords: ['girl groups kpop', 'grupos femininos kpop', 'kpop feminino', 'integrantes girl group'],
        faq: [
            { question: 'O que é um girl group de K-Pop?', answer: 'É um grupo feminino da indústria coreana, normalmente formado por idols com foco em música, performance, conceitos visuais e fandom.' },
            { question: 'O guia inclui grupos ativos e inativos?', answer: `Sim. A lista pode incluir grupos ativos, inativos ou dissolvidos quando eles têm relevância cultural e perfil público na ${SITE_NAME}.` },
        ],
    },
    {
        slug: 'grupos-masculinos-kpop',
        kind: 'groups',
        filter: { role: 'boy_group' },
        title: 'Boy groups de K-Pop',
        shortTitle: 'Boy groups',
        description: 'Descubra boy groups de K-Pop com perfis de integrantes, discografia, fandom, carreira e curiosidades em português.',
        intro: [
            'Boy groups são um pilar do K-Pop: de BTS a Stray Kids, de SHINee a SEVENTEEN, cada grupo traz uma identidade própria que conecta fãs ao redor do mundo.',
            `Neste guia você encontra grupos masculinos com links para integrantes, músicas, vídeos e páginas relacionadas dentro da ${SITE_NAME}.`,
        ],
        keywords: ['boy groups kpop', 'grupos masculinos kpop', 'boy bands coreanas', 'kpop masculino', 'integrantes boy group'],
        faq: [
            { question: 'O que é um boy group de K-Pop?', answer: 'É um grupo masculino da indústria coreana, normalmente formado por idols com foco em música, dança, performance e fandom ativo.' },
            { question: 'O guia inclui grupos de todas as gerações?', answer: 'Sim. A lista pode incluir grupos ativos ou encerrados de diferentes gerações do K-Pop.' },
        ],
    },
    {
        slug: 'grupos-4a-geracao-kpop',
        kind: 'groups',
        filter: { debutYearMin: 2018, debutYearMax: 2022 },
        title: 'Grupos da 4ª geração do K-Pop: femininos e masculinos',
        shortTitle: '4ª Geração K-Pop',
        description: 'Os grupos da 4ª geração do K-Pop, com estreia entre 2018 e 2022: Stray Kids, ATEEZ, TXT, ENHYPEN, aespa, ITZY, IVE, NewJeans e LE SSERAFIM.',
        intro: [
            'A 4ª geração do K-Pop começou por volta de 2018-2019 e trouxe grupos com foco em identidade própria, lore narrativo, conexão direta com fãs via Weverse e YouTube, e uma base internacional mais sólida que nunca.',
            'ATEEZ, Stray Kids, ENHYPEN, aespa, IVE, NewJeans e Le Sserafim são alguns dos nomes que definem essa geração.',
        ],
        keywords: ['grupos 4a geracao kpop', 'kpop 4th gen', 'novos grupos kpop', 'grupos kpop 2020 2021 2022 2023'],
        faq: [
            { question: 'Quando começa a 4ª geração do K-Pop?', answer: 'A maioria dos fãs considera que a 4ª geração começou entre 2018 e 2020, com grupos como ATEEZ, TXT e Stray Kids abrindo caminho para a nova onda.' },
            { question: 'Quais são os grupos mais populares da 4ª geração?', answer: 'Stray Kids, ATEEZ, ENHYPEN, aespa, IVE, NewJeans, Le Sserafim e NMIXX estão entre os mais citados.' },
        ],
    },
    {
        slug: 'grupos-3a-geracao-kpop',
        kind: 'groups',
        filter: { debutYearMin: 2012, debutYearMax: 2017 },
        title: 'Grupos da 3ª Geração do K-Pop',
        shortTitle: '3ª Geração K-Pop',
        description: 'Os maiores grupos da 3ª geração do K-Pop com perfis em português, discografia, fandom e curiosidades.',
        intro: [
            'A 3ª geração do K-Pop (2012–2017) consolidou o gênero globalmente — BTS, EXO, BLACKPINK, TWICE e GOT7 são os nomes que transformaram o K-Pop de nicho em fenômeno de cultura pop mundial.',
            'Este guia reúne os grupos mais representativos da era que pavimentou o caminho para o sucesso do K-Pop no Ocidente.',
        ],
        keywords: ['grupos 3a geracao kpop', 'kpop 3rd gen', 'kpop 2012 2016', 'bts exo blackpink twice got7'],
        faq: [
            { question: 'Quando foi a 3ª geração do K-Pop?', answer: 'A 3ª geração é geralmente datada de 2012 a 2017, com grupos como EXO, BTS, GOT7, TWICE e BLACKPINK.' },
            { question: 'O BTS é da 3ª geração?', answer: 'Sim. BTS debutou em 2013 e é considerado o grupo mais representativo da 3ª geração.' },
        ],
    },
    {
        slug: 'grupos-kpop-decada-2000',
        kind: 'groups',
        filter: { debutYearMin: 2000, debutYearMax: 2009 },
        title: 'Grupos de K-Pop dos anos 2000',
        shortTitle: 'K-Pop anos 2000',
        description: 'Grupos de K-Pop que definiram os anos 2000: TVXQ, Super Junior, Girls\' Generation, Wonder Girls, SHINee e outros pioneiros da onda Hallyu.',
        intro: [
            'Os anos 2000 foram a era de fundação do K-Pop moderno. TVXQ, Super Junior, Girls\' Generation, Wonder Girls, SHINee e 2NE1 construíram as bases do que o K-Pop se tornaria globalmente.',
            `Este guia reúne grupos com debut e maior atividade nos anos 2000 catalogados na ${SITE_NAME}.`,
        ],
        keywords: ['grupos kpop anos 2000', 'kpop 2000s', 'tvxq super junior snsd', 'grupos kpop clássicos'],
        faq: [
            { question: 'Quais grupos definiram o K-Pop nos anos 2000?', answer: 'TVXQ, Super Junior, Girls\' Generation (SNSD), Wonder Girls, SHINee, 2NE1 e Big Bang são os grupos mais icônicos que emergiram nos anos 2000.' },
        ],
    },
    {
        slug: 'grupos-kpop-boy-groups-famosos',
        kind: 'groups',
        filter: { role: 'boy_group' },
        title: 'Boy groups de K-Pop mais famosos',
        shortTitle: 'Boy groups famosos',
        description: 'Os boy groups de K-Pop mais famosos do mundo: BTS, EXO, BIGBANG, Stray Kids, ATEEZ, TXT e os maiores nomes do K-Pop masculino.',
        intro: [
            'Os boy groups são o coração do K-Pop internacional: BTS abriu caminho, EXO dominou a Ásia, Big Bang foi pioneiro — e hoje Stray Kids, ATEEZ, TXT e NCT continuam expandindo o alcance global do K-Pop.',
            `Este guia reúne os grupos masculinos mais reconhecidos da ${SITE_NAME}.`,
        ],
        keywords: ['boy groups kpop famosos', 'grupos masculinos kpop', 'bts exo bigbang', 'melhores boy groups kpop'],
        faq: [
            { question: 'Quais são os boy groups de K-Pop mais famosos?', answer: 'BTS lidera globalmente, mas EXO, BIGBANG, Stray Kids, ATEEZ, MONSTA X, Super Junior e NCT têm fandoms imensos internacionalmente.' },
        ],
    },
]
