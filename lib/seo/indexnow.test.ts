import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    buildIndexNowUrl,
    buildLocalizedIndexNowUrls,
    dedupeSize,
    getIndexNowKey,
    indexNowKeyLocation,
    INDEXNOW_ENDPOINT,
    INDEXNOW_MAX_URLS,
    isSubmittableUrl,
    resetIndexNowDedupe,
    submitToIndexNow,
} from './indexnow'

const CHAVE = 'a1b2c3d4e5f60718293a4b5c6d7e8f90'
const env = { INDEXNOW_KEY: CHAVE } as unknown as NodeJS.ProcessEnv
const ok = () => Promise.resolve(new Response('', { status: 200 }))

/** Lê o corpo JSON da n-ésima chamada, sem espalhar casts pelos testes. */
function corpoDa(fetchImpl: ReturnType<typeof vi.fn>, indice = 0): { urlList: string[]; [k: string]: unknown } {
    const init = fetchImpl.mock.calls[indice]?.[1] as RequestInit | undefined
    return JSON.parse(String(init?.body))
}

beforeEach(() => resetIndexNowDedupe())

describe('getIndexNowKey', () => {
    it('aceita chave no formato da especificação', () => {
        expect(getIndexNowKey(env)).toBe(CHAVE)
    })

    it('recusa chave ausente, curta demais ou com caractere inválido', () => {
        for (const valor of [undefined, '', 'curta', `${CHAVE}$`, 'com espaco no meio', 'a'.repeat(129)]) {
            expect(getIndexNowKey({ INDEXNOW_KEY: valor } as unknown as NodeJS.ProcessEnv)).toBeNull()
        }
    })

    // Colar do 1Password costuma trazer quebra de linha junto; sem o trim isso
    // vira 403 silencioso em toda submissão.
    it('tolera espaço e quebra de linha em volta', () => {
        expect(getIndexNowKey({ INDEXNOW_KEY: `  ${CHAVE}\n` } as unknown as NodeJS.ProcessEnv)).toBe(CHAVE)
    })
})

describe('buildIndexNowUrl', () => {
    it('monta a URL pública de cada tipo com página própria', () => {
        expect(buildIndexNowUrl('artist', 'nayeon')).toBe('https://www.example.com/artists/nayeon')
        expect(buildIndexNowUrl('post', 'meu-post')).toBe('https://www.example.com/blog/meu-post')
        expect(buildIndexNowUrl('food', 'kimchi')).toBe('https://www.example.com/comidas/kimchi')
        expect(buildIndexNowUrl('company', 'hybe')).toBe('https://www.example.com/empresas/hybe')
    })

    // music_release não tem página própria; submeter ensinaria o buscador a 404.
    it('recusa tipo sem página pública', () => {
        expect(buildIndexNowUrl('music_release', 'qualquer')).toBeNull()
    })

    it('recusa slug vazio, com barra, com .. ou que precise de escape', () => {
        for (const slug of ['', '   ', 'a/b', '../etc', 'com espaço', 'çé']) {
            expect(buildIndexNowUrl('artist', slug)).toBeNull()
        }
    })
})

describe('isSubmittableUrl', () => {
    it('aceita apenas https do host canônico', () => {
        expect(isSubmittableUrl('https://www.example.com/artists/iu')).toBe(true)
    })

    it('recusa outro host, http, credenciais e fragmento', () => {
        expect(isSubmittableUrl('https://exemplo.com/artists/iu')).toBe(false)
        expect(isSubmittableUrl('http://www.example.com/artists/iu')).toBe(false)
        expect(isSubmittableUrl('https://user:pw@www.example.com/x')).toBe(false)
        expect(isSubmittableUrl('https://www.example.com/x#a')).toBe(false)
        expect(isSubmittableUrl('não é url')).toBe(false)
    })

    // example.com sem www é host diferente para o protocolo: devolveria 422.
    it('recusa o mesmo domínio sem o www canônico', () => {
        expect(isSubmittableUrl('https://example.com/artists/iu')).toBe(false)
    })
})

