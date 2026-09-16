import { describe, expect, it } from 'vitest'
import type { WPArtist, WPGroup } from '@/lib/wordpress/types'
import { buildArtistProfileModel } from './artistProfile'
import { buildGroupProfileModel } from './groupProfile'
import { parseArtistAwards, parseArtistMilestones } from './structuredFields'

function artist(overrides: Partial<WPArtist> = {}): WPArtist {
    return {
        id: 1,
        slug: 'jisoo-kim',
        status: 'publish',
        date: '2020-01-01',
        modified: '2020-01-01',
        title: { rendered: 'Jisoo' },
        content: { rendered: '<p>Biografia suficientemente longa para o perfil.</p>' },
        featured_media: 0,
        ...overrides,
    }
}

function group(overrides: Partial<WPGroup> = {}): WPGroup {
    return {
        id: 2,
        slug: 'blackpink',
        status: 'publish',
        date: '2020-01-01',
        modified: '2020-01-01',
        title: { rendered: 'BLACKPINK' },
        content: { rendered: '<p>Grupo feminino sul-coreano com trajetória internacional.</p>' },
        featured_media: 0,
        ...overrides,
    }
}

describe('campos estruturados de artista', () => {
    it('normaliza prêmios válidos e descarta registros incompletos', () => {
        expect(parseArtistAwards([
            '2024 | Melhor Atriz | Snowdrop | Evento X',
            'sem separador',
            '2023||Obra',
        ])).toEqual([{
            year: '2024',
            category: 'Melhor Atriz',
            title: 'Snowdrop',
            event: 'Evento X',
        }])
    })

    it('divide milestones apenas no primeiro pipe e exige os dois campos', () => {
        expect(parseArtistMilestones([
            '2016 | Estreia | BLACKPINK',
            'inválido',
            '2020| ',
        ])).toEqual([{
            year: '2016',
            description: 'Estreia | BLACKPINK',
        }])
    })
})

describe('buildArtistProfileModel', () => {
    it('deriva dados de exibição a partir do ACF normalizado', () => {
        const model = buildArtistProfileModel(artist({
            acf: {
                birth_date: '1995-01-03',
                birth_place: 'Gunpo',
                debut_date: '2016-08-08',
                height: 162,
                roles: ['singer', 'actor'],
                awards: ['2024|Melhor Atriz|Obra|Evento'],
                milestones: ['2016|Estreia'],
                curiosidades: ['Curiosidade'],
            },
        }), new Date(2026, 6, 13))

        expect(model.age).toBe(31)
        expect(model.roleLabels).toEqual(['Cantor(a)', 'Ator/Atriz'])
        expect(model.heroMeta).toEqual(['31 anos', 'Gunpo'])
        expect(model.quickFacts.map(([label]) => label)).toEqual(['Estreia', 'Nascimento', 'Altura', 'Signo'])
        expect(model.hasAwards).toBe(true)
        expect(model.hasMilestones).toBe(true)
        expect(model.hasCuriosidades).toBe(true)
    })

    it('não expõe seção para arrays pipe que só contêm valores inválidos', () => {
        const model = buildArtistProfileModel(artist({
            content: { rendered: '' },
            acf: { awards: ['inválido'], milestones: ['também inválido'] },
        }))

        expect(model.hasBio).toBe(false)
        expect(model.hasAwards).toBe(false)
        expect(model.hasMilestones).toBe(false)
        expect(model.awards).toEqual([])
        expect(model.milestones).toEqual([])
    })

    it('respeita a prioridade de vídeos REST, ACF, MV e YouTube', () => {
        const withRest = buildArtistProfileModel(artist({
            videos_rest: [{ title: 'REST', url: 'https://youtube.com/watch?v=rest1234567' }],
            acf: { videos: [{ title: 'ACF', url: 'https://youtube.com/watch?v=acf12345678' }] },
        }))
        const withMv = buildArtistProfileModel(artist({ acf: { mv_url: 'https://youtube.com/watch?v=mv123456789' } }))

        expect(withRest.videoList[0].title).toBe('REST')
        expect(withMv.videoList).toEqual([{ title: 'Jisoo', url: 'https://youtube.com/watch?v=mv123456789' }])
    })
})

describe('buildGroupProfileModel', () => {
    it('deriva geração, atividade, redes e mídia com ano controlável', () => {
        const model = buildGroupProfileModel(group({
            acf: {
                debut_date: '2016-08-08',
                members: [1, 2, 3, 4],
                instagram: '@blackpinkofficial',
                website: 'https://blackpinkofficial.com',
                mv_url: 'https://youtube.com/watch?v=group123456',
                color: '#f5a9b8',
            },
        }), 2026)

        expect(model.generation).toBe('3ª geração')
        expect(model.yearsActive).toBe(10)
        expect(model.memberCount).toBe(4)
        expect(model.accent).toBe('#f5a9b8')
        expect(model.socialEntries.map(entry => entry.key)).toEqual(['instagram', 'website'])
        expect(model.videoList[0].title).toBe('BLACKPINK')
    })

    it('aplica defaults seguros quando os campos opcionais estão ausentes', () => {
        const model = buildGroupProfileModel(group({ content: { rendered: '' } }), 2026)

        expect(model.hasBio).toBe(false)
        expect(model.generation).toBeNull()
        expect(model.yearsActive).toBeNull()
        expect(model.accent).toBe('#e91e8c')
        expect(model.socialEntries).toEqual([])
        expect(model.videoList).toEqual([])
    })

    it('congela idade e tempo de carreira na data de falecimento', () => {
        const model = buildArtistProfileModel(artist({
            acf: {
                birth_date: '1975-03-02',
                death_date: '2023-12-27',
                debut_date: '2001-01-01',
            },
        }), new Date(2026, 7, 3))

        expect(model.isDeceased).toBe(true)
        expect(model.deathYear).toBe(2023)
        expect(model.age).toBe(48) // e não 51, que é a idade que teria hoje
        expect(model.heroMeta).toContain('1975–2023')
        expect(model.heroMeta).not.toContain('51 anos')
        expect(model.quickFacts).toContainEqual(['Falecimento', expect.stringContaining('2023')])
        expect(model.biographyFacts.deathDate).toBe('2023-12-27')
    })

    it('mantém idade corrente e nenhum marcador de falecimento para artista vivo', () => {
        const model = buildArtistProfileModel(artist({
            acf: { birth_date: '1995-01-03', debut_date: '2016-08-08' },
        }), new Date(2026, 7, 3))

        expect(model.isDeceased).toBe(false)
        expect(model.deathYear).toBeNull()
        expect(model.age).toBe(31)
        expect(model.heroMeta).toContain('31 anos')
        expect(model.quickFacts.some(([label]) => label === 'Falecimento')).toBe(false)
        expect(model.biographyFacts.deathDate).toBeUndefined()
    })
})
