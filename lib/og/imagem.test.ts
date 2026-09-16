import { describe, expect, it, vi } from 'vitest'
import sharp from 'sharp'
import { prepararImagemParaOg, tipoNativoDoSatori } from './imagem'

describe('prepararImagemParaOg', () => {
    const bytes = new Uint8Array([1, 2, 3])

    it('PNG, JPEG e GIF passam sem conversão', async () => {
        const converter = vi.fn()
        for (const tipo of ['image/png', 'image/jpeg', 'image/gif', 'image/jpeg; charset=binary']) {
            expect(tipoNativoDoSatori(tipo)).toBe(true)
            expect(await prepararImagemParaOg(tipo, bytes, converter)).toEqual({ tipo: tipo.split(';')[0], bytes })
        }
        expect(converter).not.toHaveBeenCalled()
    })

    it('WebP é convertido para JPEG (o satori quebra com WebP — Sentry PHP-27)', async () => {
        const webp = new Uint8Array(await sharp({ create: { width: 40, height: 20, channels: 3, background: '#e91e8c' } }).webp().toBuffer())
        const r = await prepararImagemParaOg('image/webp', webp)
        expect(r?.tipo).toBe('image/jpeg')
        expect((await sharp(r!.bytes).metadata()).format).toBe('jpeg')
    })

    it('conversão que falha vira OG sem fundo, não erro', async () => {
        expect(await prepararImagemParaOg('image/avif', bytes, () => Promise.reject(new Error('corrompida')))).toBeNull()
    })

    it('não imagem ou vazio é descartado', async () => {
        expect(await prepararImagemParaOg('text/html', bytes)).toBeNull()
        expect(await prepararImagemParaOg('image/png', new Uint8Array())).toBeNull()
    })
})
