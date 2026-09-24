import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { purgarCloudflare } from './cloudflare-purge'

const fetchMock = vi.fn()

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    process.env.CLOUDFLARE_PURGE_TOKEN = 'tk'
    process.env.CLOUDFLARE_ZONE_ID = 'zona1'
})
afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.CLOUDFLARE_PURGE_TOKEN
    delete process.env.CLOUDFLARE_ZONE_ID
})

describe('purgarCloudflare', () => {
    it('não faz nada sem token ou sem zona', async () => {
        delete process.env.CLOUDFLARE_PURGE_TOKEN
        expect(await purgarCloudflare(['https://www.x.com/a'])).toEqual({ ok: false, reason: 'disabled' })
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('envia as URLs por POST, sem duplicatas e só https', async () => {
        fetchMock.mockResolvedValue({ ok: true })
        const r = await purgarCloudflare(['https://www.x.com/a', 'https://www.x.com/a', 'http://inseguro/b', 'https://www.x.com/en/a'])
        expect(r).toEqual({ ok: true, purgadas: 2 })
        const [url, init] = fetchMock.mock.calls[0]
        expect(url).toBe('https://api.cloudflare.com/client/v4/zones/zona1/purge_cache')
        expect(JSON.parse(init.body)).toEqual({ files: ['https://www.x.com/a', 'https://www.x.com/en/a'] })
        expect(init.headers.Authorization).toBe('Bearer tk')
    })

    it('divide em lotes de 30', async () => {
        fetchMock.mockResolvedValue({ ok: true })
        const urls = Array.from({ length: 65 }, (_, i) => `https://www.x.com/p${i}`)
        expect(await purgarCloudflare(urls)).toEqual({ ok: true, purgadas: 65 })
        expect(fetchMock).toHaveBeenCalledTimes(3)
    })

    it('nunca lança: devolve o motivo em erro de HTTP e de rede', async () => {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 403 })
        expect(await purgarCloudflare(['https://www.x.com/a'])).toEqual({ ok: false, reason: 'http', detail: '403' })
        fetchMock.mockRejectedValueOnce(new Error('timeout'))
        expect(await purgarCloudflare(['https://www.x.com/a'])).toEqual({ ok: false, reason: 'network', detail: 'timeout' })
    })

    it('sem URL válida, não chama a API', async () => {
        expect(await purgarCloudflare(['http://x'])).toEqual({ ok: false, reason: 'no-urls' })
        expect(fetchMock).not.toHaveBeenCalled()
    })
})
