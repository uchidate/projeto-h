// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProfileSidebarAd } from './ProfileSidebarAd'

vi.mock('@/components/ui/AdSlotInline', () => ({
    AdSlotInline: (props: Record<string, unknown>) => (
        <aside aria-label="Publicidade" data-props={JSON.stringify(props)} />
    ),
}))

describe('ProfileSidebarAd', () => {
    it('usa o contrato retangular eager comum a todos os perfis desktop', () => {
        render(<ProfileSidebarAd analyticsPlacement="artist_bio_desktop" />)

        const wrapper = screen.getByRole('complementary', { name: 'Publicidade' }).parentElement
        const props = JSON.parse(screen.getByRole('complementary', { name: 'Publicidade' }).dataset.props ?? '{}')

        expect(wrapper).toHaveAttribute('data-profile-sidebar-ad')
        expect(props).toMatchObject({
            slot: 'inline',
            layout: 'sidebar',
            analyticsPlacement: 'artist_bio_desktop',
        })
    })
})
