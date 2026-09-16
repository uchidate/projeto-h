import { WP_API_NAMESPACE } from '@/lib/constants/identidade.mjs'
import { WP_API_URL } from './config'

export type SiteLink = {
    label: string
    href: string
}

export type FooterColumn = {
    heading: string
    links: SiteLink[]
}

export type SiteSettings = {
    tagline: string
    logoSubtitles: string[]
    tickerEnabled: boolean
    navigation: SiteLink[]
    footerColumns: FooterColumn[]
    home: HomeSettings
    productions: ProductionSettings
    bestOfLists: BestOfList[]
    cultureGuides: BestOfList[]
    blogCategories: BlogCategory[]
    googleTag: string | null
}

export type HomeHub = {
    label: string
    href: string
    hangul: string
    detail: string
    color: string
}

export type HomeSettings = {
    heroPostId: number
    highlightPostIds: number[]
    featuredGroupIds: number[]
    hubs: HomeHub[]
    featuredArtistSlug: string
    featuredArtistNote: string
}

export type ProductionSettings = {
    featuredIds: number[]
}

export type BestOfList = {
    label: string
    href: string
    emoji: string
}

export type BlogCategory = {
    label: string
    slug: string
    count: number
}

const DEFAULT_HOME_HUBS: HomeHub[] = [
    { label: 'K-Drama', href: '/blog?category=k-drama', hangul: '드라마', detail: 'séries coreanas', color: '#e91e8c' },
    { label: 'K-Pop', href: '/blog?category=k-pop', hangul: '케이팝', detail: 'música e grupos', color: '#7c3aed' },
    { label: 'K-Film', href: '/blog?category=k-film', hangul: '영화', detail: 'cinema coreano', color: '#0284c7' },
    { label: 'Cultura', href: '/blog?category=cultura', hangul: '문화', detail: 'tradição e pop', color: '#16a34a' },
    { label: 'Grupos', href: '/blog?category=grupos', hangul: '그룹', detail: 'bandas e eras', color: '#d97706' },
    { label: 'K-Beauty', href: '/blog?category=k-beauty', hangul: '뷰티', detail: 'beleza coreana', color: '#db2777' },
]

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
    tagline: 'K-Drama, K-Pop e cultura coreana em português.',
    logoSubtitles: [
        'k-pop · k-drama · cultura coreana, em português',
        'artistas · grupos · produções',
        'tendências · notícias · guias',
        'tudo sobre o universo hallyu',
    ],
    tickerEnabled: true,
    /*
     * Ordem por acervo e intenção, não por hábito. Produções (3.973) e Artistas
     * (3.322) são quase todo o catálogo e a maior porta de entrada da busca —
     * estavam em 6º e 4º.
     *
     * Fora da lista, de propósito:
     * - "Guias": é índice de índices, meta-navegação ocupando lugar de destino.
     *   Virou faixa no topo de /blog, onde a intenção de descoberta já está.
     * - "Loja": comércio, não conteúdo. Virou botão próprio no cabeçalho, ao
     *   lado do login (ver NavBar) — a NavBar filtra /loja desta lista para o
     *   item não aparecer duas vezes.
     *
     * Fandoms entrou porque a página existe e está populada, mas não era
     * alcançável de lugar nenhum além da ficha de cada grupo.
     */
    navigation: [
        { label: 'Início', href: '/' },
        { label: 'Produções', href: '/productions' },
        { label: 'Artistas', href: '/artists' },
        { label: 'Grupos', href: '/groups' },
        { label: 'Fandoms', href: '/fandoms' },
        { label: 'Artigos', href: '/blog' },
        { label: 'Calendário', href: '/calendario' },
        { label: 'Quiz', href: '/quiz' },
    ],
    footerColumns: [
        {
            heading: 'Catálogo',
            links: [
                { label: 'Doramas & Filmes', href: '/productions' },
                { label: 'Artistas', href: '/artists' },
                { label: 'Grupos K-Pop', href: '/groups' },
                { label: 'Agências', href: '/agencies' },
                { label: 'Aniversariantes', href: '/artists/birthdays' },
                { label: 'Calendário', href: '/calendario' },
            ],
        },
        {
            heading: 'Listas',
            links: [
                { label: 'Melhores Doramas', href: '/guias/melhores-doramas-de-todos-os-tempos' },
                { label: 'K-Dramas de Romance', href: '/guias/doramas-romanticos' },
                { label: 'K-Dramas de Ação', href: '/guias/doramas-acao-coreanos' },
                { label: 'Filmes Coreanos', href: '/guias/filmes-coreanos' },
            ],
        },
        {
            heading: 'Conteúdo',
            links: [
                { label: 'Blog', href: '/blog' },
                { label: 'K-Drama', href: '/blog?category=k-drama' },
                { label: 'K-Pop', href: '/blog?category=k-pop' },
                { label: 'Guias', href: '/blog?category=guias' },
            ],
        },
        {
            heading: 'Sobre',
            links: [
                { label: 'Sobre nós', href: '/about' },
                { label: 'Contato', href: '/contato' },
                { label: 'Privacidade', href: '/privacidade' },
                { label: 'Termos de uso', href: '/termos' },
            ],
        },
    ],
    home: {
        heroPostId: 0,
        highlightPostIds: [],
        featuredGroupIds: [],
        hubs: DEFAULT_HOME_HUBS,
        featuredArtistSlug: '',
        featuredArtistNote: '',
    },
    productions: {
        featuredIds: [],
    },
    blogCategories: [],
    googleTag: null,
    bestOfLists: [
        { label: 'Melhores K-Dramas', href: '/melhores-dramas', emoji: '🏆' },
        { label: 'K-Dramas de Romance', href: '/melhores-dramas/romance', emoji: '💕' },
        { label: 'K-Dramas de Ação', href: '/melhores-dramas/acao', emoji: '⚡' },
        { label: 'K-Dramas de Suspense', href: '/melhores-dramas/suspense', emoji: '🔍' },
        { label: 'Melhores Filmes Coreanos', href: '/melhores-dramas/filmes', emoji: '🎬' },
        { label: 'Melhores da Netflix', href: '/melhores-dramas/netflix', emoji: '🔴' },
        { label: 'Melhores Clássicos', href: '/melhores-dramas/classicos', emoji: '⭐' },
    ],
    cultureGuides: [
        { label: 'Como começar no K-Pop', href: '/blog/como-comecar-no-kpop-guia-para-iniciantes', emoji: '🎧' },
        { label: 'Hangeul em 30 minutos', href: '/blog/hangeul-guia-basico-fas-brasileiros', emoji: '🇰🇷' },
        { label: 'Oppa, unnie, hyung, noona', href: '/blog/oppa-unnie-hyung-noona-termos-coreanos-guia', emoji: '💬' },
        { label: 'Sistema de idade coreana', href: '/blog/sistema-idade-coreana-man-nai-guia', emoji: '🎂' },
        { label: 'Chuseok e Seollal', href: '/blog/chuseok-seollal-festas-tradicionais-coreanas-explicadas', emoji: '🥮' },
        { label: 'Sunbae e hoobae', href: '/blog/sunbae-hoobae-hierarquia-k-drama-escritorio', emoji: '🏢' },
        { label: 'Glossário de tropes de k-drama', href: '/blog/glossario-tropes-kdrama-chaebol-makjang-second-lead', emoji: '📺' },
        { label: 'Fandoms de k-pop', href: '/blog/fandoms-kpop-light-sticks-fan-chants-fansigns', emoji: '💡' },
        { label: 'Han, Jeong e Aegyo', href: '/blog/han-conceito-coreano-tristeza-k-drama', emoji: '🧡' },
    ],
}

