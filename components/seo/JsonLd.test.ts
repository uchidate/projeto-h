import { describe, it, expect } from 'vitest'
import { omitNulls } from './JsonLd'

describe('omitNulls (JSON.stringify replacer)', () => {
    // Regressão: campos ACF vazios (ex: numberOfEpisodes de um filme) chegavam
    // como null e JSON.stringify normal mantém null literal, gerando
    // "numberOfEpisodes": null no schema.org — tipo inválido, reportado pelo
    // Google Rich Results. Corrigido em 2026-07-05.
    it('drops top-level null fields entirely', () => {
        const out = JSON.stringify({ a: 1, b: null, c: 'x' }, omitNulls)
        expect(JSON.parse(out)).toEqual({ a: 1, c: 'x' })
    })

    it('drops nested null fields', () => {
        const out = JSON.stringify({ a: { b: null, c: 2 } }, omitNulls)
        expect(JSON.parse(out)).toEqual({ a: { c: 2 } })
    })

    it('keeps undefined behavior unchanged (already omitted by JSON.stringify)', () => {
        const out = JSON.stringify({ a: 1, b: undefined }, omitNulls)
        expect(JSON.parse(out)).toEqual({ a: 1 })
    })

    it('keeps falsy-but-valid values (0, false, empty string)', () => {
        const out = JSON.stringify({ a: 0, b: false, c: '' }, omitNulls)
        expect(JSON.parse(out)).toEqual({ a: 0, b: false, c: '' })
    })

    it('keeps arrays and array items intact', () => {
        const out = JSON.stringify({ list: [1, null, 3] }, omitNulls)
        // JSON.stringify substitui itens de array omitidos por `null` (não remove o slot) —
        // isso é comportamento padrão do JSON.stringify com replacer, documentamos aqui
        // pra não ser reintroduzido como bug depois.
        expect(JSON.parse(out)).toEqual({ list: [1, null, 3] })
    })
})

import { buildVideoSchema, extractYoutubeIds } from '@/lib/seo/jsonld'

describe('vídeos do YouTube no artigo', () => {
    it('extrai ids únicos de embeds comuns e nocookie', () => {
        const html = '<iframe src="https://www.youtube-nocookie.com/embed/vxyzFk_z-Wc"></iframe>'
            + '<iframe src="https://www.youtube.com/embed/vxyzFk_z-Wc"></iframe>'
            + '<iframe src="https://www.youtube.com/embed/AAAAAAAAAAA"></iframe>'
        expect(extractYoutubeIds(html)).toEqual(['vxyzFk_z-Wc', 'AAAAAAAAAAA'])
    })

    it('monta VideoObject com os campos obrigatórios', () => {
        const v = buildVideoSchema({ id: 'vxyzFk_z-Wc', name: 'T', description: 'D', uploadDate: '2026-01-01' })
        expect(v['@type']).toBe('VideoObject')
        expect(v.thumbnailUrl[0]).toContain('vxyzFk_z-Wc')
        expect(v.embedUrl).toBe('https://www.youtube.com/embed/vxyzFk_z-Wc')
    })
})
