import { describe, expect, it } from 'vitest'
import type { WPArtist, WPGroup } from '@/lib/wordpress/types'
import { buildGroupProfileModel } from '@/lib/profiles/groupProfile'
import { isInterstitial, type ProfileBlockDef } from './ProfileSection'
import { buildGroupProfileEntries } from './GroupProfileBlocks'
import { ptTranslator } from '@/lib/i18n/testing'

const profileT = ptTranslator('profile')

function group(overrides: Partial<WPGroup> = {}): WPGroup {
    return {
        id: 1, slug: 'grupo', status: 'publish', date: '2020-01-01', modified: '2020-01-01',
        title: { rendered: 'Grupo' }, content: { rendered: '<p>Biografia longa o suficiente para aparecer.</p>' }, featured_media: 0,
        ...overrides,
    }
}

const member = (id: number): WPArtist => ({
    id, slug: `membro-${id}`, status: 'publish', date: '2020-01-01', modified: '2020-01-01',
    title: { rendered: `Membro ${id}` }, content: { rendered: '' }, featured_media: 0,
})

function visibleIds(value: WPGroup, members: WPArtist[] = []) {
    return buildGroupProfileEntries({
        t: profileT,
        locale: 'pt',
        group: value,
        model: buildGroupProfileModel(value, 2026),
        members,
        activeMembers: members,
        formerMembers: [], formerSemFicha: [],
        memberPositions: {},
        relatedPosts: [],
        relatedGroups: [],
        discography: [],
        agencyName: null,
        faqItems: [{ question: 'Quem é?', answer: 'Um grupo.' }],
    }).filter((entry): entry is ProfileBlockDef => !isInterstitial(entry) && entry.present).map(entry => entry.id)
}

describe('buildGroupProfileEntries', () => {
    it('mantém a ordem narrativa canônica dos blocos disponíveis', () => {
        const value = group({
            acf: {
                color: '#ff00aa', curiosidades: ['Fato'], instagram: '@grupo',
                mv_url: 'https://youtube.com/watch?v=abcdefghijk',
            },
            stats: [{ label: 'Álbuns', value: '3' }],
            editorial_analysis: 'Análise editorial',
        })

        expect(visibleIds(value, [member(1), member(2)])).toEqual([
            'sobre', 'analise', 'ficha', 'membros', 'numeros', 'videos',
            'conquistas', 'identidade', 'redes', 'votacao', 'faq',
        ])
    })

    it('omite seções sem dados e preserva o FAQ', () => {
        expect(visibleIds(group({ content: { rendered: '' } }))).toEqual(['faq'])
    })

    it('só oferece votação quando há mais de um integrante', () => {
        expect(visibleIds(group(), [member(1)])).not.toContain('votacao')
        expect(visibleIds(group(), [member(1), member(2)])).toContain('votacao')
    })

    it('mantém somente um anúncio inline no fluxo', () => {
        const interstitialKeys = (value: WPGroup) => buildGroupProfileEntries({
        t: profileT,
        locale: 'pt',
            group: value,
            model: buildGroupProfileModel(value, 2026),
            members: [], activeMembers: [], formerMembers: [], formerSemFicha: [], memberPositions: {},
            relatedPosts: [], relatedGroups: [], discography: [], agencyName: null, faqItems: [],
        }).filter(isInterstitial).map(entry => entry.key)

        expect(interstitialKeys(group())).toContain('inline-ad')
        expect(interstitialKeys(group({
            acf: {
                story_chapters: Array.from({ length: 5 }, (_, index) => ({
                    period: `${2020 + index}`,
                    title: `Capítulo ${index + 1}`,
                    description: 'História',
                    source_url: 'https://example.com',
                })),
            },
        }))).toEqual(expect.arrayContaining(['story-feed-ad']))
        expect(interstitialKeys(group({
            acf: {
                story_chapters: Array.from({ length: 5 }, (_, index) => ({
                    period: `${2020 + index}`,
                    title: `Capítulo ${index + 1}`,
                    description: 'História',
                    source_url: 'https://example.com',
                })),
            },
        }))).not.toContain('inline-ad')
    })
})

describe('ex-integrante sem ficha', () => {
    it('mantém o bloco de integrantes quando só há ex sem post no CPT', () => {
        const value = group({ former_member_slugs: ['nako-yabuki'] })
        const entries = buildGroupProfileEntries({
        t: profileT,
        locale: 'pt',
            group: value,
            model: buildGroupProfileModel(value, 2026),
            members: [],
            activeMembers: [],
            formerMembers: [],
            formerSemFicha: [{ slug: 'nako-yabuki', name: 'Nako Yabuki' }],
            memberPositions: {},
            relatedPosts: [],
            relatedGroups: [],
            discography: [],
            agencyName: null,
            faqItems: [{ question: 'Quem é?', answer: 'Um grupo.' }],
        })
        const membros = entries.filter((e): e is ProfileBlockDef => !isInterstitial(e)).find(e => e.id === 'membros')
        expect(membros?.present).toBe(true)
    })

    it('não conta ex-integrante como formação ativa', () => {
        const value = group({
            acf: { members: [1, 2, 3] },
            former_member_slugs: ['saiu-um', 'saiu-dois'],
        })
        expect(buildGroupProfileModel(value, 2026).memberCount).toBe(1)
    })
})
