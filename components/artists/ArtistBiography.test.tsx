// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AdsProvider } from '@/components/providers/AdsProvider'
import type { MonetizationSettings } from '@/lib/wordpress/monetization'
import { ArtistBiography } from './ArtistBiography'

vi.mock('@/components/ui/AdSlotInline', () => ({
    AdSlotInline: ({ analyticsPlacement }: { analyticsPlacement?: string }) => (
        <aside aria-label="Publicidade" data-placement={analyticsPlacement} />
    ),
}))

const settings: MonetizationSettings = {
    enabled: true,
    client: 'ca-pub-1234567890123456',
    slots: { inline: '2040832834', article_sidebar: '', post_suggestion: '', leaderboard: '', sticky: '' },
}

function biography(contentAfter = '') {
    return render(
        <AdsProvider settings={settings}>
            <ArtistBiography
                name="Artista"
                label="Perfil"
                contentBefore="<p>Biografia verificada.</p>"
                contentAfter={contentAfter}
                facts={{ birthPlace: 'Seul' }}
                age={null}
                zodiac={null}
                roleLabels={[]}
            />
        </AdsProvider>,
    )
}

describe('ArtistBiography — zonas de anúncio responsivas', () => {
    it('mantém uma zona horizontal desktop elegível mesmo sem continuação da biografia', () => {
        biography()
        expect(screen.getByRole('complementary', { name: 'Publicidade' }))
            .toHaveAttribute('data-placement', 'artist_bio_desktop')
    })

    it('adiciona a zona mobile somente quando há continuação para separar', () => {
        const { container } = biography('<p>Continuação editorial suficientemente longa.</p>')
        const ads = screen.getAllByRole('complementary', { name: 'Publicidade' })
        expect(ads.map(node => node.dataset.placement))
            .toEqual(['artist_bio_mobile', 'artist_bio_desktop'])
        expect(ads[0].parentElement).toHaveClass('xl:hidden')
        expect(container.querySelector('aside.hidden.w-\\[300px\\]')).toBeInTheDocument()
    })

    it('repete o contrato de colunas desktop usado pelo perfil de produção', () => {
        const { container } = biography()
        expect(container.querySelector('.flex.items-start.gap-10')).toBeInTheDocument()
        expect(container.querySelector('.min-w-0.flex-1')).toBeInTheDocument()
        expect(container.querySelector('aside.w-\\[300px\\].shrink-0')).toBeInTheDocument()
    })

    it('agrupa os fatos em um único card e insere o retângulo eager logo abaixo', () => {
        const { container } = render(
            <AdsProvider settings={settings}>
                <ArtistBiography
                    name="Artista"
                    label="Perfil"
                    contentBefore="<p>Biografia.</p>"
                    contentAfter=""
                    facts={{ birthDate: '1995-01-03', birthPlace: 'Gunpo', height: 162, mbti: 'ISTP' }}
                    age={31}
                    zodiac={{ sign: 'Capricórnio', emoji: '♑' }}
                    roleLabels={['Atriz']}
                />
            </AdsProvider>,
        )
        const sidebar = container.querySelector('aside.w-\\[300px\\]')
        expect(sidebar?.children).toHaveLength(2)
        expect(sidebar?.children[0]).toHaveTextContent('Dados essenciais')
        expect(sidebar?.children[0]).toHaveTextContent('Mais informações')
        expect(sidebar?.children[1]).toHaveAttribute('data-profile-sidebar-ad')
        expect(sidebar?.children[1].querySelector('[data-placement="artist_bio_desktop"]')).toBeInTheDocument()
    })
})
