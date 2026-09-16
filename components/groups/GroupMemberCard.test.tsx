// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GroupMemberCard } from './GroupMemberCard'
import type { WPArtist } from '@/lib/wordpress/types'

function member(overrides: Partial<WPArtist> = {}): WPArtist {
    return {
        id: 1,
        slug: 'membro-teste',
        title: { rendered: 'Membro Teste' },
        featured_image_url: null,
        _embedded: undefined,
        blood_type: undefined,
        acf: {},
        ...overrides,
    } as unknown as WPArtist
}

describe('GroupMemberCard', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-07-04T12:00:00Z'))
    })
    afterEach(() => vi.useRealTimers())

    it('linka pro perfil do artista via /artists/{slug}', () => {
        render(<GroupMemberCard member={member()} accent="#e91e8c" />)
        expect(screen.getByRole('link')).toHaveAttribute('href', '/artists/membro-teste')
    })

    it('mostra o nome sem tags HTML', () => {
        render(<GroupMemberCard member={member({ title: { rendered: 'Membro &amp; Teste' } })} accent="#000" />)
        expect(screen.getByText('Membro & Teste')).toBeInTheDocument()
    })

    it('calcula idade corretamente quando o aniversário já passou este ano', () => {
        render(<GroupMemberCard member={member({ acf: { birth_date: '2000-01-01' } })} accent="#000" />)
        expect(screen.getAllByText(/26 anos/).length).toBeGreaterThan(0)
    })

    it('calcula idade corretamente quando o aniversário ainda não chegou este ano', () => {
        render(<GroupMemberCard member={member({ acf: { birth_date: '2000-12-25' } })} accent="#000" />)
        expect(screen.getAllByText(/25 anos/).length).toBeGreaterThan(0)
    })

    it('não mostra idade quando não há data de nascimento', () => {
        render(<GroupMemberCard member={member()} accent="#000" />)
        expect(screen.queryByText(/anos/)).not.toBeInTheDocument()
    })

    it('congela a idade na morte quando há death_date', () => {
        render(<GroupMemberCard member={member({ acf: { birth_date: '1975-03-02', death_date: '2023-12-27' } })} accent="#000" />)
        expect(screen.getAllByText(/48 anos ao morrer/).length).toBeGreaterThan(0)
        expect(screen.queryByText(/51 anos/)).not.toBeInTheDocument()
    })

    it('mostra a data de falecimento junto à de nascimento', () => {
        render(<GroupMemberCard member={member({ acf: { birth_date: '1975-03-02', death_date: '2023-12-27' } })} accent="#000" />)
        expect(screen.getByText(/02 de março de 1975 — 27 de dezembro de 2023/)).toBeInTheDocument()
    })

    it('positions têm prioridade sobre roles genéricos do ACF', () => {
        render(<GroupMemberCard member={member({ acf: { roles: ['singer'] } })} accent="#000" positions={['leader']} />)
        expect(screen.getByText('Líder')).toBeInTheDocument()
        expect(screen.queryByText('Cantor(a)')).not.toBeInTheDocument()
    })

    it('mostra múltiplas positions concatenadas', () => {
        render(<GroupMemberCard member={member()} accent="#000" positions={['leader', 'main_rapper']} />)
        expect(screen.getByText('Líder · Main Rapper')).toBeInTheDocument()
    })

    it('sem positions, usa o primeiro role do ACF traduzido', () => {
        render(<GroupMemberCard member={member({ acf: { roles: ['rapper', 'dancer'] } })} accent="#000" />)
        expect(screen.getByText('Rapper')).toBeInTheDocument()
    })

    it('mostra a badge "ex" quando isFormer é true', () => {
        render(<GroupMemberCard member={member()} accent="#000" isFormer />)
        expect(screen.getByText('ex')).toBeInTheDocument()
    })

    it('não mostra a badge "ex" por padrão', () => {
        render(<GroupMemberCard member={member()} accent="#000" />)
        expect(screen.queryByText('ex')).not.toBeInTheDocument()
    })

    it('mostra o nome em hangul quando presente', () => {
        render(<GroupMemberCard member={member({ acf: { name_hangul: '한글이름' } })} accent="#000" />)
        expect(screen.getByText('한글이름')).toBeInTheDocument()
    })

    it('mostra o signo do zodíaco baseado na data de nascimento', () => {
        render(<GroupMemberCard member={member({ acf: { birth_date: '2000-04-01' } })} accent="#000" />)
        expect(screen.getByTitle(/áries/i)).toBeInTheDocument()
    })

    it('mostra tipo sanguíneo junto ao zodíaco quando presente', () => {
        render(<GroupMemberCard member={member({ acf: { birth_date: '2000-04-01' }, blood_type: 'A' })} accent="#000" />)
        expect(screen.getByTitle(/áries.*tipo a/i)).toBeInTheDocument()
    })

    it('renderiza fallback com a inicial do nome quando não há imagem', () => {
        render(<GroupMemberCard member={member()} accent="#e91e8c" />)
        expect(screen.getByText('M')).toBeInTheDocument()
    })
})
