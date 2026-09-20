import { describe, it, expect } from 'vitest'
import {
    parseAcfDate,
    toIsoDateString,
    formatDate,
    getYear,
    getAge,
    getSocialUrl,
    extractYoutubeId,
    toSpotifyEmbedUrl,
    stripHtml,
    removeTags,
} from './utils'

describe('parseAcfDate', () => {
    it('parses YYYYMMDD without dashes', () => {
        const d = parseAcfDate('19951013')
        expect(d.getFullYear()).toBe(1995)
        expect(d.getMonth()).toBe(9) // 0-indexed
        expect(d.getDate()).toBe(13)
    })

    it('parses ISO YYYY-MM-DD', () => {
        const d = parseAcfDate('2024-03-05')
        expect(d.getFullYear()).toBe(2024)
        expect(d.getMonth()).toBe(2)
        expect(d.getDate()).toBe(5)
    })

    it('passes through a Date instance unchanged', () => {
        const original = new Date(2020, 0, 1)
        expect(parseAcfDate(original)).toBe(original)
    })
})

describe('toIsoDateString', () => {
    // Regressão: birthDate no JSON-LD chegava como "19951013" (inválido para
    // schema.org Date, que exige YYYY-MM-DD) — bug encontrado em 2026-07-05.
    it('converts raw ACF YYYYMMDD to YYYY-MM-DD', () => {
        expect(toIsoDateString('19951013')).toBe('1995-10-13')
    })

    it('keeps already-ISO dates unchanged', () => {
        expect(toIsoDateString('2024-03-05')).toBe('2024-03-05')
    })

    it('returns undefined for empty/missing input', () => {
        expect(toIsoDateString(undefined)).toBeUndefined()
        expect(toIsoDateString('')).toBeUndefined()
    })

    it('returns undefined for unparseable formats instead of a garbage string', () => {
        expect(toIsoDateString('não é uma data')).toBeUndefined()
        expect(toIsoDateString('2024/03/05')).toBeUndefined()
    })
})

describe('getYear', () => {
    it('extracts year from YYYYMMDD', () => {
        expect(getYear('20190212')).toBe(2019)
    })

    it('returns null for missing input', () => {
        expect(getYear(undefined)).toBeNull()
    })
})

describe('getAge', () => {
    it('computes age correctly before the birthday in the current year', () => {
        const today = new Date(2026, 5, 1) // 1 jun 2026
        expect(getAge('19951013', today)).toBe(30) // aniversário só em outubro
    })

    it('computes age correctly after the birthday in the current year', () => {
        const today = new Date(2026, 10, 1) // 1 nov 2026
        expect(getAge('19951013', today)).toBe(31)
    })

    it('returns null for missing date', () => {
        expect(getAge(undefined)).toBeNull()
    })

    it('returns null for a future date', () => {
        expect(getAge('20990101', new Date(2026, 0, 1))).toBeNull()
    })
})

describe('getSocialUrl', () => {
    // Regressão: sameAs no JSON-LD virava "https://x.com/https://x.com/BTS_twt"
    // quando o campo do WP já vinha como URL completa — bug em buildSameAsUrls
    // (removido em 2026-07-05). getSocialUrl é a versão correta, já em uso em
    // produção — este teste documenta o comportamento esperado.
    it('passes through an already-complete x.com URL unchanged (no double-prefix)', () => {
        expect(getSocialUrl('https://x.com/BTS_twt', 'x')).toBe('https://x.com/BTS_twt')
    })

    it('builds an instagram URL from a bare handle', () => {
        expect(getSocialUrl('j.m', 'instagram')).toBe('https://www.instagram.com/j.m/')
    })

    it('strips a leading @ from a handle', () => {
        expect(getSocialUrl('@j.m', 'instagram')).toBe('https://www.instagram.com/j.m/')
    })

    it('rejects a URL from the wrong network', () => {
        expect(getSocialUrl('https://instagram.com/foo', 'x')).toBeNull()
    })

    it('returns null for empty input', () => {
        expect(getSocialUrl(undefined, 'instagram')).toBeNull()
        expect(getSocialUrl('', 'x')).toBeNull()
    })

    it('rejects handles with invalid characters', () => {
        expect(getSocialUrl('foo bar/baz', 'instagram')).toBeNull()
    })
})

describe('extractYoutubeId', () => {
    it('extracts from a watch URL', () => {
        expect(extractYoutubeId('https://www.youtube.com/watch?v=abc123XYZ_9')).toBe('abc123XYZ_9')
    })

    it('extracts from a short youtu.be URL', () => {
        expect(extractYoutubeId('https://youtu.be/abc123XYZ_9')).toBe('abc123XYZ_9')
    })

    it('extracts from a shorts URL', () => {
        expect(extractYoutubeId('https://www.youtube.com/shorts/abc123XYZ_9')).toBe('abc123XYZ_9')
    })

    it('returns null for a non-matching URL', () => {
        expect(extractYoutubeId('https://example.com')).toBeNull()
    })

    it('returns null for empty input', () => {
        expect(extractYoutubeId('')).toBeNull()
    })
})

describe('toSpotifyEmbedUrl', () => {
    it('converts an artist URL to embed form', () => {
        expect(toSpotifyEmbedUrl('https://open.spotify.com/artist/123'))
            .toBe('https://open.spotify.com/embed/artist/123?utm_source=generator&theme=0')
    })

    it('returns null for a non-spotify URL', () => {
        expect(toSpotifyEmbedUrl('https://example.com/artist/123')).toBeNull()
    })

    it('returns null for a malformed URL', () => {
        expect(toSpotifyEmbedUrl('not a url')).toBeNull()
    })
})

describe('stripHtml', () => {
    it('removes tags and decodes basic entities', () => {
        expect(stripHtml('<p>Hello &amp; welcome</p>')).toBe('Hello & welcome')
    })

    it('handles empty input', () => {
        expect(stripHtml('')).toBe('')
    })
})

describe('formatDate', () => {
    it('formats a raw ACF date in pt-BR', () => {
        // Não fixamos o dia exato (varia por timezone do runner), só a presença do ano.
        expect(formatDate('20240305')).toContain('2024')
    })
})

describe('removeTags', () => {
    it('mantém texto comum intacto', () => {
        expect(removeTags('<p>Olá <b>mundo</b></p>')).toBe('Olá mundo')
    })

    it('não deixa tag inteira sobrar em aninhamento proposital', () => {
        const saida = removeTags('<scr<script>ipt>alert(1)</scr</script>ipt>')
        expect(saida).not.toMatch(/<[^>]*>/)
    })

    it('é idempotente — aplicar de novo não muda', () => {
        const uma = removeTags('<scr<script>ipt>alert(1)</scr</script>ipt>')
        expect(removeTags(uma)).toBe(uma)
    })
})
