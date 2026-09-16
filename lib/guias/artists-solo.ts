import type { ArchiveHub } from './types'

export const artistsSoloHubs: ArchiveHub[] = [
    {
        slug: 'iu',
        kind: 'artists',
        filter: {},
        title: 'IU — Lee Ji-eun',
        shortTitle: 'IU',
        description: 'Perfil completo de IU (Lee Ji-eun): discografia, carreiras solo, dramas, conquistas e curiosidades sobre a mais amada solista do K-Pop.',
        intro: [
            'IU (이유), nome real Lee Ji-eun, é considerada a princesa do K-Pop coreano. Debutou em 2008 pela LOEN Entertainment e construiu uma das carreiras mais longas e consistentes do pop coreano.',
            'Além de cantora, IU é atriz aclamada — seu papel em "My Mister" (2018) e "Hotel Del Luna" (2019) a consagrou como uma das artistas mais versáteis da Coreia.',
        ],
        keywords: ['IU', 'Lee Ji-eun', 'IU discografia', 'IU dramas', 'IU kpop solista', 'princesa kpop'],
        faq: [
            { question: 'Qual é o nome real de IU?', answer: 'O nome real de IU é Lee Ji-eun (이지은). O pseudônimo "IU" representa a ideia de "I" e "You" conectados pela música.' },
            { question: 'IU faz parte de algum grupo?', answer: 'Não. IU sempre teve carreira exclusivamente solo desde seu debut em 2008.' },
            { question: 'Quais são os maiores hits de IU?', answer: 'Alguns dos maiores hits de IU incluem "Good Day" (2010), "You and I" (2011), "Palette" (2017), "BBIBBI" (2018), "Blueming" (2019) e "Celebrity" (2021).' },
        ],
    },
    {
        slug: 'taeyeon',
        kind: 'artists',
        filter: { groupSlug: 'girls-generation' },
        title: 'Taeyeon — SNSD',
        shortTitle: 'Taeyeon',
        description: 'Perfil completo de Taeyeon: carreira solo, álbuns, liderança do SNSD/Girls Generation, conquistas e discografia.',
        intro: [
            'Kim Taeyeon é a líder e vocalista principal do SNSD (Girls\' Generation) e uma das solistas de K-Pop mais aclamadas. Debutou em 2007 com o SNSD e iniciou carreira solo em 2015.',
            'Com uma voz reconhecida como uma das melhores do K-Pop, Taeyeon lançou álbuns aclamados e trilhou uma carreira solo robusta paralelamente ao SNSD.',
        ],
        keywords: ['Taeyeon', 'Kim Taeyeon', 'SNSD Taeyeon', 'Taeyeon solo', 'Girls Generation líder', 'Taeyeon discografia'],
        faq: [
            { question: 'Taeyeon faz parte do SNSD?', answer: 'Sim. Taeyeon é a líder e vocalista principal do SNSD (Girls\' Generation). Ela também tem uma extensa carreira solo iniciada em 2015.' },
            { question: 'Quais são os maiores hits solo de Taeyeon?', answer: 'Os maiores hits de Taeyeon incluem "I" (2015), "Fine" (2017), "Four Seasons" (2019), "INVU" (2022) e "To the Moon" (2018).' },
        ],
    },
    {
        slug: 'g-dragon',
        kind: 'artists',
        filter: { groupSlug: 'bigbang' },
        title: 'G-Dragon — BIGBANG',
        shortTitle: 'G-Dragon',
        description: 'Perfil completo de G-Dragon: carreira solo, álbuns, liderança do BIGBANG, influência na moda e conquistas no K-Pop.',
        intro: [
            'Kwon Ji-yong, conhecido como G-Dragon, é o líder e principal criador do BIGBANG. É amplamente considerado um dos maiores artistas do K-Pop de todos os tempos, tanto pela música quanto pela influência na moda.',
            'Com uma carreira solo que inclui os icônicos álbuns "Heartbreaker" (2009) e "One of a Kind" (2012), G-Dragon redefiniu os limites do pop coreano.',
        ],
        keywords: ['G-Dragon', 'GD', 'BIGBANG G-Dragon', 'G-Dragon solo', 'Kwon Jiyong', 'G-Dragon discografia'],
        faq: [
            { question: 'G-Dragon faz parte do BIGBANG?', answer: 'Sim. G-Dragon é o líder e principal compositor do BIGBANG.' },
            { question: 'Qual é o nome real de G-Dragon?', answer: 'O nome real de G-Dragon é Kwon Ji-yong (권지용).' },
        ],
    },
    {
        slug: 'hyuna',
        kind: 'artists',
        filter: {},
        title: 'HyunA',
        shortTitle: 'HyunA',
        description: 'Perfil completo de HyunA: carreira solo, ex-4Minute e ex-Wonder Girls, hits icônicos, estilo e discografia.',
        intro: [
            'Kim Hyun-ah, conhecida como HyunA, é uma das artistas femininas mais ousadas e influentes do K-Pop. Ex-membro do 4Minute e das Wonder Girls, HyunA construiu uma das carreiras solo mais consistentes entre as idols de sua geração.',
            '"Bubble Pop!" (2011) e "Red" (2013) se tornaram clássicos do pop coreano.',
        ],
        keywords: ['HyunA', 'Kim Hyuna', 'HyunA solo', '4Minute HyunA', 'Bubble Pop', 'HyunA discografia'],
        faq: [
            { question: 'HyunA foi membro de algum grupo?', answer: 'Sim. HyunA foi membro fundador do 4Minute (2009-2016) e teve uma participação breve nas Wonder Girls.' },
        ],
    },
    {
        slug: 'jungkook',
        kind: 'artists',
        filter: { groupSlug: 'bts' },
        title: 'Jungkook — BTS',
        shortTitle: 'Jungkook',
        description: 'Perfil completo de Jungkook: carreira solo, álbum "GOLDEN", hits "Seven" e "Standing Next to You", conquistas históricas no K-Pop.',
        intro: [
            'Jeon Jungkook é o maknae (caçula) do BTS e um dos artistas solo mais bem-sucedidos da Coreia. Seu single "Seven" (2023, feat. Latto) se tornou o primeiro lançamento de um artista solo coreano a chegar ao #1 da Billboard Hot 100.',
        ],
        keywords: ['Jungkook', 'Jeon Jungkook', 'Jungkook BTS', 'Jungkook solo', 'Seven Jungkook', 'Golden álbum'],
        faq: [
            { question: 'Jungkook ainda faz parte do BTS?', answer: 'Sim. Jungkook é membro do BTS desde o debut em 2013.' },
            { question: 'Quais são os maiores hits solo de Jungkook?', answer: 'Os maiores hits solo incluem "Seven" (2023, #1 Billboard Hot 100), "Standing Next to You" (2023) e "3D" (feat. Jack Harlow, 2023).' },
        ],
    },
    {
        slug: 'rose-blackpink',
        kind: 'artists',
        filter: { groupSlug: 'blackpink' },
        title: 'Rosé — BLACKPINK',
        shortTitle: 'Rosé (BLACKPINK)',
        description: 'Perfil completo de Rosé: vocalista do BLACKPINK, álbum solo "rosie", hits "On The Ground" e "APT.", carreira internacional.',
        intro: [
            'Roseanne Park, conhecida como Rosé, é a principal vocalista do BLACKPINK e uma das artistas de K-Pop com maior projeção internacional.',
            'Em 2024, Rosé lançou seu álbum solo "rosie", incluindo o megahit "APT." em colaboração com Bruno Mars, que se tornou um dos maiores sucessos globais do K-Pop.',
        ],
        keywords: ['Rosé BLACKPINK', 'Roseanne Park', 'Rosé solo', 'APT Rosé Bruno Mars', 'rosie álbum'],
        faq: [
            { question: 'Quais são os maiores hits de Rosé?', answer: 'Os maiores hits de Rosé incluem "On The Ground" (2021), "Gone" (2021) e "APT." (feat. Bruno Mars, 2024).' },
        ],
    },
    {
        slug: 'jennie',
        kind: 'artists',
        filter: { groupSlug: 'blackpink' },
        title: 'Jennie — BLACKPINK',
        shortTitle: 'Jennie (BLACKPINK)',
        description: 'Perfil completo de Jennie: rapper e vocalista do BLACKPINK, carreira solo, hits "SOLO" e "Mantra", ícone de moda global.',
        intro: [
            'Jennie Kim é rapper e vocalista do BLACKPINK e uma das artistas de K-Pop mais influentes no mercado global. Conhecida por sua presença de palco magnética e versatilidade estilística.',
            'Em 2024, Jennie lançou o single "Mantra" pela sua própria gravadora OA (Odd Atelier), marcando uma nova fase de independência artística.',
        ],
        keywords: ['Jennie BLACKPINK', 'Jennie Kim', 'Jennie solo', 'SOLO Jennie', 'Mantra Jennie', 'Jennie Chanel'],
        faq: [
            { question: 'Jennie tem gravadora própria?', answer: 'Sim. Em 2024, Jennie fundou a OA (Odd Atelier), sua própria gravadora.' },
        ],
    },
    {
        slug: 'lisa-blackpink',
        kind: 'artists',
        filter: { groupSlug: 'blackpink' },
        title: 'Lisa — BLACKPINK',
        shortTitle: 'Lisa (BLACKPINK)',
        description: 'Perfil completo de Lisa: main dancer do BLACKPINK, hits "LALISA" e "MONEY", carreira solo e ícone global de dança.',
        intro: [
            'Lalisa Manoban, conhecida como Lisa, é a principal dançarina e rapper do BLACKPINK, além de um fenômeno global com uma das maiores bases de fãs individuais do K-Pop. Nascida na Tailândia.',
            'Em 2024, Lisa assinou com a RCA Records nos EUA e lançou o aclamado single "Rockstar".',
        ],
        keywords: ['Lisa BLACKPINK', 'Lalisa Manoban', 'Lisa solo', 'LALISA', 'MONEY Lisa', 'Rockstar Lisa'],
        faq: [
            { question: 'Lisa é tailandesa?', answer: 'Sim. Lisa nasceu em Buriram, Tailândia, e é a primeira artista tailandesa a ter uma carreira de sucesso como idol de K-Pop.' },
        ],
    },
    {
        slug: 'jisoo',
        kind: 'artists',
        filter: { groupSlug: 'blackpink' },
        title: 'Jisoo — BLACKPINK',
        shortTitle: 'Jisoo (BLACKPINK)',
        description: 'Perfil completo de Jisoo: vocalista e visual do BLACKPINK, álbum solo "ME", atriz em "Snowdrop", ícone de beleza.',
        intro: [
            'Kim Ji-soo, conhecida como Jisoo, é a vocalista e visual do BLACKPINK, sendo a mais velha do grupo.',
            'Além da música, Jisoo é atriz — estrelou o dorama "Snowdrop" (2021-2022) ao lado de Jung Hae-in.',
        ],
        keywords: ['Jisoo BLACKPINK', 'Kim Jisoo', 'Jisoo solo', 'Flower Jisoo', 'ME álbum Jisoo', 'Jisoo Dior'],
        faq: [
            { question: 'Jisoo atua em doramas?', answer: 'Sim. Jisoo estrelou o dorama "Snowdrop" (2021-2022) na Disney+, ao lado de Jung Hae-in.' },
        ],
    },
    {
        slug: 'karina-aespa',
        kind: 'artists',
        filter: { groupSlug: 'aespa' },
        title: 'Karina — aespa',
        shortTitle: 'Karina (aespa)',
        description: 'Perfil completo de Karina da aespa: líder e centro do grupo, ícone de beleza da 4ª geração do K-Pop.',
        intro: [
            'Yoo Ji-min, conhecida como Karina, é a líder e uma das principais faces da aespa. Considerada um dos maiores ícones visuais e de moda da quarta geração do K-Pop.',
        ],
        keywords: ['Karina aespa', 'Karina idol', 'Karina 4ª geração kpop', 'Yoo Jimin aespa'],
        faq: [
            { question: 'Por que Karina é tão famosa no K-Pop?', answer: 'Karina é conhecida pela combinação de visual impactante, técnica de dança, presença de palco e personalidade que ressoa especialmente com fãs da 4ª geração.' },
        ],
    },
    {
        slug: 'wonyoung-ive',
        kind: 'artists',
        filter: { groupSlug: 'ive' },
        title: 'Wonyoung — IVE',
        shortTitle: 'Wonyoung (IVE)',
        description: 'Perfil completo de Wonyoung do IVE: centro do grupo, ícone de moda, embaixadora de marcas e carreira no K-Pop.',
        intro: [
            'Jang Wonyoung é o centro e visual do IVE, além de uma das mais jovens líderes de tendência do K-Pop atual.',
        ],
        keywords: ['Wonyoung IVE', 'Jang Wonyoung', 'IVE Wonyoung', 'Wonyoung kpop'],
        faq: [
            { question: 'Wonyoung foi do IZ*ONE?', answer: 'Sim. Antes do IVE, Wonyoung participou do IZ*ONE (2018–2021).' },
        ],
    },
    {
        slug: 'jimin-bts',
        kind: 'artists',
        filter: { groupSlug: 'bts' },
        title: 'Jimin — BTS',
        shortTitle: 'Jimin (BTS)',
        description: 'Perfil completo de Jimin do BTS: álbum solo "FACE", hit global "Like Crazy", carreira individual, danças icônicas e curiosidades.',
        intro: [
            'Park Jimin é vocalista e dançarino principal do BTS. Em 2023, seu álbum solo "FACE" estreou no #1 da Billboard Hot 100 com "Like Crazy", tornando-o o primeiro cantor solo coreano a atingir o topo da parada americana.',
        ],
        keywords: ['Jimin BTS', 'Jimin kpop', 'Park Jimin', 'FACE Jimin', 'Like Crazy Jimin'],
        faq: [
            { question: 'Qual é o álbum solo de Jimin?', answer: '"FACE" (2023) é o primeiro álbum solo de Jimin, com o hit "Like Crazy" que alcançou o #1 na Billboard Hot 100.' },
        ],
    },
]
