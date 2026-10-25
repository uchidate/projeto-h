import { SITE_NAME } from '@/lib/constants/site'
import type { ArchiveHub } from './types'

export const productionsNetworkHubs: ArchiveHub[] = [
    {
        slug: 'doramas-tvn',
        kind: 'productions',
        filter: { network: 'tvN' },
        title: 'Doramas coreanos da tvN',
        shortTitle: 'Doramas tvN',
        description: 'Doramas da tvN, canal a cabo do grupo CJ ENM, com elenco, sinopse e onde assistir.',
        intro: [
            'A tvN é um canal a cabo sul-coreano do grupo CJ ENM, no ar desde 2006. No catálogo estão, entre outras, Signal (2016), Stranger (2017), Pousando no Amor (2019), Tudo Bem Não Ser Normal (2020) e Vincenzo (2021).',
            'A lista abaixo segue a ordem de interesse recente.',
        ],
        keywords: ['doramas tvN', 'kdramas tvN', 'doramas canal tvN', 'tvN korea dramas'],
        faq: [
            { question: 'O que é a tvN?', answer: 'Canal a cabo sul-coreano do grupo CJ ENM, no ar desde 2006.' },
            { question: 'Que séries da tvN estão no catálogo?', answer: 'Entre outras, Signal (2016), Stranger (2017), Pousando no Amor (2019), Tudo Bem Não Ser Normal (2020) e Vincenzo (2021). A lista da página mostra o restante, do mais recente ao mais antigo.' },
            { question: 'Qual a diferença entre a tvN e emissoras abertas como a SBS?', answer: 'A tvN é um canal a cabo; KBS, MBC e SBS são as três grandes emissoras abertas. Os dois tipos exibem séries, e a diferença está na forma de distribuição.' },
        ],
    },
    {
        slug: 'doramas-sbs',
        kind: 'productions',
        filter: { network: 'SBS' },
        title: 'Doramas coreanos da SBS',
        shortTitle: 'Doramas SBS',
        description: 'Doramas da SBS, uma das três grandes emissoras abertas da Coreia do Sul, com elenco, sinopse e onde assistir.',
        intro: [
            'A SBS (Seoul Broadcasting System) é uma das três grandes emissoras abertas da Coreia do Sul, ao lado da KBS e da MBC. No catálogo, Jardim Secreto (2010) é uma das séries da emissora.',
            'A lista abaixo segue a ordem de interesse recente.',
        ],
        keywords: ['doramas SBS', 'kdramas SBS', 'séries coreanas SBS', 'melhores doramas SBS'],
        faq: [
            { question: 'O que é a SBS?', answer: 'Seoul Broadcasting System, uma das três grandes emissoras abertas da Coreia do Sul, ao lado da KBS e da MBC.' },
            { question: 'Que séries da SBS estão no catálogo?', answer: 'Entre outras, Jardim Secreto (2010) e as produções recentes listadas na página, do mais recente ao mais antigo.' },
        ],
    },
    {
        slug: 'doramas-mbc',
        kind: 'productions',
        filter: { network: 'MBC' },
        title: 'Doramas coreanos da MBC',
        shortTitle: 'Doramas MBC',
        description: 'Doramas da MBC, uma das três grandes emissoras abertas da Coreia do Sul, com elenco, sinopse e onde assistir.',
        intro: [
            'A MBC (Munhwa Broadcasting Corporation) é uma das três grandes emissoras abertas da Coreia do Sul. No catálogo, as produções mais recentes incluem Na Sua Melhor Fase e O Retorno do Juiz (2026).',
            'A lista abaixo segue a ordem de interesse recente.',
        ],
        keywords: ['doramas MBC', 'kdramas MBC', 'séries coreanas MBC', 'melhores doramas MBC'],
        faq: [
            { question: 'O que é a MBC?', answer: 'Munhwa Broadcasting Corporation, uma das três grandes emissoras abertas da Coreia do Sul, ao lado da KBS e da SBS.' },
            { question: 'Que séries da MBC estão no catálogo?', answer: 'Entre as mais recentes, Na Sua Melhor Fase e O Retorno do Juiz (2026). A lista da página mostra as demais.' },
        ],
    },
    {
        slug: 'doramas-kbs',
        kind: 'productions',
        filter: { network: 'KBS2' },
        title: 'Doramas coreanos da KBS',
        shortTitle: 'Doramas KBS',
        description: 'Doramas da KBS, a emissora pública da Coreia do Sul, com elenco, sinopse e onde assistir.',
        intro: [
            'A KBS (Korea Broadcasting System) é a emissora pública da Coreia do Sul. No catálogo, as séries aparecem como KBS2, e Descendentes do Sol (2016) é uma delas.',
            'A lista abaixo segue a ordem de interesse recente.',
        ],
        keywords: ['doramas KBS', 'kdramas KBS', 'doramas KBS2', 'séries coreanas KBS'],
        faq: [
            { question: 'O que é a KBS?', answer: 'Korea Broadcasting System, a emissora pública da Coreia do Sul. As séries do catálogo constam como KBS2, o canal que as exibe.' },
            { question: 'Que séries da KBS estão no catálogo?', answer: 'Entre outras, Descendentes do Sol (2016) e as produções recentes listadas na página.' },
        ],
    },
    {
        slug: 'doramas-jtbc',
        kind: 'productions',
        filter: { network: 'JTBC' },
        title: 'Doramas coreanos da JTBC',
        shortTitle: 'Doramas JTBC',
        description: 'Doramas da JTBC, canal a cabo sul-coreano lançado em 2011, com elenco, sinopse e onde assistir.',
        intro: [
            'A JTBC é um canal a cabo sul-coreano lançado em 2011 pelo grupo JoongAng. No catálogo estão, entre outras, Além do Direito e Um Bom Garoto (2025).',
            'A lista abaixo segue a ordem de interesse recente.',
        ],
        keywords: ['doramas JTBC', 'kdramas JTBC', 'séries coreanas JTBC', 'melhores doramas JTBC'],
        faq: [
            { question: 'O que é a JTBC?', answer: 'Canal a cabo sul-coreano lançado em 2011 pelo grupo JoongAng.' },
            { question: 'Que séries da JTBC estão no catálogo?', answer: 'Entre as mais recentes, Além do Direito e Um Bom Garoto (2025). A lista da página mostra as demais.' },
        ],
    },
    {
        slug: 'doramas-tving',
        kind: 'productions',
        filter: { network: 'TVING' },
        title: 'Doramas coreanos no TVING',
        shortTitle: 'Doramas TVING',
        description: 'Doramas do TVING, serviço de streaming sul-coreano do grupo CJ ENM, com elenco, sinopse e onde assistir.',
        intro: [
            'O TVING é um serviço de streaming sul-coreano do grupo CJ ENM. No catálogo estão, entre outras, Dedos Espirituais, Grupo de Estudos e Street Food Vendor (2025).',
            'A lista abaixo segue a ordem de interesse recente.',
        ],
        keywords: ['doramas TVING', 'kdramas TVING', 'TVING originais', 'streaming coreano TVING'],
        faq: [
            { question: 'O que é o TVING?', answer: 'Serviço de streaming sul-coreano do grupo CJ ENM.' },
            { question: 'O TVING tem relação com a tvN?', answer: 'Sim. Os dois pertencem ao grupo CJ ENM.' },
        ],
    },
    {
        slug: 'doramas-ocn',
        kind: 'productions',
        filter: { network: 'OCN' },
        title: 'Doramas coreanos da OCN',
        shortTitle: 'Doramas OCN',
        description: 'Doramas da OCN, canal a cabo do grupo CJ ENM com séries de crime, suspense e sobrenatural.',
        intro: [
            'A OCN é um canal a cabo do grupo CJ ENM. No catálogo, as séries da emissora são de crime, suspense e sobrenatural, como Túnel e Salve-Me (2017), Life on Mars (2018) e Caçadores de Demônios (2020).',
            'A lista abaixo segue a ordem de interesse recente.',
        ],
        keywords: ['doramas OCN', 'kdramas OCN', 'OCN thriller coreano', 'doramas policial OCN'],
        faq: [
            { question: 'O que é a OCN?', answer: 'Canal a cabo sul-coreano do grupo CJ ENM.' },
            { question: 'Que séries da OCN estão no catálogo?', answer: 'Entre outras, Túnel e Salve-Me (2017), Life on Mars (2018), O Inferno São as Pessoas (2019) e Caçadores de Demônios (2020).' },
        ],
    },
    {
        slug: 'doramas-ena',
        kind: 'productions',
        filter: { network: 'ENA' },
        title: 'Doramas coreanos da ENA',
        shortTitle: 'Doramas ENA',
        description: 'Doramas da ENA, canal a cabo sul-coreano do grupo SK Broadband, com elenco, sinopse e onde assistir.',
        intro: [
            'A ENA é um canal a cabo sul-coreano do grupo SK Broadband. No catálogo estão, entre outras, Uma Advogada Extraordinária (2022) e Honour (2026).',
            'A lista abaixo segue a ordem de interesse recente.',
        ],
        keywords: ['doramas ENA', 'kdramas ENA', 'ENA canal coreano', 'Extraordinary Attorney Woo canal'],
        faq: [
            { question: 'O que é a ENA?', answer: 'Canal a cabo sul-coreano do grupo SK Broadband.' },
            { question: 'Que séries da ENA estão no catálogo?', answer: 'Entre outras, Uma Advogada Extraordinária (2022) e Honour (2026). A lista da página mostra as demais.' },
        ],
    },
]
