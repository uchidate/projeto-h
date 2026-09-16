// Constantes puras sem imports — seguro para Client Components

// Slugs da taxonomia production_genre (migrada do TMDB)
export const PRODUCTION_GENRE_MAP: Record<string, string> = {
    'doramas-historicos-coreanos': 'historico',
    'doramas-romanticos':          'romance',
    'doramas-acao-coreanos':       'acao',
    'doramas-thriller-coreanos':   'thriller',
    'doramas-comedia-coreanos':    'comedia',
    'doramas-fantasia-coreanos':   'fantasia',
    'doramas-terror-coreanos':     'terror',
    'doramas-suspense':            'misterio',
    'doramas-familia':             'drama',
    'doramas-escola':              'drama',
    'doramas-medicos':             'drama',
    'doramas-juridicos':           'drama',
    'doramas-policial':            'crime',
    'doramas-esportivos':          'drama',
}

// Slugs da taxonomia production_platform
export const PRODUCTION_PLATFORM_MAP: Record<string, string> = {
    'doramas-coreanos-netflix': 'netflix',
    'doramas-amazon-prime':     'amazon-prime-video',
    'doramas-disney-plus':      'disney-plus',
    'doramas-apple-tv-plus':    'apple-tv',
    'doramas-viki':             'viki',
    'doramas-kocowa':           'kocowa',
}

export const PRODUCTION_NETWORK_MAP: Record<string, string> = {
    'doramas-tvn': 'tvN',
    'doramas-sbs': 'SBS',
    'doramas-mbc': 'MBC',
    'doramas-kbs': 'KBS2',
    'doramas-jtbc': 'JTBC',
    'doramas-tving': 'TVING',
    'doramas-ocn': 'OCN',
    'doramas-ena': 'ENA',
}

export type ArtistFilter = { role?: string; gender?: 'male' | 'female' }
export const ARTIST_FILTER_MAP: Record<string, ArtistFilter> = {
    'cantoras-kpop':              { role: 'singer', gender: 'female' },
    'cantores-kpop':              { role: 'singer', gender: 'male' },
    'atrizes-coreanas':           { role: 'actress', gender: 'female' },
    'atores-coreanos':            { role: 'actor', gender: 'male' },
    'kpop-idols-famosos':         { role: 'idol' },
    'modelos-coreanas':           { role: 'model', gender: 'female' },
    'modelos-coreanos':           { role: 'model', gender: 'male' },
    'artistas-solo-kpop':         { role: 'singer' },
    'idols-que-atuam-em-doramas': { role: 'idol' },
}

export type GroupType = 'girl_group' | 'boy_group' | 'co_ed' | 'solo'
export const GROUP_TYPE_MAP: Record<string, GroupType> = {
    'grupos-femininos-kpop': 'girl_group',
    'grupos-masculinos-kpop': 'boy_group',
    'grupos-mistos-kpop': 'co_ed',
}
