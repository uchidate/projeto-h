import { SITE_NAME } from '@/lib/constants/site'
import type { ArchiveHub } from './types'

export const productionsNetworkHubs: ArchiveHub[] = [
    {
        slug: 'doramas-tvn',
        kind: 'productions',
        filter: { network: 'tvN' },
        title: 'Doramas coreanos da tvN',
        shortTitle: 'Doramas tvN',
        description: 'Descubra os melhores doramas coreanos produzidos e exibidos pela tvN, o canal de cabo mais prestigioso da Coreia do Sul.',
        intro: [
            'A tvN (tv N) é o canal de cabo mais premiado da Coreia e responsável por alguns dos maiores fenômenos do K-Drama moderno. Desde "Secret Garden" até "Crash Landing on You", a tvN definiu o padrão criativo da indústria.',
            `Este guia reúne produções coreanas exibidas ou produzidas pela tvN catalogadas na ${SITE_NAME}, com páginas de elenco, sinopse e contexto em português.`,
        ],
        keywords: ['doramas tvN', 'kdramas tvN', 'doramas canal tvN', 'melhores doramas tvN', 'tvN korea dramas'],
        faq: [
            { question: 'O que é a tvN coreana?', answer: 'A tvN é um canal de cabo premium sul-coreano pertencente ao grupo CJ ENM. É conhecida por produções de alta qualidade e é o canal de entretenimento mais assistido a cabo na Coreia.' },
            { question: 'Quais são os maiores hits da tvN?', answer: 'Alguns dos maiores sucessos da tvN incluem "Crash Landing on You", "Mr. Sunshine", "Signal", "Reply 1988", "Chicago Typewriter" e "Goblin".' },
            { question: 'Qual é a diferença entre tvN e emissoras abertas como SBS?', answer: 'A tvN é canal pago e tem mais liberdade criativa, orçamentos maiores e público adulto como alvo. SBS, KBS e MBC são emissoras abertas com foco em audiência familiar ampla.' },
        ],
    },
    {
        slug: 'doramas-sbs',
        kind: 'productions',
        filter: { network: 'SBS' },
        title: 'Doramas coreanos da SBS',
        shortTitle: 'Doramas SBS',
        description: 'Os melhores doramas coreanos da SBS, uma das maiores emissoras abertas da Coreia do Sul, com décadas de produções icônicas.',
        intro: [
            'A SBS (Seoul Broadcasting System) é uma das três grandes emissoras abertas da Coreia do Sul e tem no currículo alguns dos dramas mais assistidos da história da TV coreana.',
            `Este guia organiza as produções da SBS catalogadas na ${SITE_NAME} para que você encontre elenco, sinopse e contexto editorial de cada título.`,
        ],
        keywords: ['doramas SBS', 'kdramas SBS', 'séries coreanas SBS', 'melhores doramas SBS'],
        faq: [
            { question: 'O que é a SBS?', answer: 'A SBS (Seoul Broadcasting System) é uma das principais emissoras abertas da Coreia do Sul. Fundada em 1991, é conhecida por novelas, doramas, reality shows e programas de variedade de grande audiência.' },
            { question: 'Quais são os maiores doramas da SBS?', answer: 'A SBS tem clássicos como "Boys Over Flowers", "Heirs", "Pinocchio", "Doctors", "My Love from the Star" e "The King 2 Hearts".' },
        ],
    },
    {
        slug: 'doramas-mbc',
        kind: 'productions',
        filter: { network: 'MBC' },
        title: 'Doramas coreanos da MBC',
        shortTitle: 'Doramas MBC',
        description: 'Doramas coreanos da MBC, emissora pioneira da Coreia com décadas de clássicos, romances e produções históricas.',
        intro: [
            'A MBC (Munhwa Broadcasting Corporation) é uma das emissoras mais antigas e respeitadas da Coreia do Sul, com longa tradição em doramas de qualidade que marcaram gerações de espectadores.',
            `Este guia reúne produções da MBC catalogadas na ${SITE_NAME} com páginas de elenco, sinopse e contexto editorial.`,
        ],
        keywords: ['doramas MBC', 'kdramas MBC', 'séries coreanas MBC', 'melhores doramas MBC'],
        faq: [
            { question: 'O que é a MBC coreana?', answer: 'A MBC (Munhwa Broadcasting Corporation) é uma emissora pública de televisão da Coreia do Sul, fundada em 1961. É uma das três grandes emissoras abertas junto com KBS e SBS.' },
            { question: 'Quais são os maiores doramas da MBC?', answer: 'A MBC tem clássicos como "Princess Returning Pearl", "Jewel in the Palace", "Coffee Prince", "Queen Seondeok" e "Personal Taste".' },
        ],
    },
    {
        slug: 'doramas-kbs',
        kind: 'productions',
        filter: { network: 'KBS2' },
        title: 'Doramas coreanos da KBS',
        shortTitle: 'Doramas KBS',
        description: 'Os melhores doramas coreanos da KBS, emissora pública da Coreia do Sul com o maior catálogo de dramas da televisão coreana.',
        intro: [
            'A KBS (Korea Broadcasting System) é a emissora pública nacional da Coreia e a maior produtora de conteúdo televisivo do país.',
            `Este guia reúne produções da KBS catalogadas na ${SITE_NAME} com informações de elenco, sinopse e contexto editorial.`,
        ],
        keywords: ['doramas KBS', 'kdramas KBS', 'doramas KBS2', 'séries coreanas KBS'],
        faq: [
            { question: 'O que é a KBS?', answer: 'A KBS (Korea Broadcasting System) é a emissora pública nacional da Coreia do Sul, fundada em 1927. Opera os canais KBS1 e KBS2, e é a maior emissora do país por volume de produção.' },
            { question: 'Quais são os maiores doramas da KBS?', answer: 'Clássicos como "Winter Sonata", "Full House", "Descendants of the Sun" e "Fight My Way" são destaques da KBS.' },
        ],
    },
    {
        slug: 'doramas-jtbc',
        kind: 'productions',
        filter: { network: 'JTBC' },
        title: 'Doramas coreanos da JTBC',
        shortTitle: 'Doramas JTBC',
        description: 'Os melhores doramas coreanos da JTBC, o canal de cabo que se tornou referência em produções adultas, dramas de prestígio e histórias ousadas.',
        intro: [
            'A JTBC é um canal de cabo sul-coreano fundado em 2011 que se tornou rapidamente referência em K-Dramas de prestígio. Com foco em histórias adultas, roteiros ousados e produções cinematográficas, a JTBC consolidou seu espaço ao lado da tvN.',
            `Este guia organiza produções da JTBC catalogadas na ${SITE_NAME} com elenco, sinopse e contexto editorial em português.`,
        ],
        keywords: ['doramas JTBC', 'kdramas JTBC', 'séries coreanas JTBC', 'melhores doramas JTBC'],
        faq: [
            { question: 'O que é a JTBC?', answer: 'A JTBC é um canal de cabo sul-coreano pertencente ao grupo JoongAng, lançado em 2011. Ficou conhecida por dramas adultos de alta qualidade e coberturas jornalísticas impactantes.' },
            { question: 'Quais são os maiores doramas da JTBC?', answer: 'Destaques incluem "The World of the Married", "My Mister", "Itaewon Class", "Sky Castle" e "Juvenile Justice".' },
        ],
    },
    {
        slug: 'doramas-tving',
        kind: 'productions',
        filter: { network: 'TVING' },
        title: 'Doramas coreanos no TVING',
        shortTitle: 'Doramas TVING',
        description: 'Doramas originais e exclusivos do TVING, a principal plataforma de streaming coreana com produções de alta qualidade.',
        intro: [
            'O TVING é a principal plataforma de streaming da Coreia do Sul, operada pelo grupo CJ ENM (o mesmo da tvN e Mnet). Com crescimento acelerado, o TVING passou a investir pesado em produções originais que competem com Netflix e Disney+ em qualidade.',
            `Este guia organiza produções do TVING catalogadas na ${SITE_NAME} com informações de elenco, sinopse e contexto editorial.`,
        ],
        keywords: ['doramas TVING', 'kdramas TVING', 'TVING originais', 'streaming coreano TVING'],
        faq: [
            { question: 'O que é o TVING?', answer: 'O TVING é a maior plataforma de streaming da Coreia do Sul, pertencente ao grupo CJ ENM. Opera com assinatura e tem catálogo de doramas, variedades, filmes e conteúdo ao vivo.' },
            { question: 'TVING é relacionado à tvN?', answer: 'Sim. Ambos pertencem ao grupo CJ ENM. O TVING funciona como o braço streaming do grupo, transmitindo conteúdo ao vivo da tvN e produzindo exclusivos digitais.' },
        ],
    },
    {
        slug: 'doramas-ocn',
        kind: 'productions',
        filter: { network: 'OCN' },
        title: 'Doramas coreanos da OCN',
        shortTitle: 'Doramas OCN',
        description: 'Doramas da OCN, o canal de cabo especializado em thriller, ação, crime e sobrenatural com produções de alta intensidade.',
        intro: [
            'A OCN (On Cinema Network) é um canal de cabo sul-coreano do grupo CJ ENM especializado em conteúdo de gênero: thriller, ação, crime, sobrenatural e horror.',
            `Este guia reúne produções da OCN catalogadas na ${SITE_NAME} com elenco, sinopse e contexto editorial em português.`,
        ],
        keywords: ['doramas OCN', 'kdramas OCN', 'OCN thriller coreano', 'doramas policial OCN'],
        faq: [
            { question: 'O que é a OCN?', answer: 'A OCN (On Cinema Network) é um canal de cabo coreano do grupo CJ ENM especializado em filmes, thrillers, ação e horror. Seus doramas são conhecidos por histórias de crime, policial e suspense.' },
            { question: 'Quais são os maiores doramas da OCN?', answer: 'Destaques incluem "Voice", "Tunnel", "Signal", "Watcher" e "Save Me". A OCN é referência em K-Dramas de crime e suspense.' },
        ],
    },
    {
        slug: 'doramas-ena',
        kind: 'productions',
        filter: { network: 'ENA' },
        title: 'Doramas coreanos da ENA',
        shortTitle: 'Doramas ENA',
        description: 'Doramas da ENA, o canal que revelou "Extraordinary Attorney Woo" e se tornou referência em produções emocionantes e únicas.',
        intro: [
            'A ENA é um canal de cabo sul-coreano do grupo SK Broadband que ganhou reconhecimento global em 2022 quando "Extraordinary Attorney Woo" se tornou um fenômeno mundial no Netflix.',
            `Este guia organiza produções da ENA catalogadas na ${SITE_NAME} com elenco, sinopse e contexto editorial.`,
        ],
        keywords: ['doramas ENA', 'kdramas ENA', 'ENA canal coreano', 'Extraordinary Attorney Woo canal'],
        faq: [
            { question: 'O que é o canal ENA coreano?', answer: 'A ENA é um canal de cabo sul-coreano do grupo SK Broadband. Ganhou notoriedade internacional em 2022 com "Extraordinary Attorney Woo", que se tornou um dos dramas coreanos mais assistidos globalmente no Netflix.' },
            { question: 'Quais outros doramas vieram da ENA?', answer: '"Crash Course in Romance" e alguns thrillers são produções associadas à ENA. O catálogo ainda é menor que os grandes canais, mas crescendo em qualidade e variedade.' },
        ],
    },
]
