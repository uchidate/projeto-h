// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enqueueAdPush, enqueueSlotPush, estadoDoSlot, resetAdQueueForTests } from './adQueue'

describe('adQueue', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        resetAdQueueForTests()
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
        Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    })
    afterEach(() => vi.useRealTimers())

    it('serializa leilões para evitar rajada de processamento', () => {
        const first = vi.fn()
        const second = vi.fn()
        enqueueAdPush(first)
        enqueueAdPush(second)

        expect(first).toHaveBeenCalledOnce()
        expect(second).not.toHaveBeenCalled()
        vi.advanceTimersByTime(400)
        expect(second).toHaveBeenCalledOnce()
    })

    it('não espera window.load quando o placement já está elegível', () => {
        const original = Object.getOwnPropertyDescriptor(document, 'readyState')
        Object.defineProperty(document, 'readyState', { configurable: true, value: 'loading' })
        const auction = vi.fn()

        enqueueAdPush(auction)

        expect(auction).toHaveBeenCalledOnce()
        if (original) Object.defineProperty(document, 'readyState', original)
    })

    it('aguarda a aba voltar a ficar visível', () => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
        const auction = vi.fn()
        enqueueAdPush(auction)
        vi.advanceTimersByTime(5000)
        expect(auction).not.toHaveBeenCalled()

        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
        document.dispatchEvent(new Event('visibilitychange'))
        expect(auction).toHaveBeenCalledOnce()
    })

    it('aguarda a conexão voltar antes de iniciar o leilão', () => {
        Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
        const auction = vi.fn()
        enqueueAdPush(auction)
        vi.advanceTimersByTime(5000)
        expect(auction).not.toHaveBeenCalled()

        Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
        window.dispatchEvent(new Event('online'))
        expect(auction).toHaveBeenCalledOnce()
    })

    describe('estadoDoSlot e enqueueSlotPush', () => {
        function criarIns(largura: number) {
            const ins = document.createElement('ins')
            ins.className = 'adsbygoogle'
            Object.defineProperty(ins, 'offsetWidth', { configurable: true, get: () => largura })
            document.body.appendChild(ins)
            return ins
        }
        afterEach(() => { document.body.innerHTML = '' })

        it('classifica o slot pelo estado no momento', () => {
            expect(estadoDoSlot(null)).toBe('fora_da_pagina')
            expect(estadoDoSlot(document.createElement('ins'))).toBe('fora_da_pagina')
            expect(estadoDoSlot(criarIns(0))).toBe('sem_largura')
            const cheio = criarIns(300)
            cheio.setAttribute('data-adsbygoogle-status', 'done')
            expect(estadoDoSlot(cheio)).toBe('ja_preenchido')
            expect(estadoDoSlot(criarIns(300))).toBe('pronto')
        })

        it('não dá push em slot desmontado enquanto esperava na fila', () => {
            const ins = criarIns(300)
            const push = vi.fn()
            enqueueAdPush(() => ins.remove())
            enqueueSlotPush(() => ins, push)
            vi.advanceTimersByTime(2000)
            expect(push).not.toHaveBeenCalled()
        })

        it('sem largura, espera o slot ganhar largura e só então dá push', () => {
            let largura = 0
            const ins = criarIns(0)
            Object.defineProperty(ins, 'offsetWidth', { configurable: true, get: () => largura })
            let aoRedimensionar: () => void = () => {}
            const RO = vi.fn(function (this: unknown, cb: () => void) {
                aoRedimensionar = cb
                return { observe: vi.fn(), disconnect: vi.fn() }
            })
            vi.stubGlobal('ResizeObserver', RO)
            const push = vi.fn()
            enqueueSlotPush(() => ins, push)
            expect(push).not.toHaveBeenCalled()
            expect(RO).toHaveBeenCalledOnce()
            largura = 320
            aoRedimensionar()
            vi.advanceTimersByTime(2000)
            expect(push).toHaveBeenCalledOnce()
            vi.unstubAllGlobals()
        })
    })
})
