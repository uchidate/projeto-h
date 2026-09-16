import { describe, expect, it } from 'vitest'
import type { WPArtist } from '@/lib/wordpress/types'
import { toMemberSummary } from './memberSummary'

describe('toMemberSummary', () => {
    it('mantém só os campos lidos por card e votação', () => {
        const artist = {
            id: 7,
            slug: 'taeyong',
            title: { rendered: 'Taeyong' },
            featured_image_url: 'https://x/t.jpg',
            blood_type: 'A',
            content: { rendered: '<p>bio longa</p>' },
            _embedded: { 'wp:featuredmedia': [{ source_url: 'https://x/m.jpg', alt_text: 'alt', media_details: {} }] },
            acf: { name_hangul: '태용', birth_date: '19950701', roles: ['rapper'], story_chapters: [{ title: 'x' }] },
        } as unknown as WPArtist

        expect(toMemberSummary(artist)).toEqual({
            id: 7,
            slug: 'taeyong',
            title: { rendered: 'Taeyong' },
            featured_image_url: 'https://x/t.jpg',
            blood_type: 'A',
            _embedded: { 'wp:featuredmedia': [{ source_url: 'https://x/m.jpg', alt_text: 'alt' }] },
            acf: { name_hangul: '태용', birth_date: '19950701', death_date: undefined, roles: ['rapper'], height: undefined },
        })
    })
})
