import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { coletarCms, coletarConteudo, coletarBuildInfo, limparEstado } from './collectors'
import { metricas, reiniciarMetricas } from './registry'

function respostaWp(total: string | null, ok = true): Response {
    const headers = new Headers()
    if (total !== null) headers.set('X-WP-Total', total)
    return { ok, headers, json: async () => [] } as unknown as Response
}

async function valorDe(nome: string, labels?: Record<string, string>) {
    const m = await metricas().registro.getMetricsAsJSON()
    const metrica = m.find((x) => x.name === nome)
    if (!metrica) return undefined
    const vals = (metrica as { values: { value: number; labels: Record<string, string> }[] }).values
    if (!labels) return vals[0]?.value
    return vals.find((v) =>
        Object.entries(labels).every(([k, val]) => String(v.labels[k]) === val),
    )?.value
}

describe('coletarCms', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => {
        reiniciarMetricas()
        limparEstado()
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })
    afterEach(() => { vi.unstubAllGlobals() })

    it('marca cms_up=1 quando o WordPress responde', async () => {
        fetchMock.mockResolvedValue(respostaWp(null, true))
        await coletarCms()
        expect(await valorDe('portal_cms_up')).toBe(1)
    })

    it('marca cms_up=0 quando o WordPress falha, sem lançar', async () => {
        fetchMock.mockRejectedValue(new Error('timeout'))
        await expect(coletarCms()).resolves.toBeUndefined()
        expect(await valorDe('portal_cms_up')).toBe(0)
    })

    it('registra a duração mesmo em falha, rotulada como tal', async () => {
        fetchMock.mockRejectedValue(new Error('down'))
        await coletarCms()
        const m = await metricas().registro.getMetricsAsJSON()
        const h = m.find((x) => x.name === 'portal_cms_request_duration_seconds')
        const vals = (h as { values: { labels: Record<string, string> }[] }).values
        expect(vals.some((v) => v.labels.resultado === 'falha')).toBe(true)
    })
})

describe('coletarConteudo', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => {
        reiniciarMetricas()
        limparEstado()
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })
    afterEach(() => { vi.unstubAllGlobals() })

    it('publica a contagem por tipo lida do cabecalho X-WP-Total', async () => {
        fetchMock.mockResolvedValue(respostaWp('42'))
        await coletarConteudo()
        expect(await valorDe('portal_content_items', { tipo: 'artist' })).toBe(42)
    })

    it('NAO publica zero quando o WordPress esta fora — ausencia diz a verdade', async () => {
        fetchMock.mockRejectedValue(new Error('down'))
        await coletarConteudo()
        expect(await valorDe('portal_content_items', { tipo: 'artist' })).toBeUndefined()
        expect(await valorDe('portal_collector_success', { coletor: 'conteudo' })).toBe(0)
    })

    it('serve o snapshot anterior quando a revalidacao falha, em vez de perder o dado', async () => {
        fetchMock.mockResolvedValue(respostaWp('7'))
        await coletarConteudo()
        expect(await valorDe('portal_content_items', { tipo: 'artist' })).toBe(7)

        fetchMock.mockRejectedValue(new Error('down'))
        await coletarConteudo()
        expect(await valorDe('portal_content_items', { tipo: 'artist' })).toBe(7)
    })

    it('nao rebate no WordPress dentro do TTL', async () => {
        fetchMock.mockResolvedValue(respostaWp('3'))
        await coletarConteudo()
        const chamadas = fetchMock.mock.calls.length
        await coletarConteudo()
        expect(fetchMock.mock.calls.length).toBe(chamadas)
    })

    it('expoe a idade do snapshot', async () => {
        fetchMock.mockResolvedValue(respostaWp('1'))
        await coletarConteudo()
        expect(await valorDe('portal_content_snapshot_age_seconds')).toBeGreaterThanOrEqual(0)
    })

    it('ignora X-WP-Total invalido em vez de virar NaN', async () => {
        fetchMock.mockResolvedValue(respostaWp('nao-e-numero'))
        await coletarConteudo()
        expect(await valorDe('portal_content_items', { tipo: 'artist' })).toBeUndefined()
    })
})

describe('coletarBuildInfo', () => {
    beforeEach(() => { reiniciarMetricas(); limparEstado() })

    it('expoe valor 1 com a informacao nos labels', async () => {
        coletarBuildInfo()
        expect(await valorDe('portal_build_info')).toBe(1)
    })
})
