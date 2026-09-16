// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GroupSocialPresence } from './GroupSocialPresence'

describe('GroupSocialPresence', () => {
    it('não renderiza nada quando não há entries', () => {
        const { container } = render(<GroupSocialPresence entries={[]} accent="#fff" groupName="BTS" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('extrai o @handle do último segmento da URL', () => {
        render(<GroupSocialPresence
            entries={[{ key: 'instagram', href: 'https://instagram.com/bts.bighitofficial', label: 'Instagram' }]}
            accent="#fff" groupName="BTS"
        />)
        expect(screen.getByText('@bts.bighitofficial')).toBeInTheDocument()
    })

    it('não duplica o @ quando o path já começa com @', () => {
        render(<GroupSocialPresence
            entries={[{ key: 'twitter', href: 'https://x.com/@bts_bighit', label: 'X' }]}
            accent="#fff" groupName="BTS"
        />)
        expect(screen.getByText('@bts_bighit')).toBeInTheDocument()
        expect(screen.queryByText('@@bts_bighit')).not.toBeInTheDocument()
    })

    it('cai pro nome do grupo quando a URL não tem handle extraível (path vazio)', () => {
        render(<GroupSocialPresence
            entries={[{ key: 'youtube', href: 'https://youtube.com/', label: 'YouTube' }]}
            accent="#fff" groupName="BTS"
        />)
        expect(screen.getByText('BTS')).toBeInTheDocument()
    })

    it('cai pro nome do grupo quando o último segmento tem menos de 2 caracteres', () => {
        render(<GroupSocialPresence
            entries={[{ key: 'spotify', href: 'https://open.spotify.com/a', label: 'Spotify' }]}
            accent="#fff" groupName="BLACKPINK"
        />)
        expect(screen.getByText('BLACKPINK')).toBeInTheDocument()
    })

    it('cai pro nome do grupo quando a URL é inválida', () => {
        render(<GroupSocialPresence
            entries={[{ key: 'website', href: 'not-a-valid-url', label: 'Site' }]}
            accent="#fff" groupName="aespa"
        />)
        expect(screen.getByText('aespa')).toBeInTheDocument()
    })

    it('usa a meta do platform "website" como fallback pra key desconhecida', () => {
        render(<GroupSocialPresence
            entries={[{ key: 'plataforma-nova-desconhecida', href: 'https://example.com/handle123', label: 'Nova Rede' }]}
            accent="#fff" groupName="BTS"
        />)
        expect(screen.getByText('Nova Rede')).toBeInTheDocument()
        expect(screen.getByText('@handle123')).toBeInTheDocument()
    })

    it('mostra a contagem de plataformas no plural correto', () => {
        render(<GroupSocialPresence
            entries={[
                { key: 'instagram', href: 'https://instagram.com/bts', label: 'Instagram' },
                { key: 'twitter', href: 'https://x.com/bts', label: 'X' },
            ]}
            accent="#fff" groupName="BTS"
        />)
        expect(screen.getByText('2 plataformas')).toBeInTheDocument()
    })

    it('mostra a contagem no singular quando há só 1 plataforma', () => {
        render(<GroupSocialPresence
            entries={[{ key: 'instagram', href: 'https://instagram.com/bts', label: 'Instagram' }]}
            accent="#fff" groupName="BTS"
        />)
        expect(screen.getByText('1 plataforma')).toBeInTheDocument()
    })
})
