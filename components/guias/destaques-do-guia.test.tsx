// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { WPArtist, WPGroup } from '@/lib/wordpress/types'

vi.mock('@/lib/i18n/labels', () => ({ labelsFor: () => ({ role: (r: string) => r.toUpperCase() }) }))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import { SolistaDestaque } from './SolistaDestaque'
import { GrupoDestaque } from './GrupoDestaque'

const marcos = [1, 2, 3, 4].map(n => ({ value: `${n}M`, label: `Marco ${n}` }))
const ficha = (extra: Record<string, unknown> = {}) => ({ id: 1, slug: 'x', title: { rendered: 'Nome' }, ...extra })
const definicoes = () => Array.from(document.querySelectorAll('dt')).map(e => e.textContent)

afterEach(cleanup)

describe('SolistaDestaque', () => {
    it('perfil completo mostra frase, três marcos e a ficha', () => {
        const artista = ficha({ featured_image_url: 'https://exemplo.test/a.jpg', acf: {
            name_hangul: '이름', birth_date: '19930516', birth_place: 'Seul, Coreia', debut_date: '2008-09-18', essencia_gravadora: 'Agência X',
            roles: ['singer', 'actor', 'mc', 'model'], key_metrics: marcos, career_statement: 'Frase', career_statement_sub: 'Complemento', essencia_porta_entrada: 'Canção',
        } }) as unknown as WPArtist
        render(<SolistaDestaque artist={artista} grupo="Grupo Y" resumo="Resumo" />)
        expect(screen.getByText('Perfil · Grupo Y')).toBeTruthy()
        expect(screen.getByText('16/05/1993 · Seul')).toBeTruthy()
        expect(screen.getByText('18/09/2008')).toBeTruthy()
        expect(screen.getByText('SINGER, ACTOR, MC')).toBeTruthy()
        expect(screen.getByText('Frase')).toBeTruthy()
        expect(screen.getByText('Complemento')).toBeTruthy()
        expect(screen.queryByText('Resumo')).toBeNull()
        expect(screen.queryByText('Marco 4')).toBeNull()
        expect(screen.getByText('Canção')).toBeTruthy()
        expect(screen.getByRole('link', { name: /Ver perfil completo/ }).getAttribute('href')).toBe('/artists/x')
    })

    it('sem campos editoriais cai para nome e resumo', () => {
        render(<SolistaDestaque artist={ficha() as unknown as WPArtist} resumo="Resumo" />)
        expect(screen.getByText('Perfil')).toBeTruthy()
        expect(screen.getByText('Resumo')).toBeTruthy()
        expect(definicoes()).toEqual([])
        expect(screen.queryByRole('img')).toBeNull()
    })
})

describe('GrupoDestaque', () => {
    const grupo = (acf?: Record<string, unknown>, extra: Record<string, unknown> = {}) => ficha({ acf, ...extra }) as unknown as WPGroup

    it('grupo em atividade mostra ficha, significado e ex-integrantes', () => {
        render(<GrupoDestaque group={grupo({ type: 'girl_group', name_hangul: '이름', name_meaning: '<p>Sentido</p>', debut_date: '2020-11-17', fandom_name: 'MY', lightstick: 'Bastão', active: true }, { featured_image_url: 'https://exemplo.test/g.jpg' })}
            agencia="Agência X" exIntegrantes={['A', 'B']} integrantes={4} />)
        expect(screen.getByText('Girl group')).toBeTruthy()
        expect(screen.getByText('Sentido')).toBeTruthy()
        expect(definicoes()).toEqual(['Estreia', 'Integrantes', 'Agência', 'Fandom', 'Lightstick', 'Situação'])
        expect(screen.getByText('Em atividade')).toBeTruthy()
        expect(screen.getByText('A, B')).toBeTruthy()
        expect(screen.getByRole('img', { name: 'Nome' })).toBeTruthy()
        expect(screen.getByRole('link', { name: /Ver página do grupo/ }).getAttribute('href')).toBe('/groups/x')
    })

    it('não repete a estreia que já é um marco e marca grupo encerrado', () => {
        render(<GrupoDestaque group={grupo({ debut_date: '2007-02-10', disbandment_date: '2017-01-26', key_metrics: [{ value: '2007', label: 'Ano de estreia' }] })} exIntegrantes={[]} integrantes={0} />)
        expect(definicoes()).toEqual(['2007', 'Situação'])
        expect(screen.getByText('Encerrado')).toBeTruthy()
        expect(screen.queryByText('Ex-integrantes')).toBeNull()
    })

    it('sem campos mostra só o rótulo genérico', () => {
        render(<GrupoDestaque group={grupo()} exIntegrantes={[]} integrantes={0} />)
        expect(screen.getByText('Grupo')).toBeTruthy()
        expect(definicoes()).toEqual([])
    })
})
