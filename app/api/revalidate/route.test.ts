import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const revalidateTagMock = vi.fn()
vi.mock('next/cache', () => ({ revalidateTag: (tag: string) => revalidateTagMock(tag) }))

// `after` adia a chamada externa para depois da resposta. Nos testes ele roda
// na hora, senão a submissão ficaria pendurada fora do alcance da asserção.
const submitMock = vi.fn(async (_urls: string[]) => ({ ok: true as const, submitted: [] as string[], status: 200 }))
vi.mock('next/server', async () => {
    const real = await vi.importActual<typeof import('next/server')>('next/server')
    return { ...real, after: (fn: () => unknown) => { void fn() } }
})
vi.mock('@/lib/seo/indexnow', async () => {
    const real = await vi.importActual<typeof import('@/lib/seo/indexnow')>('@/lib/seo/indexnow')
    return { ...real, submitToIndexNow: (urls: string[]) => submitMock(urls) }
})

// Com o inglês ativo, a rota consulta as traduções publicadas antes de avisar
// o IndexNow. Sem simular essa leitura, o teste dependeria da rede.
const traducoesMock = vi.fn(async (_path: string, _opts?: unknown): Promise<Array<{ translations?: Record<string, unknown> | null }>> => [])
vi.mock('@/lib/wordpress/client', async () => {
    const real = await vi.importActual<typeof import('@/lib/wordpress/client')>('@/lib/wordpress/client')
    return { ...real, wpBuscarOpcional: (path: string, opts?: unknown) => traducoesMock(path, opts) }
})

const { POST } = await import('./route')

function makeRequest(body: unknown, secret = 'correct-secret') {
    return new NextRequest(`http://localhost/api/revalidate?secret=${secret}`, {
        method: 'POST',
        body: JSON.stringify(body),
    })
}