describe('submitToIndexNow', () => {
    it('envia o corpo no formato da especificação', async () => {
        const fetchImpl = vi.fn(ok)
        const r = await submitToIndexNow(['https://www.example.com/artists/iu'], { fetchImpl, env })

        expect(r).toEqual({ ok: true, submitted: ['https://www.example.com/artists/iu'], status: 200 })
        const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
        expect(url).toBe(INDEXNOW_ENDPOINT)
        expect(init.method).toBe('POST')
        expect(corpoDa(fetchImpl)).toEqual({
            host: 'www.example.com',
            key: CHAVE,
            keyLocation: indexNowKeyLocation(CHAVE),
            urlList: ['https://www.example.com/artists/iu'],
        })
    })

    it('não chama a rede quando a chave não está configurada', async () => {
        const fetchImpl = vi.fn(ok)
        const r = await submitToIndexNow(['https://www.example.com/x'], { fetchImpl, env: {} as NodeJS.ProcessEnv })
        expect(r).toEqual({ ok: false, reason: 'disabled', detail: expect.any(String) })
        expect(fetchImpl).not.toHaveBeenCalled()
    })

    it('descarta URLs de outro host antes de enviar', async () => {
        const fetchImpl = vi.fn(ok)
        await submitToIndexNow(
            ['https://exemplo.com/invasor', 'https://www.example.com/artists/iu'],
            { fetchImpl, env },
        )
        expect(corpoDa(fetchImpl).urlList)
            .toEqual(['https://www.example.com/artists/iu'])
    })

    it('não chama a rede quando nenhuma URL sobrevive à validação', async () => {
        const fetchImpl = vi.fn(ok)
        const r = await submitToIndexNow(['https://exemplo.com/x', 'lixo'], { fetchImpl, env })
        expect(r).toEqual({ ok: false, reason: 'no-valid-urls' })
        expect(fetchImpl).not.toHaveBeenCalled()
    })

    // O WP dispara o webhook várias vezes para a mesma edição; reenviar em
    // rajada é justamente o que o 429 do protocolo pune.
    it('deduplica a mesma URL dentro da janela', async () => {
        const fetchImpl = vi.fn(ok)
        const url = 'https://www.example.com/artists/iu'
        await submitToIndexNow([url], { fetchImpl, env })
        const segunda = await submitToIndexNow([url], { fetchImpl, env })

        expect(segunda).toEqual({ ok: false, reason: 'no-valid-urls' })
        expect(fetchImpl).toHaveBeenCalledTimes(1)
    })

    it('reenvia depois de a janela expirar', async () => {
        const fetchImpl = vi.fn(ok)
        const url = 'https://www.example.com/artists/iu'
        await submitToIndexNow([url], { fetchImpl, env, now: () => 0 })
        await submitToIndexNow([url], { fetchImpl, env, now: () => 11 * 60 * 1000 })
        expect(fetchImpl).toHaveBeenCalledTimes(2)
    })

    it('force ignora a deduplicação', async () => {
        const fetchImpl = vi.fn(ok)
        const url = 'https://www.example.com/artists/iu'
        await submitToIndexNow([url], { fetchImpl, env })
        await submitToIndexNow([url], { fetchImpl, env, force: true })
        expect(fetchImpl).toHaveBeenCalledTimes(2)
    })

    it('remove duplicatas dentro do mesmo lote', async () => {
        const fetchImpl = vi.fn(ok)
        const url = 'https://www.example.com/artists/iu'
        await submitToIndexNow([url, url, url], { fetchImpl, env })
        expect(corpoDa(fetchImpl).urlList).toEqual([url])
    })

    it('corta o lote no teto configurado', async () => {
        const fetchImpl = vi.fn(ok)
        const urls = Array.from({ length: INDEXNOW_MAX_URLS + 25 }, (_, i) => `https://www.example.com/blog/p-${i}`)
        await submitToIndexNow(urls, { fetchImpl, env })
        expect(corpoDa(fetchImpl).urlList)
            .toHaveLength(INDEXNOW_MAX_URLS)
    })

    it('devolve o status em erro HTTP, sem lançar', async () => {
        const fetchImpl = vi.fn(() => Promise.resolve(new Response('', { status: 429 })))
        const r = await submitToIndexNow(['https://www.example.com/artists/iu'], { fetchImpl, env })
        expect(r).toEqual({ ok: false, reason: 'http-error', status: 429 })
    })

    // Um 429 não pode "queimar" a URL: assim que a causa passar, ela precisa
    // poder ser reenviada.
    it('não marca como enviada quando o endpoint recusa', async () => {
        const falha = vi.fn(() => Promise.resolve(new Response('', { status: 403 })))
        const url = 'https://www.example.com/artists/iu'
        await submitToIndexNow([url], { fetchImpl: falha, env })
        expect(dedupeSize()).toBe(0)

        const sucesso = vi.fn(ok)
        expect((await submitToIndexNow([url], { fetchImpl: sucesso, env })).ok).toBe(true)
    })

    it('converte falha de rede em resultado, sem lançar', async () => {
        const fetchImpl = vi.fn(() => Promise.reject(new Error('timeout')))
        const r = await submitToIndexNow(['https://www.example.com/artists/iu'], { fetchImpl, env })
        expect(r).toEqual({ ok: false, reason: 'network-error', detail: 'timeout' })
    })
})

describe('buildLocalizedIndexNowUrls', () => {
    it('submete o idioma ativo com tradução publicada e ignora idioma desligado', () => {
        expect(buildLocalizedIndexNowUrls('artist', 'nayeon', ['en'])).toEqual(['https://www.example.com/en/artists/nayeon'])
        expect(buildLocalizedIndexNowUrls('artist', 'nayeon', ['es'])).toEqual([])
    })

    it('ignora tipos sem versão em outro idioma e slug inválido', () => {
        expect(buildLocalizedIndexNowUrls('post', 'meu-post', ['en'])).toEqual([])
        expect(buildLocalizedIndexNowUrls('artist', '../x', ['en'])).toEqual([])
    })
})
