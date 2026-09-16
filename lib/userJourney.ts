export type UserJourneyStats = {
    favoritesCount: number
    watchlistCount: number
    statusCounts?: { want: number; watching: number; watched: number }
    contentCounts?: { production: number; artist: number; group: number; post: number }
    contentStateCounts?: { favorite: number; following: number; saved: number; read: number }
}

export type UserAchievement = {
    id: string
    label: string
    desc: string
    howTo: string
    current: number
    target: number
    href: string
    cta: string
    category: 'Colecao' | 'Continuidade' | 'Fandom' | 'Leitura'
    done: boolean
    progress: number
}

function withProgress(item: Omit<UserAchievement, 'done' | 'progress'>): UserAchievement {
    return {
        ...item,
        done: item.current >= item.target,
        progress: Math.min(100, Math.round((item.current / item.target) * 100)),
    }
}

export function buildUserAchievements(stats: UserJourneyStats): UserAchievement[] {
    const followedArtists = stats.contentCounts?.artist ?? 0
    const followedGroups = stats.contentCounts?.group ?? 0
    const savedReadings = stats.contentStateCounts?.saved ?? 0
    const readArticles = stats.contentStateCounts?.read ?? 0
    const watchingCount = stats.statusCounts?.watching ?? 0
    const watchedCount = stats.statusCounts?.watched ?? 0
    const followingCount = followedArtists + followedGroups

    const items: Array<Omit<UserAchievement, 'done' | 'progress'>> = [
        {
            id: 'first-favorite',
            label: 'Primeira curtida',
            desc: 'Favorite sua primeira producao.',
            howTo: 'Abra um drama, filme ou especial e toque no botao de favorito.',
            current: stats.favoritesCount,
            target: 1,
            href: '/productions',
            cta: 'Explorar producoes',
            category: 'Colecao',
        },
        {
            id: 'cinefilo',
            label: 'Cinefilo',
            desc: 'Favorite 5 producoes.',
            howTo: 'Use favoritos para guardar titulos que voce ama, quer rever ou recomendaria.',
            current: stats.favoritesCount,
            target: 5,
            href: '/productions',
            cta: 'Aumentar favoritos',
            category: 'Colecao',
        },
        {
            id: 'colecionador',
            label: 'Colecionador',
            desc: 'Favorite 20 producoes.',
            howTo: 'Continue refinando sua colecao com dramas, filmes e especiais coreanos.',
            current: stats.favoritesCount,
            target: 20,
            href: '/productions',
            cta: 'Ver catalogo',
            category: 'Colecao',
        },
        {
            id: 'agenda-cheia',
            label: 'Agenda cheia',
            desc: 'Adicione 5 titulos em Quero ver.',
            howTo: 'Marque producoes como Quero ver para montar sua fila de proximas maratonas.',
            current: stats.watchlistCount,
            target: 5,
            href: '/productions',
            cta: 'Montar lista',
            category: 'Continuidade',
        },
        {
            id: 'em-andamento',
            label: 'Em andamento',
            desc: 'Marque 3 titulos como Assistindo.',
            howTo: 'Quando comecar um titulo, use o estado Assistindo para ele aparecer na continuidade.',
            current: watchingCount,
            target: 3,
            href: '/productions',
            cta: 'Marcar assistindo',
            category: 'Continuidade',
        },
        {
            id: 'historico-vivo',
            label: 'Historico vivo',
            desc: 'Marque 5 titulos como Assistido.',
            howTo: 'Ao terminar um drama, filme ou especial, registre como Assistido nas acoes da pagina.',
            current: watchedCount,
            target: 5,
            href: '/minhas-listas?tab=assistidos',
            cta: 'Ver assistidos',
            category: 'Continuidade',
        },
        {
            id: 'radar-ligado',
            label: 'Radar ligado',
            desc: 'Siga seu primeiro artista ou grupo.',
            howTo: 'Entre em uma pagina de artista ou grupo e toque em Seguir.',
            current: followingCount,
            target: 1,
            href: '/artists',
            cta: 'Encontrar artistas',
            category: 'Fandom',
        },
        {
            id: 'fandom-ativo',
            label: 'Fandom ativo',
            desc: 'Siga 5 artistas ou grupos.',
            howTo: 'Acompanhe perfis para conectar K-pop, dramas, membros e artigos na sua Minha Onda.',
            current: followingCount,
            target: 5,
            href: '/groups',
            cta: 'Explorar grupos',
            category: 'Fandom',
        },
        {
            id: 'biblioteca-aberta',
            label: 'Biblioteca aberta',
            desc: 'Salve sua primeira leitura.',
            howTo: 'Abra um artigo, guia ou lista e use Salvar leitura para voltar depois.',
            current: savedReadings + readArticles,
            target: 1,
            href: '/blog',
            cta: 'Ver artigos',
            category: 'Leitura',
        },
        {
            id: 'leitor-bastidores',
            label: 'Leitor de bastidores',
            desc: 'Marque 3 artigos como lidos.',
            howTo: 'Ao terminar um texto, use Marcar como lido no artigo.',
            current: readArticles,
            target: 3,
            href: '/blog',
            cta: 'Continuar lendo',
            category: 'Leitura',
        },
    ]

    return items.map(withProgress)
}
