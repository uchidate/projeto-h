// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const consent = vi.hoisted(() => ({ pode: true }))
vi.mock('@/lib/consent', () => ({
    podeGuardarHistorico: () => consent.pode,
    getBannerState: () => 'oculto',
    getServerBannerState: () => 'oculto',
    subscribeConsent: () => () => {},
    subscribeBanner: () => () => {},
    resetConsent: vi.fn(),
}))

import { EspacoDoFa, type CartaoTorcida } from './EspacoDoFa'

const cartoes: CartaoTorcida[] = [
    { slug: 'army', nome: 'ARMY', cor: '#c6a852', grupos: ['BTS'], grupoSlug: 'bts', foto: null, ano: 2013, encerrado: false },
    { slug: 'blink', nome: 'BLINK', cor: '#ff5fa2', grupos: ['BLACKPINK'], grupoSlug: 'blackpink', foto: null, ano: 2016, encerrado: false },
]

describe('EspacoDoFa', () => {
    beforeEach(() => { localStorage.clear(); consent.pode = true; vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ artigos: [] }) }))) })

    it('com permissão, marcar guarda a torcida no navegador e abre o painel', async () => {
        render(<EspacoDoFa cartoes={cartoes} />)
        await userEvent.click(screen.getAllByRole('button', { name: /Sou dessa/ })[0])
        expect(screen.getByRole('heading', { name: /Sua torcida/ })).toBeInTheDocument()
        expect(localStorage.getItem('hh:torcidas:v1')).toContain('army')
    })

    it('sem permissão, marcar ainda abre o painel na visita, não guarda e explica o motivo', async () => {
        consent.pode = false
        render(<EspacoDoFa cartoes={cartoes} />)
        await userEvent.click(screen.getAllByRole('button', { name: /Sou dessa/ })[0])
        expect(screen.getByRole('heading', { name: /Sua torcida/ })).toBeInTheDocument()
        expect(localStorage.getItem('hh:torcidas:v1')).toBeNull()
        expect(screen.getByRole('note')).toHaveTextContent(/guardar suas torcidas/)
    })
})
