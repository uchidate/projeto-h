// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

const { marcarPerfilTecnico } = vi.hoisted(() => ({ marcarPerfilTecnico: vi.fn() }))
vi.mock('@/lib/analytics', () => ({ marcarPerfilTecnico }))

import { SinalDeRobo } from './SinalDeRobo'

function navegador(webdriver: boolean, userAgent: string) {
    Object.defineProperty(navigator, 'webdriver', { configurable: true, get: () => webdriver })
    Object.defineProperty(navigator, 'userAgent', { configurable: true, get: () => userAgent })
}
const chrome = (v: number) => `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.0.0 Safari/537.36`

describe('SinalDeRobo', () => {
    beforeEach(() => marcarPerfilTecnico.mockClear())
    afterEach(() => navegador(false, chrome(157)))

    it('navegador comum só registra a versão do Chrome', () => {
        navegador(false, chrome(157))
        render(<SinalDeRobo />)
        expect(marcarPerfilTecnico).toHaveBeenCalledWith({ chrome_versao: 157 })
    })

    it('webdriver vira trafego=robo_evidente com o motivo, sem esconder a sessão', () => {
        navegador(true, chrome(145))
        render(<SinalDeRobo />)
        expect(marcarPerfilTecnico).toHaveBeenCalledWith({ trafego: 'robo_evidente', motivo: 'webdriver', chrome_versao: 145 })
    })

    it('HeadlessChrome é reconhecido', () => {
        navegador(false, chrome(146).replace('Chrome/', 'HeadlessChrome/'))
        render(<SinalDeRobo />)
        expect(marcarPerfilTecnico).toHaveBeenCalledWith(expect.objectContaining({ trafego: 'robo_evidente', motivo: 'headless' }))
    })

    it('UA vazio e sem Chrome: marca o robô e não inventa versão', () => {
        navegador(false, '')
        render(<SinalDeRobo />)
        expect(marcarPerfilTecnico).toHaveBeenCalledWith({ trafego: 'robo_evidente', motivo: 'ua_vazio' })
    })
})
