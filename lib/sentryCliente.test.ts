import { beforeEach, describe, expect, it, vi } from 'vitest'

const { init, captureException } = vi.hoisted(() => ({ init: vi.fn(), captureException: vi.fn() }))
vi.mock('./sentryNucleo', () => ({ init, captureException }))

import { __reiniciarParaTeste, capturarErro, carregarSentry, ehNavegadorAutomatizado, OPCOES_SENTRY_CLIENTE, sentryCarregado } from './sentryCliente'

describe('sentryCliente', () => {
    beforeEach(() => {
        __reiniciarParaTeste()
        init.mockClear()
        captureException.mockClear()
    })

    it('não carrega nada até alguém pedir', () => {
        expect(sentryCarregado()).toBeNull()
        expect(init).not.toHaveBeenCalled()
    })

    // O contrato central: erro que acontece antes do carregamento ocioso não se
    // perde — ele mesmo dispara o carregamento e é enviado quando o SDK chega.
    it('erro antes do carregamento dispara o SDK e é entregue com o contexto', async () => {
        const erro = new Error('cedo demais')
        capturarErro(erro, { tags: { error_boundary: 'site' } })

        await vi.waitFor(() => expect(captureException).toHaveBeenCalledOnce())
        expect(init).toHaveBeenCalledOnce()
        expect(captureException).toHaveBeenCalledWith(erro, { tags: { error_boundary: 'site' } })
    })

    it('inicializa uma única vez, por mais chamadas que cheguem juntas', async () => {
        await Promise.all([carregarSentry(), carregarSentry()])
        capturarErro(new Error('a'))
        capturarErro(new Error('b'))
        await vi.waitFor(() => expect(captureException).toHaveBeenCalledTimes(2))
        expect(init).toHaveBeenCalledOnce()
        expect(sentryCarregado()).not.toBeNull()
    })

    it('nunca lança, mesmo se o SDK falhar ao reportar', async () => {
        captureException.mockImplementationOnce(() => { throw new Error('sdk quebrado') })
        expect(() => capturarErro(new Error('x'))).not.toThrow()
        await vi.waitFor(() => expect(captureException).toHaveBeenCalledOnce())
    })

    it('descarta evento de navegador automatizado (nossas sondas), mantém o de visitante', () => {
        expect(ehNavegadorAutomatizado('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36')).toBe(true)
        expect(ehNavegadorAutomatizado('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36')).toBe(false)
        expect(typeof OPCOES_SENTRY_CLIENTE?.beforeSend).toBe('function')
    })
})