describe('POST /api/revalidate', () => {
    beforeEach(() => {
        revalidateTagMock.mockClear()
        submitMock.mockClear()
        vi.stubEnv('REVALIDATE_SECRET', 'correct-secret')
    })

    it('rejeita secret incorreto com 401', async () => {
        const res = await POST(makeRequest({ type: 'artist', slug: 'jimin' }, 'secret-errado'))
        expect(res.status).toBe(401)
        expect(revalidateTagMock).not.toHaveBeenCalled()
    })

    it('rejeita quando REVALIDATE_SECRET não está configurado (fail-closed)', async () => {
        vi.stubEnv('REVALIDATE_SECRET', '')
        const res = await POST(makeRequest({ type: 'artist', slug: 'jimin' }, ''))
        expect(res.status).toBe(401)
    })

    it('rejeita body inválido (não-JSON)', async () => {
        const req = new NextRequest('http://localhost/api/revalidate?secret=correct-secret', {
            method: 'POST',
            body: '{ quebrado',
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it('rejeita type desconhecido', async () => {
        const res = await POST(makeRequest({ type: 'quiz_question', slug: 'x' }))
        expect(res.status).toBe(400)
    })

    // Regressão: music_release foi adicionado a isWPPostType em 2026-07-04 —
    // antes disso, o webhook de revalidate rejeitava esse tipo com 400.
    it('aceita music_release e invalida a tag certa', async () => {
        const res = await POST(makeRequest({ type: 'music_release', slug: 'some-release' }))
        expect(res.status).toBe(200)
        expect(revalidateTagMock).toHaveBeenCalledWith('music-releases')
    })

    it('invalida a tag de item específico quando slug é passado', async () => {
        await POST(makeRequest({ type: 'artist', slug: 'jimin' }))
        expect(revalidateTagMock).toHaveBeenCalledWith('artist-jimin')
    })

    it('não invalida tag de item quando slug está ausente', async () => {
        await POST(makeRequest({ type: 'artist' }))
        const calledTags = revalidateTagMock.mock.calls.map(c => c[0])
        expect(calledTags.some((t: string) => t.startsWith('artist-'))).toBe(false)
    })

    it('trata store_product como caso especial, sem checar isWPPostType', async () => {
        const res = await POST(makeRequest({ type: 'store_product' }))
        expect(res.status).toBe(200)
        expect(revalidateTagMock).toHaveBeenCalledWith('store-products')
        // não deveria disparar as tags genéricas de post/production/artist
        expect(revalidateTagMock).toHaveBeenCalledTimes(1)
    })

    // Regressão: os botões do admin do WP chamam ?tag=<tag> com POST sem corpo.
    // A rota exigia JSON e devolvia 400 — o admin dizia "revalidado" e nada era.
    describe('chamada por ?tag= (botões do admin do WP)', () => {
        function tagRequest(tag: string) {
            return new NextRequest(`http://localhost/api/revalidate?secret=correct-secret&tag=${tag}`, { method: 'POST' })
        }

        it('invalida a tag de coleção sem exigir corpo JSON', async () => {
            const res = await tagRequest('artists')
            const out = await POST(res)
            expect(out.status).toBe(200)
            expect(revalidateTagMock).toHaveBeenCalledWith('artists')
        })

        it('aceita tag de item', async () => {
            await POST(tagRequest('artist-jimin'))
            expect(revalidateTagMock).toHaveBeenCalledWith('artist-jimin')
        })

        it('normaliza music-release-<slug> para o formato que as páginas registram', async () => {
            await POST(tagRequest('music-release-golden'))
            expect(revalidateTagMock).toHaveBeenCalledWith('music_release-golden')
        })

        it('rejeita tag desconhecida em vez de invalidar às cegas', async () => {
            const res = await POST(tagRequest('inventada'))
            expect(res.status).toBe(400)
            expect(revalidateTagMock).not.toHaveBeenCalled()
        })
    })

    // Regressão: qualquer webhook invalidava posts + productions + artists +
    // trending + site-settings, derrubando o cache do site inteiro.
    it('invalida só a coleção do tipo e o que deriva dela', async () => {
        await POST(makeRequest({ type: 'food', slug: 'kimchi' }))
        expect(revalidateTagMock.mock.calls.map(c => c[0]).sort()).toEqual(['food-kimchi', 'foods'])
    })

    it('artista arrasta a lista de trending, mas não posts nem productions', async () => {
        await POST(makeRequest({ type: 'artist', slug: 'jimin' }))
        const tags = revalidateTagMock.mock.calls.map(c => c[0])
        expect(tags).toContain('artists-trending')
        expect(tags).not.toContain('posts')
        expect(tags).not.toContain('site-settings')
    })

    it('invalida somente a configuração de monetização', async () => {
        const res = await POST(makeRequest({ type: 'monetization' }))
        expect(res.status).toBe(200)
        expect(revalidateTagMock).toHaveBeenCalledWith('monetization')
        expect(revalidateTagMock).toHaveBeenCalledTimes(1)
    })

    describe('aviso ao IndexNow', () => {
        it('submete a URL pública do conteúdo alterado', async () => {
            await POST(makeRequest({ type: 'artist', slug: 'nayeon' }))
            await vi.waitFor(() => expect(submitMock).toHaveBeenCalled())
            expect(submitMock).toHaveBeenCalledWith(['https://www.example.com/artists/nayeon'])
        })

        it('inclui a URL em inglês quando a tradução está publicada', async () => {
            traducoesMock.mockResolvedValueOnce([{ translations: { en: {} } }])
            await POST(makeRequest({ type: 'artist', slug: 'nayeon' }))
            await vi.waitFor(() => expect(submitMock).toHaveBeenCalled())
            expect(submitMock).toHaveBeenCalledWith(['https://www.example.com/artists/nayeon', 'https://www.example.com/en/artists/nayeon'])
        })

        it('não submete quando o tipo não tem página pública', async () => {
            await POST(makeRequest({ type: 'music_release', slug: 'algum-single' }))
            expect(submitMock).not.toHaveBeenCalled()
        })

        it('não submete sem slug — a coleção não tem URL única', async () => {
            await POST(makeRequest({ type: 'artist' }))
            expect(submitMock).not.toHaveBeenCalled()
        })

        // A revalidação de cache é o serviço essencial; o IndexNow é acessório
        // e não pode derrubar o webhook do WordPress se falhar.
        it('responde 200 mesmo se a submissão rejeitar', async () => {
            submitMock.mockRejectedValueOnce(new Error('rede fora'))
            const res = await POST(makeRequest({ type: 'artist', slug: 'nayeon' }))
            expect(res.status).toBe(200)
            expect(revalidateTagMock).toHaveBeenCalled()
        })
    })
})
