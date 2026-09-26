// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

const { marcarSessaoHumana } = vi.hoisted(() => ({ marcarSessaoHumana: vi.fn() }))
vi.mock('@/lib/analytics', () => ({ marcarSessaoHumana }))

import { SinalDeHumano } from './SinalDeHumano'

// `isTrusted` é propriedade própria e imutável no jsdom: em vez de forjar um Event,
// captura-se o handler que o componente registra e ele é chamado com objetos falsos.
let ouvintes: Record<string, (e: { isTrusted: boolean }) => void>

function gesto(tipo: string, confiavel: boolean) {
    ouvintes[tipo]?.({ isTrusted: confiavel })
}

describe('SinalDeHumano', () => {
    beforeEach(() => {
        marcarSessaoHumana.mockClear()
        ouvintes = {}
        vi.spyOn(window, 'addEventListener').mockImplementation(((tipo: string, fn: (e: { isTrusted: boolean }) => void) => { ouvintes[tipo] = fn }) as never)
        vi.spyOn(window, 'removeEventListener').mockImplementation(((tipo: string) => { delete ouvintes[tipo] }) as never)
    })
    afterEach(() => vi.restoreAllMocks())

    it('escuta só gestos reais (não rolagem: script rola a página)', () => {
        render(<SinalDeHumano />)
        expect(Object.keys(ouvintes).sort()).toEqual(['keydown', 'pointerdown', 'touchstart', 'wheel'])
    })

    it('não marca sem gesto', () => {
        render(<SinalDeHumano />)
        expect(marcarSessaoHumana).not.toHaveBeenCalled()
    })

    it('ignora evento sintético (dispatchEvent de script) e segue esperando', () => {
        render(<SinalDeHumano />)
        gesto('pointerdown', false)
        expect(marcarSessaoHumana).not.toHaveBeenCalled()
        gesto('keydown', true)
        expect(marcarSessaoHumana).toHaveBeenCalledTimes(1)
    })

    it('marca uma vez no primeiro gesto confiável e deixa de escutar', () => {
        render(<SinalDeHumano />)
        gesto('touchstart', true)
        expect(marcarSessaoHumana).toHaveBeenCalledTimes(1)
        expect(Object.keys(ouvintes)).toHaveLength(0)
    })
})
