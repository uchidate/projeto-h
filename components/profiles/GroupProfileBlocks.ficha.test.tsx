// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import type { WPArtist, WPGroup } from '@/lib/wordpress/types'
import { buildGroupProfileModel } from '@/lib/profiles/groupProfile'
import { isInterstitial, type ProfileBlockDef } from './ProfileSection'
import { buildGroupProfileEntries } from './GroupProfileBlocks'
import { ptTranslator } from '@/lib/i18n/testing'

const profileT = ptTranslator('profile')

const member = (id: number): WPArtist => ({
    id, slug: `membro-${id}`, status: 'publish', date: '2020-01-01', modified: '2020-01-01',
    title: { rendered: `Membro ${id}` }, content: { rendered: '' }, featured_media: 0,
})

describe('cartão de formação', () => {
    // ZB1: três ex com ficha no CPT e um (Ricky) sem. O cartão contava só os três,
    // enquanto o FAQ da mesma página dizia quatro.
    it('conta os ex sem ficha junto dos que têm', () => {
        const group: WPGroup = {
            id: 1, slug: 'grupo', status: 'publish', date: '2020-01-01', modified: '2020-01-01',
            title: { rendered: 'Grupo' }, content: { rendered: '<p>bio</p>' }, featured_media: 0,
            acf: { members: [1, 2, 3] },
            former_member_slugs: ['membro-2', 'membro-3', 'ricky-zb1|Ricky'],
        }
        const entries = buildGroupProfileEntries({
        t: profileT,
        locale: 'pt',
            group,
            model: buildGroupProfileModel(group, 2026),
            members: [member(1), member(2), member(3)],
            activeMembers: [member(1)],
            formerMembers: [member(2), member(3)],
            formerSemFicha: [{ slug: 'ricky-zb1', name: 'Ricky' }],
            memberPositions: {},
            relatedPosts: [], relatedGroups: [], discography: [], agencyName: null, faqItems: [],
        })
        const ficha = entries.filter((e): e is ProfileBlockDef => !isInterstitial(e)).find(e => e.id === 'ficha')
        const { container } = render(<>{ficha?.render('')}</>)
        const texto = container.textContent ?? ''
        expect(texto).toContain('1 integrante ativo')
        expect(texto).toContain('3 ex-integrantes')
    })
})
