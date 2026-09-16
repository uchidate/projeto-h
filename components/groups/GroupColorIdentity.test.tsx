// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupColorIdentity } from './GroupColorIdentity'

describe('GroupColorIdentity', () => {
    it('mostra o hex em maiúsculas', () => {
        render(<GroupColorIdentity officialColor="#e91e8c" groupName="BTS" />)
        expect(screen.getAllByText('#E91E8C').length).toBeGreaterThan(0)
    })

    it('converte o hex pra RGB corretamente', () => {
        render(<GroupColorIdentity officialColor="#ff0000" groupName="BTS" />)
        expect(screen.getByText('255, 0, 0')).toBeInTheDocument()
    })

    it('converte o hex pra HSL corretamente (vermelho puro = 0°, 100%, 50%)', () => {
        render(<GroupColorIdentity officialColor="#ff0000" groupName="BTS" />)
        expect(screen.getByText('0, 100%, 50%')).toBeInTheDocument()
    })

    it('converte preto/branco/cinza pra HSL sem saturação (acromático)', () => {
        render(<GroupColorIdentity officialColor="#808080" groupName="BTS" />)
        expect(screen.getByText(/^0, 0%, \d+%$/)).toBeInTheDocument()
    })

    // @testing-library/user-event instala seu próprio stub de clipboard em
    // window.navigator.clipboard assim que userEvent.setup() roda (pra suportar
    // .copy()/.cut()/.paste()) — sobrescreve qualquer mock feito ANTES do
    // setup(). Por isso, criamos o user primeiro e espionamos o writeText do
    // PRÓPRIO stub do user-event, em vez de tentar mockar navigator.clipboard
    // manualmente (que seria descartado de qualquer forma).
    it('clicar na faixa de cor copia o hex pro clipboard e mostra "copiado!"', async () => {
        const user = userEvent.setup()
        render(<GroupColorIdentity officialColor="#e91e8c" groupName="BTS" />)
        const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText')
        await user.click(screen.getByTitle(/clique para copiar/i))
        expect(writeTextSpy).toHaveBeenCalledWith('#e91e8c')
        expect(await screen.findByText(/copiado!/i)).toBeInTheDocument()
    })

    it('não mostra fã-clube/lightstick quando não são passados', () => {
        render(<GroupColorIdentity officialColor="#e91e8c" groupName="BTS" />)
        expect(screen.queryByText(/♡/)).not.toBeInTheDocument()
        expect(screen.queryByText(/✦/)).not.toBeInTheDocument()
    })

    it('mostra o nome do fã-clube quando passado', () => {
        render(<GroupColorIdentity officialColor="#e91e8c" groupName="BTS" fanClubName="ARMY" />)
        expect(screen.getByText(/army/i)).toBeInTheDocument()
    })

    it('mostra o lightstick quando passado', () => {
        render(<GroupColorIdentity officialColor="#e91e8c" groupName="BTS" lightstick="Bomb (ver. 3)" />)
        expect(screen.getByText(/bomb \(ver\. 3\)/i)).toBeInTheDocument()
    })
})
