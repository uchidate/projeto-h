import { createRequire } from 'node:module'
import { describe, expect, it, vi } from 'vitest'

const { instalarSonda } = createRequire(import.meta.url)('./sonda-wordpress.cjs')

const base = {
    url: 'https://wp.example.test/wp-json',
    cabecalho: 'X-Sonda',
    arquivo: '/run/secrets/token',
    ler: () => 'segredo-de-teste\n',
}

function montar(opcoes: Record<string, unknown> = {}) {
    const original = vi.fn(async () => new Response('ok'))
    const alvo = { fetch: original as unknown as typeof fetch }
    const instalada = instalarSonda({ ...base, alvo, ...opcoes })
    return { alvo, original, instalada }
}

function cabecalhosEnviados(original: ReturnType<typeof vi.fn>) {
    const [, init] = original.mock.calls[0] as unknown as [unknown, RequestInit | undefined]
    return new Headers(init?.headers)
}

describe('sonda do build', () => {
    it('acrescenta o cabeçalho na origem do WordPress e preserva o resto', async () => {
        const { alvo, original } = montar()

        await alvo.fetch('https://wp.example.test/wp-json/wp/v2/posts', {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
        })

        const headers = cabecalhosEnviados(original)
        expect(headers.get('X-Sonda')).toBe('segredo-de-teste')
        expect(headers.get('Accept')).toBe('application/json')
        expect(original.mock.calls[0]).toEqual([
            'https://wp.example.test/wp-json/wp/v2/posts',
            expect.objectContaining({ cache: 'no-store' }),
        ])
    })

    it('mantém os cabeçalhos de um Request e aceita URL', async () => {
        const comRequest = montar()
        await comRequest.alvo.fetch(new Request('https://wp.example.test/a', { headers: { Accept: 'text/html' } }))
        expect(cabecalhosEnviados(comRequest.original).get('Accept')).toBe('text/html')
        expect(cabecalhosEnviados(comRequest.original).get('X-Sonda')).toBe('segredo-de-teste')

        const comUrl = montar()
        await comUrl.alvo.fetch(new URL('https://wp.example.test/b'))
        expect(cabecalhosEnviados(comUrl.original).get('X-Sonda')).toBe('segredo-de-teste')
    })

    it.each([
        'https://outro.example.test/wp-json',
        'https://wp.example.test.invasor.test/',
        'http://wp.example.test/wp-json',
        '/caminho-relativo',
    ])('não envia o token para %s', async (endereco) => {
        const { alvo, original } = montar()
        await alvo.fetch(endereco)
        expect(original.mock.calls[0]).toEqual([endereco, undefined])
    })

    it.each([
        ['sem URL', { url: undefined }],
        ['sem nome do cabeçalho', { cabecalho: '' }],
        ['sem caminho do token', { arquivo: undefined }],
        ['com URL inválida', { url: 'nada' }],
        ['com token vazio', { ler: () => '  \n' }],
        ['sem o arquivo do token', { ler: () => { throw new Error('ENOENT') } }],
    ])('não instala nada %s', (_caso, opcoes) => {
        const { alvo, original, instalada } = montar(opcoes)
        expect(instalada).toBe(false)
        expect(alvo.fetch).toBe(original)
    })
})
