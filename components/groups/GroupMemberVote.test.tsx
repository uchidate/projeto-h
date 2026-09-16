// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupMemberVote } from './GroupMemberVote'
import type { WPArtist } from '@/lib/wordpress/types'

function member(id: number, name: string): WPArtist {
    return { id, slug: `m${id}`, title: { rendered: name }, acf: {} } as WPArtist
}

const MEMBERS = [member(1, 'Jimin'), member(2, 'Jungkook'), member(3, 'Taehyung')]

describe('GroupMemberVote', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('não renderiza nada quando não há membros', () => {
        const { container } = render(<GroupMemberVote members={[]} accent="#000" groupName="BTS" groupSlug="bts" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('antes de votar, mostra a pergunta e um botão por membro', async () => {
        render(<GroupMemberVote members={MEMBERS} accent="#000" groupName="BTS" groupSlug="bts" />)
        expect(await screen.findByText(/em quem você vota no bts/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /jimin/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /jungkook/i })).toBeInTheDocument()
    })

    it('votar persiste no localStorage e trava (não deixa votar de novo)', async () => {
        const user = userEvent.setup()
        render(<GroupMemberVote members={MEMBERS} accent="#000" groupName="BTS" groupSlug="bts" />)
        await user.click(await screen.findByRole('button', { name: /jimin/i }))

        expect(localStorage.getItem('oc_vote_bts')).toBe('1')
        expect(await screen.findByText(/você votou em jimin/i)).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /jungkook/i })).not.toBeInTheDocument()
    })

    it('restaura o voto já feito ao remontar (localStorage já preenchido)', async () => {
        localStorage.setItem('oc_vote_bts', '2')
        localStorage.setItem('oc_vote_counts_bts', JSON.stringify({ 1: 10, 2: 20, 3: 5 }))
        render(<GroupMemberVote members={MEMBERS} accent="#000" groupName="BTS" groupSlug="bts" />)
        expect(await screen.findByText(/você votou em jungkook/i)).toBeInTheDocument()
    })

    it('mostra o ranking ordenado por contagem de votos (maior primeiro)', async () => {
        localStorage.setItem('oc_vote_bts', '1')
        localStorage.setItem('oc_vote_counts_bts', JSON.stringify({ 1: 5, 2: 30, 3: 10 }))
        render(<GroupMemberVote members={MEMBERS} accent="#000" groupName="BTS" groupSlug="bts" />)
        await screen.findByText(/você votou em jimin/i)

        const names = screen.getAllByText(/^(Jimin|Jungkook|Taehyung)$/).map(el => el.textContent)
        expect(names).toEqual(['Jungkook', 'Taehyung', 'Jimin'])
    })

    it('calcula a porcentagem de cada membro com base no total de votos', async () => {
        localStorage.setItem('oc_vote_bts', '1')
        localStorage.setItem('oc_vote_counts_bts', JSON.stringify({ 1: 25, 2: 50, 3: 25 }))
        render(<GroupMemberVote members={MEMBERS} accent="#000" groupName="BTS" groupSlug="bts" />)
        await screen.findByText(/você votou em jimin/i)
        expect(screen.getByText('50%')).toBeInTheDocument()
        expect(screen.getAllByText('25%')).toHaveLength(2)
    })

    it('cada instância usa uma chave de localStorage isolada por groupSlug', async () => {
        const user = userEvent.setup()
        render(<GroupMemberVote members={MEMBERS} accent="#000" groupName="BTS" groupSlug="bts" />)
        await user.click(await screen.findByRole('button', { name: /jimin/i }))
        expect(localStorage.getItem('oc_vote_blackpink')).toBeNull()
    })
})
