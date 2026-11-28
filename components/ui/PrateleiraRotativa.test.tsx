// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import type { StoreProduct } from '@/lib/wordpress/store'

const m = vi.hoisted(() => ({ vista: vi.fn(), sortear: vi.fn() }))

vi.mock('@/lib/analytics', () => ({ trackVitrineVista: m.vista }))
vi.mock('@/lib/wordpress/store-rotacao', () => ({ sortearComDescoberta: m.sortear }))
vi.mock('@/lib/wordpress/garantir-loja', () => ({ garantirLoja: (lista: unknown[]) => lista }))
vi.mock('@/components/ui/StoreCard', () => ({ StoreCard: ({ product }: { product: { id: number } }) => <div data-testid="produto">{product.id}</div> }))

import { PrateleiraRotativa } from './PrateleiraRotativa'
import { VitrineVista } from './VitrineVista'

const produto = (id: number, descoberta = false) => ({ id, descoberta }) as unknown as StoreProduct
const CHAVE = 'hh:loja:vistos'

let avisar: (visivel: boolean) => void
const desligar = vi.fn()
class Observador {
    constructor(cb: (e: { isIntersecting: boolean }[]) => void) { avisar = v => cb([{ isIntersecting: v }]) }
    observe() {}
    disconnect() { desligar() }
}

beforeEach(() => {
    localStorage.clear()
    m.vista.mockReset()
    m.sortear.mockReset().mockImplementation((p: StoreProduct[], _d: unknown, n: number) => p.slice(-n))
    desligar.mockReset()
    vi.stubGlobal('IntersectionObserver', Observador)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('VitrineVista', () => {
    it('conta a vitrine uma só vez, quando entra na tela', () => {
        render(<VitrineVista contexto="artigo" produtoIds={[1, 2]}><span>filho</span></VitrineVista>)
        act(() => avisar(false))
        expect(m.vista).not.toHaveBeenCalled()
        act(() => { avisar(true); avisar(true) })
        expect(m.vista).toHaveBeenCalledTimes(1)
        expect(m.vista).toHaveBeenCalledWith({ contexto: 'artigo', produtoIds: [1, 2], descobertaIds: [] })
    })

    it('vitrine vazia ou navegador sem observador não mede nada', () => {
        render(<VitrineVista contexto="a" produtoIds={[]}>x</VitrineVista>)
        vi.stubGlobal('IntersectionObserver', undefined)
        render(<VitrineVista contexto="b" produtoIds={[1]}>y</VitrineVista>)
        expect(desligar).not.toHaveBeenCalled()
        expect(m.vista).not.toHaveBeenCalled()
    })
})

describe('PrateleiraRotativa', () => {
    it('mostra o sorteio, guarda o que foi visto e mede só o que aparece', () => {
        localStorage.setItem(CHAVE, JSON.stringify([9, 'lixo', 8]))
        render(<PrateleiraRotativa produtos={[produto(1), produto(2), produto(3, true)]} contexto="ficha" quantidade={2} />)
        expect(screen.getAllByTestId('produto').map(e => e.textContent)).toEqual(['2', '3'])
        expect(m.sortear.mock.calls[0][3]).toEqual(new Set([9, 8]))
        expect(JSON.parse(localStorage.getItem(CHAVE)!)).toEqual([2, 3, 9, 8])
        act(() => avisar(true))
        expect(m.vista).toHaveBeenCalledWith({ contexto: 'ficha', produtoIds: [2, 3], descobertaIds: [3] })
    })

    it.each(['{quebrado', '{"a":1}'])('histórico inválido (%s) é ignorado', (salvo) => {
        localStorage.setItem(CHAVE, salvo)
        render(<PrateleiraRotativa produtos={[1, 2, 3, 4, 5, 6].map(n => produto(n))} contexto="ficha" />)
        expect(screen.getAllByTestId('produto')).toHaveLength(5)
        expect(m.sortear.mock.calls[0][3]).toEqual(new Set())
    })
})