export async function getSiteSettings(): Promise<SiteSettings> {
    try {
        const response = await fetch(`${WP_API_URL}/${WP_API_NAMESPACE}/site-settings`, {
            headers: { Accept: 'application/json' },
            // revalidação real vem do webhook (revalidateTag em /api/revalidate); 3600s é só o teto de segurança
            next: { revalidate: 3600, tags: ['site-settings'] },
            signal: AbortSignal.timeout(5_000),
        })
        if (!response.ok) return DEFAULT_SITE_SETTINGS

        const data = await response.json() as Partial<SiteSettings>
        return {
            tagline: data.tagline || DEFAULT_SITE_SETTINGS.tagline,
            logoSubtitles: data.logoSubtitles?.length ? data.logoSubtitles : DEFAULT_SITE_SETTINGS.logoSubtitles,
            tickerEnabled: data.tickerEnabled ?? DEFAULT_SITE_SETTINGS.tickerEnabled,
            navigation: data.navigation?.length ? data.navigation : DEFAULT_SITE_SETTINGS.navigation,
            footerColumns: data.footerColumns?.length ? data.footerColumns : DEFAULT_SITE_SETTINGS.footerColumns,
            home: {
                heroPostId: data.home?.heroPostId ?? 0,
                highlightPostIds: data.home?.highlightPostIds ?? [],
                featuredGroupIds: data.home?.featuredGroupIds ?? [],
                hubs: data.home?.hubs?.length ? data.home.hubs : DEFAULT_HOME_HUBS,
                featuredArtistSlug: data.home?.featuredArtistSlug ?? '',
                featuredArtistNote: data.home?.featuredArtistNote ?? '',
            },
            productions: {
                featuredIds: data.productions?.featuredIds ?? [],
            },
            bestOfLists: data.bestOfLists?.length ? data.bestOfLists : DEFAULT_SITE_SETTINGS.bestOfLists,
            cultureGuides: data.cultureGuides?.length ? data.cultureGuides : DEFAULT_SITE_SETTINGS.cultureGuides,
            blogCategories: data.blogCategories ?? [],
            googleTag: data.googleTag ?? null,
        }
    } catch {
        return DEFAULT_SITE_SETTINGS
    }
}
