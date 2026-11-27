// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { alternarPendente, lerPendentes } from '@/lib/estadoPendente'
import { SincronizaPendentes } from './SincronizaPendentes'

let sessao: { data: unknown; status: string }
vi.mock('next-auth/react', () => ({ useSession: () => sessao }))

const gravar = vi.fn()
vi.mock('@/lib/wordpress/userApi', () => ({ setContentState: (...args: unknown[]) => gravar(...args) }))

const logado = () => ({ data: { user: { name: 'Fã' } }, status: 'authenticated' })

describe('SincronizaPendentes', () => {
    const avisos: unknown[] = []
    const ouvir = (e: Event) => avisos.push((e as CustomEvent).detail)

    beforeEach(() => {
        window.localStorage.clear()
        gravar.mockReset().mockResolvedValue({})
        avisos.length = 0
        sessao = logado()
        window.addEventListener('oc-content-state:changed', ouvir)
        alternarPendente('artist', 1, 'following')
        alternarPendente('group', 2, 'following')
    })
    afterEach(() => window.removeEventListener('oc-content-state:changed', ouvir))

    it('sem login não envia nada', () => {
        sessao = { data: null, status: 'unauthenticated' }
        render(<SincronizaPendentes />)
        expect(gravar).not.toHaveBeenCalled()
        expect(lerPendentes()).toHaveLength(2)
    })

    it('grava na conta, limpa o navegador e avisa os botões', async () => {
        render(<SincronizaPendentes />)
        await waitFor(() => expect(lerPendentes()).toEqual([]))
        expect(gravar).toHaveBeenCalledTimes(2)
        expect(avisos).toEqual([
            { objectType: 'artist', objectId: 1, state: 'following' },
            { objectType: 'group', objectId: 2, state: 'following' },
        ])
    })

    it('mantém só o que falhou, sem avisar por ele', async () => {
        gravar.mockRejectedValueOnce(new Error('rede'))
        render(<SincronizaPendentes />)
        await waitFor(() => expect(avisos).toHaveLength(1))
        expect(lerPendentes()).toEqual([{ objectType: 'artist', objectId: 1, state: 'following' }])
    })

    it('segue até o fim quando a sessão é revalidada no meio', async () => {
        let liberar = () => {}
        gravar.mockImplementationOnce(() => new Promise<void>(resolve => { liberar = resolve }))
        const { rerender } = render(<SincronizaPendentes />)
        sessao = logado()
        rerender(<SincronizaPendentes />)
        liberar()
        await waitFor(() => expect(lerPendentes()).toEqual([]))
        expect(gravar).toHaveBeenCalledTimes(2)
    })

    it('funciona com o efeito montado duas vezes (StrictMode)', async () => {
        render(<StrictMode><SincronizaPendentes /></StrictMode>)
        await waitFor(() => expect(lerPendentes()).toEqual([]))
        expect(gravar).toHaveBeenCalledTimes(2)
    })

    it('para de enviar quando o componente sai da tela, sem perder o restante', async () => {
        let liberar = () => {}
        gravar.mockImplementationOnce(() => new Promise<void>(resolve => { liberar = resolve }))
        const { unmount } = render(<SincronizaPendentes />)
        unmount()
        liberar()
        await waitFor(() => expect(lerPendentes()).toHaveLength(1))
        expect(gravar).toHaveBeenCalledTimes(1)
    })
})
