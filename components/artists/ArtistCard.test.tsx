// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { WPArtist } from '@/lib/wordpress/types'

const m = vi.hoisted(() => ({ locale: 'pt', destaqueDe: vi.fn(), estaEmAlta: vi.fn() }))

vi.mock('next-intl', () => ({ useLocale: () => m.locale }))
vi.mock('@/lib/i18n/labels', () => ({ labelsFor: () => ({ role: (r: string) => `papel:${r}` }) }))
vi.mock('@/components/artists/lista/GanchoArtista', () => ({
    destaqueDe: m.destaqueDe,
    GanchoArtista: ({ grupoNome }: { grupoNome?: string }) => <span data-testid="gancho">{grupoNome}</span>,
}))
vi.mock('@/lib/constants/em-alta', () => ({ estaEmAlta: m.estaEmAlta }))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import { ArtistCard } from './ArtistCard'

const artista = (extra: Record<string, unknown> = {}) =>
    ({ id: 1, slug: 'iu', title: { rendered: 'IU' }, acf: { name_hangul: '아이유', roles: ['singer'] }, ...extra }) as unknown as WPArtist
const FOTO = { featured_image_url: 'https://exemplo.test/iu.jpg' }

beforeEach(() => {
    m.locale = 'pt'
    m.destaqueDe.mockReset().mockReturnValue(null)
    m.estaEmAlta.mockReset().mockReturnValue(false)
})
afterEach(cleanup)

describe('ArtistCard padrão', () => {
    it('leva à ficha com foto, nome, hangul e função', () => {
        render(<ArtistCard artist={artista(FOTO)} />)
        expect(screen.getByRole('link').getAttribute('href')).toBe('/artists/iu')
        expect(screen.getByRole('img', { name: 'IU' })).toBeTruthy()
        expect(screen.getByText('아이유')).toBeTruthy()
        expect(screen.getByText('papel:singer')).toBeTruthy()
    })

    it('sem foto mostra a inicial; showRole=false esconde a função', () => {
        render(<ArtistCard artist={artista()} showRole={false} />)
        expect(screen.queryByRole('img')).toBeNull()
        expect(screen.getByText('I')).toBeTruthy()
        expect(screen.queryByText('papel:singer')).toBeNull()
    })
})

describe('ArtistCard catálogo', () => {
    it('com foto marca quem está em alta', () => {
        m.estaEmAlta.mockReturnValue(true)
        render(<ArtistCard artist={artista(FOTO)} variant="catalog" />)
        expect(screen.getByRole('img', { name: 'IU' })).toBeTruthy()
        expect(screen.getByText('● top')).toBeTruthy()
        expect(screen.getByText('papel:singer')).toBeTruthy()
    })

    it('sem foto usa as duas primeiras sílabas em hangul e omite o selo quando pedido', () => {
        m.estaEmAlta.mockReturnValue(true)
        render(<ArtistCard artist={artista()} variant="catalog" showTrendingBadge={false} />)
        expect(screen.getByText('아이')).toBeTruthy()
        expect(screen.queryByText('● top')).toBeNull()
    })

    it('sem foto nem hangul usa a inicial', () => {
        render(<ArtistCard artist={artista({ acf: {} })} variant="catalog" />)
        expect(screen.getByText('I')).toBeTruthy()
    })
})

describe('ArtistCard diretório', () => {
    it('mostra a obra em destaque no lugar da função e repassa o grupo', () => {
        m.destaqueDe.mockReturnValue({ titulo: 'Hotel del Luna' })
        render(<ArtistCard artist={artista(FOTO)} variant="diretorio" grupoNome="Grupo X" />)
        expect(screen.getByRole('link').getAttribute('data-slug')).toBe('iu')
        expect(screen.getByText('Hotel del Luna')).toBeTruthy()
        expect(screen.queryByText('papel:singer')).toBeNull()
        expect(screen.getByTestId('gancho').textContent).toBe('Grupo X')
    })

    it('sem destaque mostra a função; selo de alta segue o idioma', () => {
        m.estaEmAlta.mockReturnValue(true)
        m.locale = 'en'
        render(<ArtistCard artist={artista()} variant="diretorio" />)
        expect(screen.getByText('trending')).toBeTruthy()
        expect(screen.getByText('papel:singer')).toBeTruthy()
        expect(screen.getByText('아이')).toBeTruthy()
    })

    it('idioma sem rótulo próprio cai no português', () => {
        m.estaEmAlta.mockReturnValue(true)
        m.locale = 'fr'
        render(<ArtistCard artist={artista({ acf: {} })} variant="diretorio" />)
        expect(screen.getByText('em alta')).toBeTruthy()
    })
})
