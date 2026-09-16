// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react'
import userEvent from '@testing-library/user-event'
import { GroupMVPlayer } from './GroupMVPlayer'

function video(title: string, youtubeId = 'dQw4w9WgXcQ') {
    return { title, url: `https://www.youtube.com/watch?v=${youtubeId}` }
}

function postYoutubeMessage(state: number) {
    fireEvent(window, new MessageEvent('message', {
        origin: 'https://www.youtube.com',
        data: JSON.stringify({ event: 'onStateChange', info: state }),
    }))
}

// getByTitle(name, {selector}) não filtra por CSS selector como getByText faz
// — as thumbnails também têm title=mv.title (no <button>), então buscamos o
// <iframe> diretamente no container.
function activeIframe(container: HTMLElement) {
    return container.querySelector('iframe')
}

// O player nasce como thumbnail estática (sem autoplay — ver comentário no
// componente: o autoplay virava um flutuante gigante na primeira rolagem).
// Testes que dependem do iframe dão play primeiro, como o usuário faria.
async function pressPlay() {
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /em destaque/i }))
}

describe('GroupMVPlayer', () => {
    it('não renderiza nada quando não há vídeos', () => {
        const { container } = render(<GroupMVPlayer videos={[]} accent="#000" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('filtra vídeos com URL do YouTube inválida (sem quebrar)', () => {
        const videos = [video('Válido'), { title: 'Inválido', url: 'https://example.com/nao-e-youtube' }]
        render(<GroupMVPlayer videos={videos} accent="#000" />)
        expect(screen.getByText('1 vídeo')).toBeInTheDocument()
    })

    it('mostra a contagem no plural quando há mais de 1 vídeo', () => {
        render(<GroupMVPlayer videos={[video('A'), video('B', 'abcdefghijk')]} accent="#000" />)
        expect(screen.getByText('2 vídeos')).toBeInTheDocument()
    })

    it('nasce como thumbnail com play — NUNCA tocando sozinho (custava ~230px fixos no mobile)', () => {
        const { container } = render(<GroupMVPlayer videos={[video('Dynamite')]} accent="#000" />)
        expect(activeIframe(container)).toBeNull()
        expect(screen.getByRole('button', { name: /em destaque/i })).toBeInTheDocument()
    })

    it('dar play monta o iframe do vídeo em destaque', async () => {
        const { container } = render(<GroupMVPlayer videos={[video('Dynamite')]} accent="#000" />)
        await pressPlay()
        expect(activeIframe(container)).toHaveAttribute('title', 'Dynamite')
    })

    it('fechar o player mostra a thumbnail com botão de play de novo', async () => {
        const user = userEvent.setup()
        render(<GroupMVPlayer videos={[video('Dynamite')]} accent="#000" />)
        await pressPlay()
        await user.click(screen.getByRole('button', { name: /fechar/i }))
        expect(screen.queryByTitle('Dynamite')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: /em destaque/i })).toBeInTheDocument()
    })

    it('não mostra a grid de thumbnails quando há só 1 vídeo', () => {
        render(<GroupMVPlayer videos={[video('Solo')]} accent="#000" />)
        expect(screen.queryAllByTitle('Solo').length).toBeLessThanOrEqual(1)
    })

    it('clicar numa thumbnail troca o vídeo em destaque', async () => {
        const user = userEvent.setup()
        const { container } = render(<GroupMVPlayer videos={[video('Primeiro'), video('Segundo', 'abcdefghijk')]} accent="#000" />)
        await user.click(screen.getByTitle('Segundo'))
        expect(activeIframe(container)).toHaveAttribute('title', 'Segundo')
    })

    it('avança pro próximo vídeo quando o YouTube reporta "ended" (postMessage)', async () => {
        const { container } = render(<GroupMVPlayer videos={[video('Primeiro'), video('Segundo', 'abcdefghijk')]} accent="#000" />)
        await pressPlay()
        expect(activeIframe(container)).toHaveAttribute('title', 'Primeiro')

        act(() => { postYoutubeMessage(0) }) // 0 = ended
        expect(activeIframe(container)).toHaveAttribute('title', 'Segundo')
    })

    it('para de tocar (fecha) quando o último vídeo termina', async () => {
        const { container } = render(<GroupMVPlayer videos={[video('Único')]} accent="#000" />)
        await pressPlay()
        act(() => { postYoutubeMessage(0) })
        expect(activeIframe(container)).toBeNull()
    })

    it('ignora mensagens postMessage de origem diferente do YouTube', async () => {
        const { container } = render(<GroupMVPlayer videos={[video('Primeiro'), video('Segundo', 'abcdefghijk')]} accent="#000" />)
        await pressPlay()
        act(() => {
            fireEvent(window, new MessageEvent('message', {
                origin: 'https://evil.com',
                data: JSON.stringify({ event: 'onStateChange', info: 0 }),
            }))
        })
        expect(activeIframe(container)).toHaveAttribute('title', 'Primeiro')
    })
})
