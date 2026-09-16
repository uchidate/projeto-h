import { describe, it, expect } from 'vitest'
import { buildUserAchievements } from './userJourney'

function stats(overrides: Partial<Parameters<typeof buildUserAchievements>[0]> = {}) {
    return {
        favoritesCount: 0,
        watchlistCount: 0,
        statusCounts: { want: 0, watching: 0, watched: 0 },
        contentCounts: { production: 0, artist: 0, group: 0, post: 0 },
        contentStateCounts: { favorite: 0, following: 0, saved: 0, read: 0 },
        ...overrides,
    }
}

describe('buildUserAchievements', () => {
    it('retorna 10 conquistas', () => {
        expect(buildUserAchievements(stats())).toHaveLength(10)
    })

    it('marca done=false e progress=0 quando current é 0', () => {
        const [first] = buildUserAchievements(stats({ favoritesCount: 0 }))
        expect(first.done).toBe(false)
        expect(first.progress).toBe(0)
    })

    it('marca done=true quando current atinge o target exato', () => {
        const achievements = buildUserAchievements(stats({ favoritesCount: 1 }))
        const firstFavorite = achievements.find(a => a.id === 'first-favorite')!
        expect(firstFavorite.done).toBe(true)
        expect(firstFavorite.progress).toBe(100)
    })

    it('progress nunca passa de 100 mesmo quando current excede o target', () => {
        const achievements = buildUserAchievements(stats({ favoritesCount: 999 }))
        const firstFavorite = achievements.find(a => a.id === 'first-favorite')!
        expect(firstFavorite.progress).toBe(100)
        expect(firstFavorite.done).toBe(true)
    })

    it('progress é arredondado (ex: 2/5 = 40%, não 39.99...)', () => {
        const achievements = buildUserAchievements(stats({ watchlistCount: 2 }))
        const agendaCheia = achievements.find(a => a.id === 'agenda-cheia')!
        expect(agendaCheia.progress).toBe(40)
    })

    it('followingCount soma artistas + grupos seguidos (radar-ligado/fandom-ativo)', () => {
        const achievements = buildUserAchievements(stats({ contentCounts: { production: 0, artist: 2, group: 3, post: 0 } }))
        const radarLigado = achievements.find(a => a.id === 'radar-ligado')!
        expect(radarLigado.current).toBe(5)
        expect(radarLigado.done).toBe(true) // target 1
    })

    it('biblioteca-aberta soma leituras salvas + artigos lidos', () => {
        const achievements = buildUserAchievements(stats({ contentStateCounts: { favorite: 0, following: 0, saved: 2, read: 3 } }))
        const bibliotecaAberta = achievements.find(a => a.id === 'biblioteca-aberta')!
        expect(bibliotecaAberta.current).toBe(5)
    })

    it('em-andamento usa statusCounts.watching, não watchlistCount', () => {
        const achievements = buildUserAchievements(stats({ watchlistCount: 100, statusCounts: { want: 0, watching: 2, watched: 0 } }))
        const emAndamento = achievements.find(a => a.id === 'em-andamento')!
        expect(emAndamento.current).toBe(2)
    })

    it('lida com campos opcionais ausentes (statusCounts/contentCounts/contentStateCounts undefined)', () => {
        const minimal = { favoritesCount: 3, watchlistCount: 1 }
        expect(() => buildUserAchievements(minimal)).not.toThrow()
        const achievements = buildUserAchievements(minimal)
        expect(achievements.find(a => a.id === 'radar-ligado')!.current).toBe(0)
    })

    it('cada conquista tem href e cta definidos (nunca undefined)', () => {
        const achievements = buildUserAchievements(stats())
        for (const a of achievements) {
            expect(a.href).toBeTruthy()
            expect(a.cta).toBeTruthy()
        }
    })
})
