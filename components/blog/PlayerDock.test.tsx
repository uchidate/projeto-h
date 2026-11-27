// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlayerDock } from './PlayerDock'

// jsdom não toca mídia: os métodos só mudam o estado e disparam o evento, como o navegador.
const tocando = new WeakSet<HTMLMediaElement>()
const tocar = (el: HTMLMediaElement) => { tocando.add(el); el.dispatchEvent(new Event('play')) }
const pausar = (el: HTMLMediaElement) => { tocando.delete(el); el.dispatchEvent(new Event('pause')) }
const buscar = (el: HTMLMediaElement, s: number) => { el.currentTime = s; el.dispatchEvent(new Event('seeked')) }

const funcoes = { onAlternar: vi.fn(), onIr: vi.fn(), onFechar: vi.fn(), onBuscar: vi.fn() }
const base = { titulo: 'Magnetic', pausado: true, posicao: 0, duracao: 180_000, ...funcoes }
const audio = () => document.querySelector('audio')!

describe('PlayerDock', () => {
    beforeEach(() => {
        Object.values(funcoes).forEach(f => f.mockReset())
        URL.createObjectURL = vi.fn(() => 'blob:silencio')
        URL.revokeObjectURL = vi.fn()
        vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
        vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) { tocar(this); return Promise.resolve() })
        vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) { pausar(this) })
        vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(function (this: HTMLMediaElement) { return !tocando.has(this) })
        vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(4)
    })
    afterEach(() => vi.restoreAllMocks())

    it('o primeiro toque em tocar, nos controles do navegador, chega ao Spotify', () => {
        render(<PlayerDock {...base} />)
        tocar(audio())
        expect(funcoes.onAlternar).toHaveBeenCalledTimes(1)
    })

    it('o espelho do Spotify não devolve comando, e a pausa do leitor chega', () => {
        render(<PlayerDock {...base} pausado={false} />)
        expect(funcoes.onAlternar).not.toHaveBeenCalled()
        pausar(audio())
        expect(funcoes.onAlternar).toHaveBeenCalledTimes(1)
    })

    it('pausa vinda do Spotify não devolve comando', () => {
        const { rerender } = render(<PlayerDock {...base} pausado={false} />)
        rerender(<PlayerDock {...base} pausado />)
        expect(audio().paused).toBe(true)
        expect(funcoes.onAlternar).not.toHaveBeenCalled()
    })

    it('autoplay recusado não engole a ação seguinte', () => {
        vi.mocked(HTMLMediaElement.prototype.play).mockImplementationOnce(() => Promise.reject(new Error('NotAllowedError')))
        const { rerender } = render(<PlayerDock {...base} pausado={false} />)
        rerender(<PlayerDock {...base} pausado />)
        tocar(audio())
        expect(funcoes.onAlternar).toHaveBeenCalledTimes(1)
    })

    it('ignora a pausa de troca de faixa e a do fim do silêncio', () => {
        render(<PlayerDock {...base} pausado={false} />)
        vi.mocked(Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'readyState')!.get!).mockReturnValueOnce(0)
        pausar(audio())
        vi.spyOn(HTMLMediaElement.prototype, 'ended', 'get').mockReturnValue(true)
        pausar(audio())
        expect(funcoes.onAlternar).not.toHaveBeenCalled()
    })

    it('segue a posição do Spotify sem pedir busca, e repassa a busca do leitor', () => {
        const { rerender } = render(<PlayerDock {...base} />)
        rerender(<PlayerDock {...base} posicao={30_000} />)
        expect(audio().currentTime).toBe(30)
        audio().dispatchEvent(new Event('seeked'))
        expect(funcoes.onBuscar).not.toHaveBeenCalled()
        buscar(audio(), 90)
        expect(funcoes.onBuscar).toHaveBeenCalledWith(90)
    })

    it('mostra a faixa, aciona os botões e libera o áudio ao fechar', async () => {
        const onAnterior = vi.fn()
        const { unmount } = render(<PlayerDock {...base} numero={2} total={5} rotulo="ILLIT" onAnterior={onAnterior} />)
        expect(document.documentElement.dataset.playerDock).toBe('on')
        expect(screen.getByText('· 2/5')).toBeInTheDocument()
        const botoes = screen.getAllByRole('button')
        expect(botoes).toHaveLength(3)
        for (const botao of botoes) await userEvent.click(botao)
        expect(funcoes.onIr).toHaveBeenCalled()
        expect(onAnterior).toHaveBeenCalled()
        expect(funcoes.onFechar).toHaveBeenCalled()
        unmount()
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:silencio')
        expect(document.documentElement.dataset.playerDock).toBeUndefined()
    })
})
