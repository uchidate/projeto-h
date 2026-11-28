// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'

vi.mock('next-intl', () => ({ useTranslations: () => (k: string) => k }))
vi.mock('@/components/groups/GroupSectionHeading', () => ({ GroupSectionHeading: () => null }))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} data-interno="1" {...rest}>{children}</a>,
}))

import { ArtistPremiumGateway } from './ArtistPremiumGateway'

type Props = ComponentProps<typeof ArtistPremiumGateway>
const montar = (extra: Record<string, unknown> = {}) =>
    render(<ArtistPremiumGateway {...{ name: 'IU', essencia: {}, groups: [], productions: [], discography: [], relatedPosts: [], accent: '#000', ...extra } as unknown as Props} />)
const obra = (slug: string) => ({ slug, title: { rendered: `Título ${slug}` } })

afterEach(cleanup)

describe('ArtistPremiumGateway', () => {
    it('sem nenhuma entrada não aparece', () => {
        expect(montar().container.innerHTML).toBe('')
    })

    it('monta as quatro portas: álbum externo e grupo, obra e artigo internos', () => {
        montar({
            essencia: { portaEntrada: 'Canção' }, discography: [{ spotifyUrl: 'https://open.spotify.test/album' }],
            groups: [obra('grupo')], productions: [obra(''), obra('serie')], relatedPosts: [obra('artigo')],
        })
        const links = screen.getAllByRole('link')
        expect(links.map(a => a.getAttribute('href'))).toEqual(['https://open.spotify.test/album', '/groups/grupo', '/productions/serie', '/blog/artigo'])
        expect(links[0].getAttribute('target')).toBe('_blank')
        expect(links[0].getAttribute('data-interno')).toBeNull()
        expect(screen.getByText('04')).toBeTruthy()
    })

    it('sem link do álbum a porta de entrada vira texto', () => {
        montar({ essencia: { portaEntrada: 'Canção' } })
        expect(screen.getByText('Canção')).toBeTruthy()
        expect(screen.queryByRole('link')).toBeNull()
    })
})
