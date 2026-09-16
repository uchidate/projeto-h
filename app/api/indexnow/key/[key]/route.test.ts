import { describe, it, expect, vi, afterEach } from 'vitest'
import { GET } from './route'

const CHAVE = 'a1b2c3d4e5f60718293a4b5c6d7e8f90'
const pedir = (key: string) =>
    GET(new Request(`https://www.example.com/${key}.txt`), { params: Promise.resolve({ key }) })

afterEach(() => vi.unstubAllEnvs())

describe('GET /<chave>.txt', () => {
    it('devolve a chave em texto puro quando ela confere', async () => {
        vi.stubEnv('INDEXNOW_KEY', CHAVE)
        const res = await pedir(CHAVE)

        expect(res.status).toBe(200)
        expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8')
        // O arquivo deve conter exatamente a chave — nada de quebra de linha.
        expect(await res.text()).toBe(CHAVE)
    })

    it('devolve 404 quando a chave pedida é outra', async () => {
        vi.stubEnv('INDEXNOW_KEY', CHAVE)
        expect((await pedir('b'.repeat(32))).status).toBe(404)
    })

    // Sem chave configurada o arquivo não existe; servir vazio faria o buscador
    // registrar uma verificação inválida.
    it('devolve 404 quando não há chave configurada', async () => {
        vi.stubEnv('INDEXNOW_KEY', '')
        expect((await pedir(CHAVE)).status).toBe(404)
    })

    it('devolve 404 quando a chave configurada é malformada', async () => {
        vi.stubEnv('INDEXNOW_KEY', 'curta')
        expect((await pedir('curta')).status).toBe(404)
    })

    it('marca a resposta como noindex', async () => {
        vi.stubEnv('INDEXNOW_KEY', CHAVE)
        expect((await pedir(CHAVE)).headers.get('X-Robots-Tag')).toBe('noindex')
    })
})
