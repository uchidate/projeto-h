import { describe, it, expect } from 'vitest'
import {
    getSingleGenreHubSlug,
    getHubsForProduction,
    getHubsForArtist,
    getHubsForGroup,
} from './hub-lookup'
import { ALL_HUBS } from './index'
import type { WPProduction, WPArtist, WPGroup } from '@/lib/wordpress/types'

function makeProduction(acf: Partial<NonNullable<WPProduction['acf']>>): WPProduction {
    return { acf } as WPProduction
}

function makeArtist(acf: Partial<NonNullable<WPArtist['acf']>>): WPArtist {
    return { acf } as WPArtist
}

function makeGroup(slug: string, acf: Partial<NonNullable<WPGroup['acf']>>): WPGroup {
    return { slug, acf } as WPGroup
}

describe('getSingleGenreHubSlug', () => {
    // Regressão: usado para apontar o canonical de /productions?genre=X pro
    // guia editorial equivalente (2026-07-03) — precisa ficar undefined em
    // qualquer caso ambíguo, senão o canonical aponta pro guia errado.
    it('resolves a genre with exactly one matching hub', () => {
        expect(getSingleGenreHubSlug('romance')).toBe('doramas-romanticos')
    })

    it('returns undefined for a genre with zero matching hubs', () => {
        expect(getSingleGenreHubSlug('genero-que-nao-existe')).toBeUndefined()
    })

    it('returns undefined for an ambiguous genre (2+ hubs), never picks one arbitrarily', () => {
        const thrillerHubs = ALL_HUBS.filter(h => h.kind === 'productions' && h.filter.genre === 'thriller')
        // Só testa a garantia de ambiguidade se os dados de fato tiverem 2+ hubs hoje;
        // se um dia ficar com 1 só, esse teste vira redundante com o de cima (não quebra).
        if (thrillerHubs.length > 1) {
            expect(getSingleGenreHubSlug('thriller')).toBeUndefined()
        }
    })

    it('never returns a slug for a hub with combined filters (genre + something else)', () => {
        for (const hub of ALL_HUBS) {
            if (hub.kind === 'productions' && hub.filter.genre && Object.keys(hub.filter).length > 1) {
                // Um hub com filtro combinado nunca deve ser o único candidato "puro" pro seu gênero
                // isolado, a menos que coincidentemente não haja nenhum hub de gênero puro pra ele.
                const result = getSingleGenreHubSlug(hub.filter.genre)
                expect(result).not.toBe(hub.slug)
            }
        }
    })
})

// Testado contra os dados reais de lib/guias/*-hubs.ts (não mockado) — o
// objetivo aqui é travar invariantes estruturais (limite de 6, sem
// duplicatas, filtros combinando corretamente), não o conteúdo específico
// dos hubs, que muda com frequência.
describe('getHubsForProduction', () => {
    it('nunca retorna mais que 6 hubs', () => {
        const anyGenreHub = ALL_HUBS.find(h => h.kind === 'productions' && h.filter.genre)
        const anyPlatformHub = ALL_HUBS.find(h => h.kind === 'productions' && h.filter.platform)
        const production = makeProduction({
            genre: anyGenreHub?.filter.genre,
            platform: anyPlatformHub?.filter.platform,
        })
        expect(getHubsForProduction(production).length).toBeLessThanOrEqual(6)
    })

    it('retorna array vazio quando a produção não tem nenhum campo relevante preenchido', () => {
        expect(getHubsForProduction(makeProduction({}))).toEqual([])
    })

    it('não retorna hubs duplicados mesmo se múltiplas dimensões apontarem pro mesmo hub', () => {
        const anyGenreHub = ALL_HUBS.find(h => h.kind === 'productions' && h.filter.genre)
        if (!anyGenreHub?.filter.genre) return
        const production = makeProduction({ genre: anyGenreHub.filter.genre })
        const result = getHubsForProduction(production)
        const slugs = result.map(h => h.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
    })

    it('inclui o hub de ano quando existe um hub pra esse ano exato', () => {
        const yearHub = ALL_HUBS.find(h => h.kind === 'productions' && h.filter.year)
        if (!yearHub?.filter.year) return
        const production = makeProduction({ year: yearHub.filter.year })
        const result = getHubsForProduction(production)
        expect(result.some(h => h.slug === yearHub.slug)).toBe(true)
    })
})

describe('getHubsForArtist', () => {
    it('nunca retorna mais que 6 hubs', () => {
        const artist = makeArtist({ roles: ['singer', 'actor', 'dancer', 'rapper', 'model'], gender: 'female' })
        expect(getHubsForArtist(artist).length).toBeLessThanOrEqual(6)
    })

    it('retorna array vazio quando não há roles nem gender', () => {
        expect(getHubsForArtist(makeArtist({}))).toEqual([])
    })

    it('respeita o filtro de role: só inclui hub cujo role está entre as roles do artista', () => {
        // precisa ser um hub só de role (sem gender combinado), senão a ausência
        // de gender no artista de teste faria o filtro falhar por outro motivo
        const roleHub = ALL_HUBS.find(h => h.kind === 'artists' && h.filter.role && !h.filter.gender)
        if (!roleHub?.filter.role) return

        const withRole = makeArtist({ roles: [roleHub.filter.role] })
        const withoutRole = makeArtist({ roles: ['papel-inexistente'] })

        expect(getHubsForArtist(withRole).some(h => h.slug === roleHub.slug)).toBe(true)
        expect(getHubsForArtist(withoutRole).some(h => h.slug === roleHub.slug)).toBe(false)
    })
})

describe('getHubsForGroup', () => {
    it('nunca retorna mais que 6 hubs', () => {
        const group = makeGroup('grupo-teste', { type: 'girl_group' })
        expect(getHubsForGroup(group).length).toBeLessThanOrEqual(6)
    })

    it('retorna array vazio quando o grupo não tem type nem é membro de nenhum hub', () => {
        expect(getHubsForGroup(makeGroup('grupo-sem-hub-nenhum-inexistente', {}))).toEqual([])
    })

    it('inclui hubs de membro (filter.groupSlug) quando o slug do grupo bate', () => {
        const memberHub = ALL_HUBS.find(h => h.filter.groupSlug)
        if (!memberHub?.filter.groupSlug) return
        const group = makeGroup(memberHub.filter.groupSlug, {})
        expect(getHubsForGroup(group).some(h => h.slug === memberHub.slug)).toBe(true)
    })
})
